import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';
import ScreenRecorder from '../components/ScreenRecorder';
import ManualVideoUpload from '../components/ManualVideoUpload';
import VideoGallery from '../components/VideoGallery';
import VideoManagementPanel from '../components/VideoManagementPanel';
import { useGetVideosByCategory } from '../hooks/useQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoCategory } from '../backend';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const categories = [
  { value: VideoCategory.divisas, label: 'Divisas' },
  { value: VideoCategory.indices, label: 'Índices' },
  { value: VideoCategory.acciones, label: 'Acciones' },
  { value: VideoCategory.materiasPrimas, label: 'Materias Primas' },
  { value: VideoCategory.activosDigitales, label: 'Activos Digitales' },
];

export default function AnalysisPage() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsCallerAdmin();

  const isAuthenticated = !!identity;
  const showAdminTools = isAuthenticated && isAdmin;
  const showUnauthorizedMessage = isAuthenticated && !isLoadingAdmin && !isAdmin;

  return (
    <main className="min-h-screen pt-20 pb-20">
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Análisis Técnico de Mercados Financieros
            </h1>

            {showUnauthorizedMessage && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Acceso no autorizado</AlertTitle>
                <AlertDescription>
                  Las herramientas de grabación, subida de videos y administración están disponibles solo para el administrador del sitio.
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
