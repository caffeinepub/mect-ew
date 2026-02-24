import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';
import ContactForm from '../components/ContactForm';
import FormSpecificMessageManagement from '../components/FormSpecificMessageManagement';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { FormType } from '../backend';

export default function MentoringPage() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsCallerAdmin();

  const isAuthenticated = !!identity;
  const showAdminPanel = isAuthenticated && isAdmin;
  const showUnauthorizedMessage = isAuthenticated && !isLoadingAdmin && !isAdmin;

  return (
    <main className="min-h-screen pt-20 pb-20">
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-6">
              <h1 className="text-3xl md:text-4xl font-bold">Mentorías</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Mentoría educativa enfocada en quienes buscan dominar la Teoría de las Ondas de Elliott desde
                una perspectiva profesional, basada en un proceso de entrenamiento personalizado donde
                se supervisa la evolución técnica y se acompaña el análisis de mercado en tiempo real.
              </p>
            </div>

            <ContactForm formType={FormType.mentoria} />

            {showUnauthorizedMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Acceso no autorizado</AlertTitle>
                <AlertDescription>
                  El panel de administración de mensajes está disponible solo para el administrador
                  del sitio.
                </AlertDescription>
              </Alert>
            )}

            {showAdminPanel && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Panel de Administración</h2>
                <FormSpecificMessageManagement formType={FormType.mentoria} />
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
