import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { VideoCategory } from "../backend";
import ManualVideoUpload from "../components/ManualVideoUpload";
import ScreenRecorder from "../components/ScreenRecorder";
import VideoGallery from "../components/VideoGallery";
import VideoManagementPanel from "../components/VideoManagementPanel";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsCallerAdmin } from "../hooks/useQueries";
import { useGetVideosByCategory } from "../hooks/useQueries";

const categories = [
  { value: VideoCategory.divisas, label: "Divisas" },
  { value: VideoCategory.indices, label: "Índices" },
  { value: VideoCategory.acciones, label: "Acciones" },
  { value: VideoCategory.materiasPrimas, label: "Materias Primas" },
  { value: VideoCategory.activosDigitales, label: "Activos Digitales" },
];

export default function AnalysisPage() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsCallerAdmin();

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

            {/* Descriptive content block */}
            <div className="max-w-3xl mx-auto space-y-8 mb-16">
              <p className="text-lg text-muted-foreground leading-relaxed">
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
                  Identificación de estructuras de impulso y estructuras de
                  corrección en desarrollo.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">
                    Proyecciones de Fibonacci:
                  </span>{" "}
                  Aplicación de ratios de Fibonacci para delimitar zonas de alta
                  probabilidad para la finalización de estructuras.
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
                  Los contenidos expuestos tienen un propósito estrictamente
                  técnico-educativo y no constituyen recomendaciones de
                  inversión ni asesoría financiera. La gestión de capital es
                  responsabilidad individual del usuario.
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
              <Tabs defaultValue={VideoCategory.divisas}>
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
                  {categories.map((category) => (
                    <TabsTrigger key={category.value} value={category.value}>
                      {category.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {categories.map((category) => (
                  <TabsContent key={category.value} value={category.value}>
                    <CategoryVideoGallery category={category.value} />
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

function CategoryVideoGallery({ category }: { category: VideoCategory }) {
  const { data: videos = [], isLoading } = useGetVideosByCategory(category);

  return <VideoGallery videos={videos} isLoading={isLoading} />;
}
