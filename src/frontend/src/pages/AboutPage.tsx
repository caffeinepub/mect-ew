import { useSectionTracker } from "../hooks/useSectionTracker";

export default function AboutPage() {
  useSectionTracker("sobre-mi");

  return (
    <main className="min-h-screen pt-20 pb-20">
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold">Sobre mí</h1>
            </div>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                El análisis de los mercados financieros requiere una comprensión
                profunda de la psicología de masas y su representación gráfica
                en el precio. Como analista técnico, fundamento mi metodología
                en la Teoría de las Ondas de Elliott, herramienta que me permite
                identificar con precisión las estructuras fractales de impulso y
                corrección que determinan el desarrollo cíclico de los activos.
              </p>
              <p>
                Mi trayectoria se ha consolidado a través de la interpretación
                rigurosa de los patrones de comportamiento del mercado,
                priorizando siempre la objetividad estadística sobre la
                especulación intuitiva.
              </p>
              <p>
                Este enfoque técnico me ha permitido desempeñarme no solo como
                analista, sino también como mentor.
              </p>
              <p>
                En mi faceta educativa, mi objetivo es transmitir la complejidad
                de la Teoría de las Ondas de Elliott de manera funcional,
                dotando al analista de una capacidad crítica para validar
                escenarios de alta probabilidad y operar bajo un marco técnico
                robusto y profesional.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
