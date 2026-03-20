import { useSectionTracker } from "../hooks/useSectionTracker";

export default function HomePage() {
  useSectionTracker("home");

  return (
    <div
      className="w-screen bg-black"
      style={{
        height: "100vh",
        minHeight: "100dvh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <img
        src="/assets/toro y oso, mercados financieros, graficas-3.jpg"
        alt="Hero Background - Financial Markets"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          display: "block",
          filter: "grayscale(100%) contrast(1.1) brightness(0.9)",
        }}
      />
    </div>
  );
}
