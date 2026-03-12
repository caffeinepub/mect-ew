import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FormType } from "../backend";
import ContactForm from "../components/ContactForm";
import FormSpecificMessageManagement from "../components/FormSpecificMessageManagement";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsCallerAdmin } from "../hooks/useQueries";

export default function ConsultancyPage() {
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
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-6">
              <h1 className="text-3xl md:text-4xl font-bold">
                Consultorías Técnicas
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Servicio de análisis para quienes requieran una visión técnica
                sobre activos específicos.
              </p>
            </div>

            <div className="space-y-8">
              <h2 className="text-2xl font-bold">Enfoque de la Sesión</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-base font-semibold">
                    Análisis Estructural
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Desglose completo de los activos propuestos por el
                    consultante mediante la Teoría de las Ondas de Elliott en
                    múltiples temporalidades (Fractalidad).
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-semibold">
                    Confluencia de Fibonacci
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Determinación técnica de zonas de retroceso, niveles de
                    extensión y objetivos de precio.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-semibold">Hoja de Ruta</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Identificación de niveles críticos de invalidación y planteo
                    de escenarios alternos.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">
                    Formato:
                  </span>{" "}
                  Sesión individual de 60 minutos vía online.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">
                    Cupos y Precios:
                  </span>{" "}
                  Consultar disponibilidad y aranceles de forma privada.
                </p>
              </div>
            </div>

            <ContactForm formType={FormType.consultoria} />

            {showUnauthorizedMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Acceso no autorizado</AlertTitle>
                <AlertDescription>
                  El panel de administración de mensajes está disponible solo
                  para el administrador del sitio.
                </AlertDescription>
              </Alert>
            )}

            {showAdminPanel && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Panel de Administración</h2>
                <FormSpecificMessageManagement
                  formType={FormType.consultoria}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
