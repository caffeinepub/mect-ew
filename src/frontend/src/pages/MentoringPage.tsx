import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PaymentServiceType } from "../backend";
import IcpPaymentWidget from "../components/IcpPaymentWidget";
import { useSectionTracker } from "../hooks/useSectionTracker";

const bloques = [
  {
    title: "Bloque 1: Mercados Financieros",
    items: [
      "1.1. Mercado de Dinero: Letra del Tesoro, Papel Comercial, Letras de Cambio, Plazo Fijo, Operación Recompra.",
      "1.2. Mercado de Divisas: Futuro, Contado, ETFs, CFDs.",
      "1.3. Mercado de Capitales: Bono, Acción, Futuro, ETFs, CFDs.",
      "1.4. Mercado de Materias Primas: Futuro, ETFs, CFDs.",
      "1.5. Mercado de Activos Digitales: Token, Criptomoneda, NFTs, ETFs, CFDs.",
    ],
  },
  {
    title: "Bloque 2: Agentes en los Mercados",
    items: [
      "2.1. Agente Intermediario: Bróker, Casa de Bolsa, Agente de Bolsa, Banco de Inversión, Banco Comercial.",
      "2.2. Agente Infraestructura: Bolsa de Valores, Bolsa de Futuros, Exchange Activos Digitales, Plataforma de Negociación, Depósito Central de Valores.",
      "2.3. Agente Oferente de Capital: Aseguradora, Persona Física, Banco Comercial, Fondo de Pensión, Fondo de Inversión.",
      "2.4. Agente Demandante de Capital: Empresa, Gobierno, Institución Financiera.",
      "2.5. Agente de Regulación y Supervisión: Banco Central, Organismo Regulación Sectorial, Autoridad Supervisión Financiera.",
    ],
  },
  {
    title: "Bloque 3: Teoría de Dow",
    items: [
      "3.1. Comportamiento Fractal",
      "3.2. Tendencia (Alcista y Bajista)",
      "3.3. Soporte",
      "3.4. Resistencia",
      "3.5. Línea de Tendencia (Alcista y Bajista)",
    ],
  },
  {
    title: "Bloque 4: Teoría de las Ondas de Elliott",
    items: [
      "4.1. Comportamiento Fractal",
      "4.2. Ciclo (Fase de Impulso y Fase de Corrección)",
      "4.3. Estructuras de Impulso (Simple y Diagonal)",
      "4.4. Estructuras de Corrección (ZigZag, Plana y Triángulo)",
      "4.5. Fibonacci: Ratios en Impulso Simple, Diagonal, ZigZag, Plana y Triángulo.",
      "4.6. Operativa: Compra y Venta de Ondas 1/A, 3/C y Onda 5.",
    ],
  },
];

export default function MentoringPage() {
  useSectionTracker("mentorias");

  return (
    <main className="min-h-screen pt-20 pb-20">
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="space-y-6">
              <h1 className="text-3xl md:text-4xl font-bold">
                Formación Integral en Mercados Financieros
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Formación enfocada en el dominio de la infraestructura de los
                mercados financieros, el análisis estructural de Dow y el
                análisis técnico avanzado de la Teoría de las Ondas de Elliott.
              </p>

              <h2 className="text-2xl font-bold pt-4">Temática del Programa</h2>

              <Accordion type="multiple" className="w-full space-y-1">
                {bloques.map((bloque, index) => (
                  <AccordionItem
                    key={bloque.title}
                    value={`bloque-${index + 1}`}
                    data-ocid={`mentoring.bloque.item.${index + 1}`}
                    className="border border-border rounded-none px-0"
                  >
                    <AccordionTrigger
                      data-ocid={`mentoring.bloque.toggle.${index + 1}`}
                      className="font-semibold text-foreground px-4 hover:no-underline hover:text-foreground"
                    >
                      {bloque.title}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <ul className="space-y-2">
                        {bloque.items.map((item) => (
                          <li
                            key={item}
                            className="text-muted-foreground text-sm"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <h2 className="text-2xl font-bold pt-4">
                Modalidad y Metodología
              </h2>

              <div className="space-y-3 text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">
                    Duración y Frecuencia:
                  </span>{" "}
                  Formación de 12 meses con 2 sesiones a la semana vía online de
                  60 minutos.
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
                    Cupos y Precios:
                  </span>{" "}
                  Consultar disponibilidad y aranceles de forma privada.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Nota:</span>{" "}
                  Las mentorías tienen un propósito estrictamente
                  técnico-educativo y no constituyen recomendaciones de
                  inversión.
                </p>
              </div>
            </div>

            <IcpPaymentWidget serviceType={PaymentServiceType.mentoria} />
          </div>
        </div>
      </section>
    </main>
  );
}
