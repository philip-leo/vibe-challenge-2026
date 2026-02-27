import Image from "next/image";

export default function Home() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Background image */}
      <Image
        src="https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1920&q=80"
        alt="Lisbon skyline"
        fill
        className="object-cover"
        priority
      />

      {/* Dark overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      {/* Animated gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-purple-600/20 animate-pulse" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        {/* Decorative line */}
        <div className="w-16 h-px bg-white/40" />

        <h1 className="text-6xl sm:text-7xl md:text-8xl font-light tracking-tight text-white">
          Hello World
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl font-light tracking-widest text-white/70 uppercase">
          Matter Labs · Lisbon Off-site 2026
        </p>

        {/* Decorative line */}
        <div className="w-16 h-px bg-white/40" />

        {/* Subtle scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-white/20 animate-bounce" />
        </div>
      </div>
    </main>
  );
}
