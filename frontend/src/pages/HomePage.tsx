export default function HomePage() {
  return (
    <main 
      className="relative w-screen bg-black overflow-hidden"
      style={{ 
        height: '100vh',
        minHeight: '100dvh' // Dynamic viewport height for mobile
      }}
    >
      <img 
        src="/assets/toro y oso, mercados financieros, graficas.jpg"
        alt="Hero Background - Financial Markets"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          objectPosition: 'center',
          filter: 'grayscale(100%) contrast(1.1)',
        }}
      />
    </main>
  );
}
