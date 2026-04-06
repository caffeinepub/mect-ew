import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { VideoCategory } from "../backend";
import ManualVideoUpload from "../components/ManualVideoUpload";
import ScreenRecorder from "../components/ScreenRecorder";
import VideoGallery from "../components/VideoGallery";
import VideoManagementPanel from "../components/VideoManagementPanel";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetVideosByCategory, useIsCallerAdmin } from "../hooks/useQueries";
import { useSectionTracker } from "../hooks/useSectionTracker";

const categories = [
  { value: VideoCategory.divisas, label: "Divisas" },
  { value: VideoCategory.indices, label: "Índices" },
  { value: VideoCategory.acciones, label: "Acciones" },
  { value: VideoCategory.materiasPrimas, label: "Materias Primas" },
  { value: VideoCategory.activosDigitales, label: "Activos Digitales" },
];

export default function AnalysisPage() {
  useSectionTracker("analisis");
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsCallerAdmin();

  // Read deep-link params from URL
  const searchParams = new URLSearchParams(window.location.search);
  const videoIdParam = searchParams.get("v") || undefined;
  const catParam = searchParams.get("cat");

  // Determine initial tab: from URL param or default
  const initialCategory = (() => {
    if (catParam) {
      const found = categories.find((c) => c.value === catParam);
      if (found) return found.value;
    }
    return VideoCategory.divisas;
  })();

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);

  const isAuthenticated = !!identity;
  const showAdminTools = isAuthenticated && isAdmin;
  const showUnauthorizedMessage =
    isAuthenticated && !isLoadingAdmin && !isAdmin;

  return (
    <main className="min-h-screen pt-20 pb-20">
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Análisis Técnico de Mercados Financieros
            </h1>

            <div className="max-w-3xl mx-auto space-y-8 mb-16">
              <p className="text-muted-foreground leading-relaxed">
                Exposición de escenarios técnicos basados en la Teoría de las
                Ondas de Elliott. Estos reportes detallan la arquitectura del
                precio en activos seleccionados, permitiendo una lectura
                objetiva del ciclo.
              </p>

              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">
                    Fase del Ciclo:
                  </span>{" "}
                  Identificación de estructuras fractales de impulso y
                  corrección en desarrollo.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">
                    Proyecciones de Fibonacci:
                  </span>{" "}
                  Aplicación de ratios de Fibonacci para determinar niveles de
                  desarrollo en estructuras fractales de impulso y corrección.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">
                    Escenarios Alternos:
                  </span>{" "}
                  Planteamiento de escenarios alternos en base a la estructura
                  fractal.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Nota:</span>{" "}
                  Los análisis expuestos tienen un propósito estrictamente
                  técnico-educativo y no constituyen recomendaciones de
                  inversión.
                </p>
              </div>
            </div>

            <Separator className="mb-12" />

            {showUnauthorizedMessage && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Acceso no autorizado</AlertTitle>
                <AlertDescription>
                  Las herramientas de grabación, subida de videos y
                  administración están disponibles solo para el administrador
                  del sitio.
                </AlertDescription>
              </Alert>
            )}

            {showAdminTools && (
              <>
                <div className="space-y-8 mb-12">
                  <ScreenRecorder />
                  <Separator />
                  <ManualVideoUpload />
                  <Separator />
                  <VideoManagementPanel />
                </div>
                <Separator className="my-12" />
              </>
            )}

            <div className="mt-12">
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
                  {categories.map((category) => (
                    <TabsTrigger key={category.value} value={category.value}>
                      {category.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {categories.map((category) => (
                  <TabsContent key={category.value} value={category.value}>
                    <CategoryVideoGallery
                      category={category.value}
                      autoOpenVideoId={
                        activeCategory === category.value
                          ? videoIdParam
                          : undefined
                      }
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CategoryVideoGallery({
  category,
  autoOpenVideoId,
}: {
  category: VideoCategory;
  autoOpenVideoId?: string;
}) {
  const { data: videos = [], isLoading } = useGetVideosByCategory(category);

  return (
    <VideoGallery
      videos={videos}
      isLoading={isLoading}
      autoOpenVideoId={autoOpenVideoId}
      currentCategory={category}
    />
  );
}
