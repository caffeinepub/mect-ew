import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { SectionVisit } from "../backend";
import { useActor } from "../hooks/useActor";

// ─── Label / flag helpers ────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  home: "Inicio",
  sobre_mi: "Sobre mí",
  "sobre-mi": "Sobre mí",
  about: "Sobre mí",
  analisis: "Análisis",
  analysis: "Análisis",
  consultorias: "Consultorías",
  consultancy: "Consultorías",
  consultoría: "Consultorías",
  mentorias: "Mentorías",
  mentoring: "Mentorías",
  contacto: "Contacto",
  contact: "Contacto",
};

function getSectionLabel(section: string): string {
  const key = section.toLowerCase().replace(/\s+/g, "-");
  return SECTION_LABELS[key] ?? section;
}

const SECTION_ORDER = [
  "home",
  "about",
  "sobre_mi",
  "sobre-mi",
  "analisis",
  "analysis",
  "consultorias",
  "consultancy",
  "mentorias",
  "mentoring",
  "contacto",
  "contact",
];

const COUNTRY_FLAGS: Record<string, string> = {
  AR: "🇦🇷",
  UY: "🇺🇾",
  US: "🇺🇸",
  ES: "🇪🇸",
  MX: "🇲🇽",
  BR: "🇧🇷",
  CL: "🇨🇱",
  CO: "🇨🇴",
  PE: "🇵🇪",
  PY: "🇵🇾",
  BO: "🇧🇴",
  VE: "🇻🇪",
  EC: "🇪🇨",
  GB: "🇬🇧",
  DE: "🇩🇪",
  FR: "🇫🇷",
  IT: "🇮🇹",
  CA: "🇨🇦",
  AU: "🇦🇺",
  JP: "🇯🇵",
  CN: "🇨🇳",
  IN: "🇮🇳",
  RU: "🇷🇺",
  ZA: "🇿🇦",
};

function getFlag(code: string): string {
  return COUNTRY_FLAGS[code.toUpperCase()] ?? "🌐";
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

interface SectionStat {
  section: string;
  count: number;
  avgDuration: number;
  countries: { code: string; name: string; count: number }[];
}

type VisitEntry = [bigint, SectionVisit];

function getCountryCode(v: SectionVisit): string {
  const c = v.country as CountryInfo | undefined;
  if (!c) return "XX";
  if (typeof c === "object" && "code" in c) return String(c.code).toUpperCase();
  return "XX";
}

function getCountryName(v: SectionVisit): string {
  const c = v.country as CountryInfo | undefined;
  if (!c) return "Desconocido";
  if (typeof c === "object" && "name" in c) return String(c.name);
  return "Desconocido";
}

function getDuration(v: SectionVisit): number {
  const d = v.duration as bigint | bigint[] | undefined;
  if (typeof d === "bigint") return Number(d);
  if (Array.isArray(d) && d.length > 0) return Number(d[0]);
  return 0;
}

type CountryInfo = { code: string; name: string };

// ─── SVG icons ───────────────────────────────────────────────────────────────

const RefreshIcon = ({ spin }: { spin?: boolean }) => (
  <svg
    aria-hidden="true"
    className={`h-3.5 w-3.5 ${spin ? "animate-spin" : ""}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const XIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
  isDanger?: boolean;
}

function ConfirmDialog({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isPending,
  isDanger,
}: ConfirmDialogProps) {
  return (
    <div className="border border-gray-700 bg-black p-4 space-y-3">
      <p className="text-sm text-gray-300">{message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className={`px-4 py-1.5 text-sm border transition-colors disabled:opacity-50 ${
            isDanger
              ? "border-gray-600 text-red-400 hover:border-red-700 hover:bg-red-950/30"
              : "border-gray-600 text-red-400 hover:border-red-700 hover:bg-red-950/30"
          }`}
          data-ocid="analytics.confirm_delete"
        >
          {isPending ? "Eliminando..." : confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-4 py-1.5 text-sm border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition-colors disabled:opacity-50"
          data-ocid="analytics.cancel_delete"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SectionAnalyticsPanel() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const [confirmDeleteId, setConfirmDeleteId] = useState<bigint | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const {
    data: visitEntries,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useQuery<VisitEntry[]>({
    queryKey: ["sectionVisits"],
    queryFn: async () => actor!.getSectionVisitRecords(),
    enabled: !!actor && !actorFetching,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const deleteMutation = useMutation({
    mutationFn: async (visitId: bigint) => {
      if (typeof actor?.deleteSectionVisitRecord !== "function")
        throw new Error("deleteSectionVisitRecord no disponible");
      await actor.deleteSectionVisitRecord(visitId);
    },
    onSuccess: () => {
      setConfirmDeleteId(null);
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ["sectionVisits"] });
      showSuccess("Registro eliminado.");
    },
    onError: (err: unknown) => {
      setErrorMsg(`Error al eliminar registro: ${String(err)}`);
      setConfirmDeleteId(null);
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      if (typeof actor?.deleteAllSectionVisitRecords !== "function")
        throw new Error("deleteAllSectionVisitRecords no disponible");
      await actor.deleteAllSectionVisitRecords();
    },
    onSuccess: () => {
      setConfirmDeleteAll(false);
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ["sectionVisits"] });
      showSuccess("Todos los registros fueron eliminados.");
    },
    onError: (err: unknown) => {
      setErrorMsg(`Error al eliminar registros: ${String(err)}`);
      setConfirmDeleteAll(false);
    },
  });

  // ─── Derived data ───────────────────────────────────────────────────────────

  const visits = useMemo(
    () => visitEntries?.map(([, v]) => v) ?? [],
    [visitEntries],
  );

  const stats = useMemo((): SectionStat[] => {
    if (!visits || visits.length === 0) return [];
    const map = new Map<
      string,
      {
        durations: number[];
        countries: Map<string, { name: string; count: number }>;
      }
    >();

    for (const v of visits) {
      const key = v.section.toLowerCase();
      if (!map.has(key)) map.set(key, { durations: [], countries: new Map() });
      const entry = map.get(key)!;
      entry.durations.push(getDuration(v));
      const cc = getCountryCode(v);
      if (!entry.countries.has(cc))
        entry.countries.set(cc, { name: getCountryName(v), count: 0 });
      entry.countries.get(cc)!.count++;
    }

    const result: SectionStat[] = [];
    for (const [section, data] of map.entries()) {
      const total = data.durations.reduce((a, b) => a + b, 0);
      const countries = Array.from(data.countries.entries())
        .map(([code, { name, count }]) => ({ code, name, count }))
        .sort((a, b) => b.count - a.count);
      result.push({
        section,
        count: data.durations.length,
        avgDuration: Math.round(total / data.durations.length),
        countries,
      });
    }

    return result.sort((a, b) => {
      const ai = SECTION_ORDER.findIndex((s) => a.section.includes(s));
      const bi = SECTION_ORDER.findIndex((s) => b.section.includes(s));
      if (ai === -1 && bi === -1) return b.count - a.count;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [visits]);

  const totalVisits = visits.length;

  const uniqueCountries = useMemo(() => {
    if (!visits) return 0;
    return new Set(visits.map((v) => getCountryCode(v))).size;
  }, [visits]);

  const recentVisits = useMemo(() => {
    if (!visitEntries) return [];
    return [...visitEntries]
      .sort((a, b) => Number(b[1].timestamp - a[1].timestamp))
      .slice(0, 50);
  }, [visitEntries]);

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header bar ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Analíticas del Sitio
          </h2>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-0.5">
              Última actualización: {lastUpdated}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Bulk delete */}
          <button
            type="button"
            onClick={() => setConfirmDeleteAll(true)}
            disabled={totalVisits === 0 || deleteAllMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-700 text-red-400 hover:border-red-800 hover:bg-red-950/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Borrar todos los registros"
            data-ocid="analytics.delete_all"
          >
            <TrashIcon />
            Borrar todo
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-colors disabled:opacity-50"
            data-ocid="analytics.refresh"
          >
            <RefreshIcon spin={isFetching} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── Success message ── */}
      {successMsg && (
        <div className="border border-gray-700 bg-gray-900/60 px-4 py-2.5 flex items-center justify-between">
          <p className="text-sm text-gray-300">{successMsg}</p>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-gray-500 hover:text-white ml-4"
          >
            <XIcon />
          </button>
        </div>
      )}

      {/* ── Error message ── */}
      {errorMsg && (
        <div
          className="border border-gray-700 bg-gray-900/40 px-4 py-2.5 flex items-center justify-between"
          data-ocid="analytics.error_msg"
        >
          <p className="text-sm text-red-400">{errorMsg}</p>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-gray-500 hover:text-white ml-4"
          >
            <XIcon />
          </button>
        </div>
      )}

      {/* ── Confirm delete single ── */}
      {confirmDeleteId !== null && (
        <ConfirmDialog
          message="¿Confirmar eliminación de este registro? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          onConfirm={() => deleteMutation.mutate(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
          isPending={deleteMutation.isPending}
          isDanger
        />
      )}

      {/* ── Confirm delete all ── */}
      {confirmDeleteAll && (
        <ConfirmDialog
          message="¿Estás seguro de que querés eliminar TODOS los registros de analíticas? Esta acción no se puede deshacer."
          confirmLabel="Sí, borrar todos"
          onConfirm={() => deleteAllMutation.mutate()}
          onCancel={() => setConfirmDeleteAll(false)}
          isPending={deleteAllMutation.isPending}
          isDanger
        />
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div
          className="flex items-center justify-center py-16"
          data-ocid="analytics.loading_state"
        >
          <svg
            aria-hidden="true"
            className="animate-spin h-6 w-6 text-gray-500"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="ml-3 text-gray-500 text-sm">
            Cargando analíticas...
          </span>
        </div>
      )}

      {/* ── Error loading ── */}
      {isError && (
        <div
          className="border border-gray-800 bg-gray-900/30 p-4"
          data-ocid="analytics.error_state"
        >
          <p className="text-red-400 text-sm">
            Error al cargar analíticas: {String(error)}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-xs text-gray-500 underline hover:text-white"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Main content ── */}
      {!isLoading && !isError && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: totalVisits, label: "Visitas Totales" },
              { value: stats.length, label: "Secciones" },
              { value: uniqueCountries, label: "Países" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="border border-gray-800 bg-gray-950 p-5 text-center"
                data-ocid="analytics.summary_card"
              >
                <p className="text-4xl font-bold text-white tabular-nums">
                  {value}
                </p>
                <p className="text-[10px] text-gray-500 mt-1.5 uppercase tracking-widest font-medium">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {totalVisits === 0 && (
            <div
              className="border border-gray-800 p-12 text-center"
              data-ocid="analytics.empty_state"
            >
              <svg
                aria-hidden="true"
                className="h-10 w-10 text-gray-800 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="text-gray-600 text-sm">
                Aún no hay visitas registradas.
              </p>
              <p className="text-gray-700 text-xs mt-1">
                Las visitas de tus visitantes aparecerán aquí automáticamente.
              </p>
            </div>
          )}

          {/* Per-section stats */}
          {stats.length > 0 && (
            <div>
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">
                Por Sección
              </h3>
              <div className="space-y-2">
                {stats.map((stat) => (
                  <div
                    key={stat.section}
                    className="border border-gray-800 bg-gray-950 p-4"
                  >
                    {/* Section header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-baseline gap-3 min-w-0">
                        <p className="font-semibold text-white text-sm">
                          {getSectionLabel(stat.section)}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          Prom. {formatDuration(stat.avgDuration)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className="text-2xl font-bold text-white tabular-nums">
                          {stat.count}
                        </span>
                        <span className="text-xs text-gray-600">
                          {stat.count === 1 ? "visita" : "visitas"}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-px bg-gray-800 mb-3">
                      <div
                        className="h-px bg-gray-400"
                        style={{
                          width: `${Math.min(100, (stat.count / totalVisits) * 100)}%`,
                        }}
                      />
                    </div>

                    {/* Country breakdown */}
                    {stat.countries.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {stat.countries.slice(0, 12).map((c) => (
                          <span
                            key={c.code}
                            className="inline-flex items-center gap-1 text-xs text-gray-400 border border-gray-800 px-2 py-0.5 bg-black"
                          >
                            <span className="text-base leading-none">
                              {getFlag(c.code)}
                            </span>
                            <span>{c.name}</span>
                            <span className="text-gray-600 font-medium">
                              {c.count}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent visits table */}
          {recentVisits.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                  Visitas Recientes
                </h3>
                <span className="text-[10px] text-gray-700 uppercase tracking-wider">
                  {recentVisits.length} registros
                </span>
              </div>

              <div className="border border-gray-800 overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_1.5fr_80px_130px_40px] text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-4 py-2.5 border-b border-gray-800 bg-black">
                  <span>Sección</span>
                  <span>Origen</span>
                  <span>Duración</span>
                  <span>Fecha</span>
                  <span />
                </div>

                {/* Table rows */}
                {recentVisits.map(([id, v], idx) => (
                  <div
                    key={String(id)}
                    className={`grid grid-cols-[1fr_1.5fr_80px_130px_40px] items-center text-sm px-4 py-2.5 border-b border-gray-900 last:border-0 transition-colors hover:bg-gray-900/40 ${
                      idx % 2 === 0 ? "bg-transparent" : "bg-gray-950/60"
                    }`}
                    data-ocid="analytics.visit_row"
                  >
                    <span className="text-gray-300 text-xs font-medium truncate">
                      {getSectionLabel(v.section)}
                    </span>

                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="text-lg leading-none flex-shrink-0">
                        {getFlag(getCountryCode(v))}
                      </span>
                      <span className="text-gray-400 text-xs truncate">
                        {getCountryName(v)}
                      </span>
                    </span>

                    <span className="text-gray-500 text-xs tabular-nums">
                      {formatDuration(getDuration(v))}
                    </span>

                    <span className="text-gray-600 text-xs tabular-nums">
                      {formatDate(v.timestamp)}
                    </span>

                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(id)}
                        disabled={
                          deleteMutation.isPending && confirmDeleteId === id
                        }
                        className="text-gray-700 hover:text-red-400 transition-colors disabled:opacity-50 p-1"
                        title="Eliminar registro"
                        aria-label="Eliminar registro"
                        data-ocid="analytics.delete_row"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
