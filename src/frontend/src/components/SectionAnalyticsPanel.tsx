import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BarChart2, Clock, Globe, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type SectionVisit,
  getSectionVisits,
} from "../hooks/useSectionTracker";

const SECTION_LABELS: Record<string, string> = {
  home: "Inicio",
  "sobre-mi": "Sobre mí",
  analisis: "Análisis",
  consultorias: "Consultorías",
  mentorias: "Mentorías",
  contacto: "Contacto",
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SectionAnalyticsPanel() {
  const [tick, setTick] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: tick is intentional refresh signal
  const visits = useMemo(() => getSectionVisits(), [tick]);

  const sectionStats = useMemo(() => {
    const map: Record<
      string,
      {
        count: number;
        totalDuration: number;
        countries: Record<string, number>;
      }
    > = {};
    for (const visit of visits) {
      if (!map[visit.section]) {
        map[visit.section] = { count: 0, totalDuration: 0, countries: {} };
      }
      map[visit.section].count++;
      map[visit.section].totalDuration += visit.duration;
      const key = `${visit.countryCode}|${visit.country}`;
      map[visit.section].countries[key] =
        (map[visit.section].countries[key] || 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([section, stats]) => ({
        section,
        label: SECTION_LABELS[section] || section,
        count: stats.count,
        avgDuration: Math.round(stats.totalDuration / stats.count),
        countries: Object.entries(stats.countries)
          .map(([key, count]) => {
            const [code, name] = key.split("|");
            return { code, name, count };
          })
          .sort((a, b) => b.count - a.count),
      }));
  }, [visits]);

  const recentVisits = useMemo(
    () => [...visits].reverse().slice(0, 20),
    [visits],
  );

  function handleClear() {
    localStorage.removeItem("mectew_section_visits");
    setTick((n) => n + 1);
  }

  if (visits.length === 0) {
    return (
      <div
        data-ocid="analytics.empty_state"
        className="text-center py-16 text-muted-foreground"
      >
        <BarChart2 className="w-10 h-10 mx-auto mb-4 opacity-30" />
        <p>Aún no hay visitas registradas.</p>
        <p className="text-sm mt-1">
          Los datos aparecerán cuando visitantes naveguen por el sitio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-ocid="analytics.panel">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {visits.length} visita{visits.length !== 1 ? "s" : ""} registrada
          {visits.length !== 1 ? "s" : ""}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          data-ocid="analytics.delete_button"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Borrar datos
        </Button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5" />
          Visitas por Sección
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {sectionStats.map((stat, i) => (
            <Card key={stat.section} data-ocid={`analytics.item.${i + 1}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  {stat.label}
                  <Badge variant="secondary">
                    {stat.count} visita{stat.count !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Tiempo promedio:{" "}
                  <span className="text-foreground font-medium">
                    {formatDuration(stat.avgDuration)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Globe className="w-4 h-4" />
                    Países
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stat.countries.slice(0, 8).map((c) => (
                      <Badge key={c.code} variant="outline" className="text-xs">
                        {c.name} ({c.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Visitas Recientes</h3>
        <div className="space-y-2">
          {recentVisits.map((visit: SectionVisit, i: number) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: list is reversed and stable
              key={i}
              className="flex items-center justify-between text-sm border rounded-md px-4 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">
                  {SECTION_LABELS[visit.section] || visit.section}
                </span>
                <Badge variant="outline" className="text-xs">
                  {visit.country}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>{formatDuration(visit.duration)}</span>
                <span>{formatDate(visit.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
