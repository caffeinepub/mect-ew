import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FormType } from "../backend";
import ContactForm from "../components/ContactForm";
import FormSpecificMessageManagement from "../components/FormSpecificMessageManagement";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsCallerAdmin } from "../hooks/useQueries";

export default function MentoringPage() {
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
            <div className="space-y-6">
              <h1 className="text-3xl md:text-4xl font-bold">
                Formación Integral en Mercados Financieros
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Formación enfocada en el dominio de la infraestructura de los
                mercados financieros, el análisis estructural de Dow y el
                análisis técnico avanzado de la Teoría de las Ondas de Elliott.
              </p>

              <h2 className="text-2xl font-bold pt-4">Temática del Programa</h2>

              <div className="space-y-4 text-muted-foreground">
                <p className="font-semibold text-foreground">
                  Bloque 1: Mercados Financieros
                </p>
                <p>
                  1.1. Mercado de Dinero: Letra del Tesoro, Papel Comercial,
                  Letras de Cambio, Plazo Fijo, Operación Recompra.
                </p>
                <p>1.2. Mercado de Divisas: Futuro, Contado, ETFs, CFDs.</p>
                <p>
                  1.3. Mercado de Capitales: Bono, Acción, Futuro, ETFs, CFDs.
                </p>
                <p>1.4. Mercado de Materias Primas: Futuro, ETFs, CFDs.</p>
                <p>
                  1.5. Mercado de Activos Digitales: Token, Criptomoneda, NFTs,
                  ETFs, CFDs.
                </p>

                <p className="font-semibold text-foreground pt-2">
                  Bloque 2: Agentes en los Mercados
                </p>
                <p>
                  2.1. Agente Intermediario: Bróker, Casa de Bolsa, Agente de
                  Bolsa, Banco de Inversión, Banco Comercial.
                </p>
                <p>
                  2.2. Agente Infraestructura: Bolsa de Valores, Bolsa de
                  Futuros, Exchange Activos Digitales, Plataforma de
                  Negociación, Depósito Central de Valores.
                </p>
                <p>
                  2.3. Agente Oferente de Capital: Aseguradora, Persona Física,
                  Banco Comercial, Fondo de Pensión, Fondo de Inversión.
                </p>
                <p>
                  2.4. Agente Demandante de Capital: Empresa, Gobierno,
                  Institución Financiera.
                </p>
                <p>
                  2.5. Agente de Regulación y Supervisión: Banco Central,
                  Organismo Regulación Sectorial, Autoridad Supervisión
                  Financiera.
                </p>

                <p className="font-semibold text-foreground pt-2">
                  Bloque 3: Teoría de Dow
                </p>
                <p>3.1. Comportamiento Fractal</p>
                <p>3.2. Tendencia (Alcista y Bajista)</p>
                <p>3.3. Soporte</p>
                <p>3.4. Resistencia</p>
                <p>3.5. Línea de Tendencia (Alcista y Bajista)</p>

                <p className="font-semibold text-foreground pt-2">
                  Bloque 4: Teoría de las Ondas de Elliott
                </p>
                <p>4.1. Comportamiento Fractal</p>
                <p>4.2. Ciclo (Fase de Impulso y Fase de Corrección)</p>
                <p>4.3. Estructuras de Impulso (Simple y Diagonal)</p>
                <p>
                  4.4. Estructuras de Corrección (ZigZag, Plana y Triángulo)
                </p>
                <p>
                  4.5. Fibonacci: Ratios en Impulso Simple, Diagonal, ZigZag,
                  Plana y Triángulo.
                </p>
                <p>
                  4.6. Operativa: Compra y Venta de Ondas 1/A, 3/C y Onda 5.
                </p>
              </div>

              <h2 className="text-2xl font-bold pt-4">
                Modalidad y Metodología
              </h2>

              <div className="space-y-3 text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">
                    Duración y Frecuencia:
                  </span>{" "}
                  Formación de 12 meses con sesiones de 60 minutos, dos veces
                  por semana.
                </p>
                <p>
                  <span className="font-semibold text-foreground">
                    Fase Teórica:
                  </span>{" "}
                  Estudio detallado de cada bloque temático. Se entrega material
                  técnico de autoría propia con ejemplos de mercado real.
                </p>
                <p>
                  <span className="font-semibold text-foreground">
                    Ejercicios Prácticos:
                  </span>{" "}
                  Evaluación técnica al finalizar la fase teórica para validar
                  el aprendizaje.
                </p>
                <p>
                  <span className="font-semibold text-foreground">
                    Fase Práctica:
                  </span>{" "}
                  Entrenamiento personalizado mediante el estudio de 50 análisis
                  de activos compartidos en pantalla durante las sesiones.
                </p>
                <p>
                  <span className="font-semibold text-foreground">
                    Análisis en Vivo:
                  </span>{" "}
                  Proyección de activos planteados por el alumno y corrección
                  directa de sus propios análisis técnicos.
                </p>
                <p>
                  <span className="font-semibold text-foreground">
                    Dinámica de Clase:
                  </span>{" "}
                  Las sesiones no se graban para priorizar la interacción 1:1,
                  permitiendo repasar cualquier temática no comprendida las
                  veces que sea necesario.
                </p>
                <p>
                  <span className="font-semibold text-foreground">
                    Cupos y Precios:
                  </span>{" "}
                  Consultar disponibilidad y aranceles de forma privada.
                </p>
              </div>
            </div>

            <ContactForm formType={FormType.mentoria} />

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
                <FormSpecificMessageManagement formType={FormType.mentoria} />
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
