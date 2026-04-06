import { FormType, PaymentServiceType } from "../backend";
import IcpPaymentWidget from "../components/IcpPaymentWidget";
import { useSectionTracker } from "../hooks/useSectionTracker";

export default function ConsultancyPage() {
  useSectionTracker("consultorias");

  return (
    <main className="min-h-screen pt-20 pb-20">
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-6">
              <h1 className="text-3xl md:text-4xl font-bold">
                Consultorías Técnicas
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Servicio de análisis para quienes requieran una visión técnica
                sobre activos específicos.
              </p>
            </div>

            <div className="space-y-8">
              <h2 className="text-2xl font-bold">Enfoque de la Sesión</h2>

              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">
                    Análisis Estructural:
                  </span>{" "}
                  Desglose fractal de los activos propuestos por el consultante
                  mediante la Teoría de las Ondas de Elliott.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">
                    Confluencia de Fibonacci:
                  </span>{" "}
                  Aplicación de ratios de Fibonacci para determinar niveles de
                  avance y corrección en base a la estructura fractal.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">
                    Hoja de Ruta:
                  </span>{" "}
                  Identificación de niveles críticos de invalidación y planteo
                  de escenarios alternos.
                </p>

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

                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Nota:</span>{" "}
                  Las consultorías tienen un propósito estrictamente
                  técnico-educativo y no constituyen recomendaciones de
                  inversión.
                </p>
              </div>
            </div>

            <IcpPaymentWidget serviceType={PaymentServiceType.consultoria} />
          </div>
        </div>
      </section>
    </main>
  );
}
