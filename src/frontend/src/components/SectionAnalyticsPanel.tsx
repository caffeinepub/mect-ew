import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { SectionVisit } from "../backend";
import { useActor } from "../hooks/useActor";

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

const COUNTRY_FLAGS: Record<string, string> = {
  AR: "🇦🇷",
  US: "🇺🇸",
  ES: "🇪🇸",
  MX: "🇲🇽",
  BR: "🇧🇷",
  CL: "🇨🇱",
  CO: "🇨🇴",
  PE: "🇵🇪",
  UY: "🇺🇾",
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

interface SectionStat {
  section: string;
  count: number;
  avgDuration: number;
  totalDuration: number;
  countries: { code: string; name: string; count: number }[];
}

type VisitEntry = [bigint, SectionVisit];

export default function SectionAnalyticsPanel() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const [confirmDeleteId, setConfirmDeleteId] = useState<bigint | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      if (typeof actor?.deleteSectionVisitRecord !== "function") {
        throw new Error(
          "deleteSectionVisitRecord no está disponible en el actor",
        );
      }
      await actor.deleteSectionVisitRecord(visitId);
    },
    onSuccess: () => {
      setConfirmDeleteId(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: ["sectionVisits"] });
    },
    onError: (err: unknown) => {
      setDeleteError(`Error al eliminar registro: ${String(err)}`);
      setConfirmDeleteId(null);
    },
  });

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
      entry.durations.push(Number(v.duration?.[0] ?? 0n));
      const cc = v.country.code.toUpperCase();
      if (!entry.countries.has(cc))
        entry.countries.set(cc, { name: v.country.name, count: 0 });
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
        totalDuration: total,
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

  const totalVisits = visits?.length ?? 0;
  const uniqueCountries = useMemo(() => {
    if (!visits) return 0;
    return new Set(visits.map((v) => v.country.code.toUpperCase())).size;
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
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Analíticas del Sitio
          </h2>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-0.5">
              Actualizado a las {lastUpdated}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-colors disabled:opacity-50"
          data-ocid="analytics.button"
        >
          {isFetching ? (
            <svg
              aria-hidden="true"
              className="animate-spin h-3.5 w-3.5"
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
          ) : (
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          Actualizar
        </button>
      </div>

      {/* Delete error */}
      {deleteError && (
        <div className="border border-red-800 bg-red-950/30 p-3 flex items-center justify-between">
          <p className="text-red-400 text-sm">{deleteError}</p>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            className="text-red-400 hover:text-red-300 ml-4"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M6 18L18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Confirm delete dialog */}
      {confirmDeleteId !== null && (
        <div className="border border-gray-700 bg-gray-900 p-4">
          <p className="text-sm text-gray-300 mb-3">
            ¿Confirmar eliminación de este registro? Esta acción no se puede
            deshacer.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => deleteMutation.mutate(confirmDeleteId)}
              disabled={deleteMutation.isPending}
              className="px-4 py-1.5 text-sm bg-red-900 border border-red-700 text-red-200 hover:bg-red-800 transition-colors disabled:opacity-50"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteId(null)}
              disabled={deleteMutation.isPending}
              className="px-4 py-1.5 text-sm border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div
          className="flex items-center justify-center py-16"
          data-ocid="analytics.loading_state"
        >
          <svg
            aria-hidden="true"
            className="animate-spin h-6 w-6 text-gray-400"
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
          <span className="ml-3 text-gray-400">Cargando analíticas...</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          className="border border-red-800 bg-red-950/30 p-4"
          data-ocid="analytics.error_state"
        >
          <p className="text-red-400 text-sm">
            Error al cargar analíticas: {String(error)}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-xs text-red-400 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-gray-800 bg-gray-900/40 p-4 text-center">
              <p className="text-3xl font-bold text-white">{totalVisits}</p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                Visitas Totales
              </p>
            </div>
            <div className="border border-gray-800 bg-gray-900/40 p-4 text-center">
              <p className="text-3xl font-bold text-white">{stats.length}</p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                Secciones Visitadas
              </p>
            </div>
            <div className="border border-gray-800 bg-gray-900/40 p-4 text-center">
              <p className="text-3xl font-bold text-white">{uniqueCountries}</p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                Países
              </p>
            </div>
          </div>

          {/* Empty state */}
          {totalVisits === 0 && (
            <div
              className="border border-gray-800 p-12 text-center"
              data-ocid="analytics.empty_state"
            >
              <svg
                aria-hidden="true"
                className="h-12 w-12 text-gray-700 mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="text-gray-500">Aún no hay visitas registradas.</p>
              <p className="text-gray-600 text-sm mt-1">
                Las visitas de tus visitantes aparecerán aquí automáticamente.
              </p>
            </div>
          )}

          {/* Per-section stats */}
          {stats.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                Por Sección
              </h3>
              <div className="space-y-3">
                {stats.map((stat) => (
                  <div
                    key={stat.section}
                    className="border border-gray-800 bg-gray-900/20 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-white">
                          {getSectionLabel(stat.section)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {stat.count} {stat.count === 1 ? "visita" : "visitas"}{" "}
                          · Promedio {formatDuration(stat.avgDuration)}
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-white">
                        {stat.count}
                      </span>
                    </div>
                    <div className="h-1 bg-gray-800 mb-3">
                      <div
                        className="h-1 bg-white"
                        style={{
                          width: `${Math.min(100, (stat.count / totalVisits) * 100)}%`,
                        }}
                      />
                    </div>
                    {stat.countries.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {stat.countries.slice(0, 10).map((c) => (
                          <span
                            key={c.code}
                            className="flex items-center gap-1 text-xs text-gray-400 border border-gray-800 px-2 py-0.5"
                          >
                            <span>{getFlag(c.code)}</span>
                            <span>{c.name}</span>
                            <span className="text-gray-600">({c.count})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent visits table with delete */}
          {recentVisits.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                Visitas Recientes
              </h3>
              <div className="border border-gray-800">
                <div className="grid grid-cols-5 text-xs text-gray-500 uppercase tracking-wider px-4 py-2 border-b border-gray-800 bg-gray-900/40">
                  <span>Sección</span>
                  <span>País</span>
                  <span>Duración</span>
                  <span>Fecha</span>
                  <span className="text-right">Acción</span>
                </div>
                {recentVisits.map(([id, v]) => (
                  <div
                    key={String(id)}
                    className="grid grid-cols-5 items-center text-sm px-4 py-2.5 odd:bg-transparent even:bg-gray-900/20 border-b border-gray-800/50 last:border-0"
                  >
                    <span className="text-gray-300">
                      {getSectionLabel(v.section)}
                    </span>
                    <span className="text-gray-400 flex items-center gap-1">
                      <span>{getFlag(v.country.code)}</span>
                      <span>{v.country.name}</span>
                    </span>
                    <span className="text-gray-400">
                      {formatDuration(Number(v.duration))}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatDate(v.timestamp)}
                    </span>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(id)}
                        disabled={
                          deleteMutation.isPending && confirmDeleteId === id
                        }
                        className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Eliminar registro"
                      >
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
