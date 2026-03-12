import { useSectionTracker } from "../hooks/useSectionTracker";

export default function HomePage() {
  useSectionTracker("home");

  return (
    <main
      className="relative w-screen bg-black overflow-hidden"
      style={{
        height: "100vh",
        minHeight: "100dvh",
      }}
    >
      <img
        src="/assets/toro y oso, mercados financieros, graficas.jpg"
        alt="Hero Background - Financial Markets"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          objectPosition: "center",
          filter: "grayscale(100%) contrast(1.1)",
        }}
      />
    </main>
  );
}
