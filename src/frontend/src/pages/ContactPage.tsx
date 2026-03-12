import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FormType } from "../backend";
import ContactForm from "../components/ContactForm";
import FormSpecificMessageManagement from "../components/FormSpecificMessageManagement";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsCallerAdmin } from "../hooks/useQueries";
import { useSectionTracker } from "../hooks/useSectionTracker";

export default function ContactPage() {
  useSectionTracker("contacto");
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsCallerAdmin();

  const isAuthenticated = !!identity;
  const showAdminPanel = isAuthenticated && isAdmin;
  const showUnauthorizedMessage =
    isAuthenticated && !isLoadingAdmin && !isAdmin;

  return (
    <main className="min-h-screen pt-20 pb-20">
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-12">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold">Contacto</h1>
            </div>

            <ContactForm formType={FormType.contacto} />

            {showUnauthorizedMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Acceso no autorizado</AlertTitle>
                <AlertDescription>
                  El panel de administración está disponible solo para el
                  administrador del sitio.
                </AlertDescription>
              </Alert>
            )}

            {showAdminPanel && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Mensajes de Contacto</h2>
                <FormSpecificMessageManagement formType={FormType.contacto} />
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
