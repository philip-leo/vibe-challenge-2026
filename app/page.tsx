"use client"

import dynamic from "next/dynamic"

const VibeBlocks = dynamic(() => import("./vibe-blocks"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white font-sans">
      <div className="text-center">
        <h1 className="text-6xl font-light tracking-tight mb-4">VIBE</h1>
        <p className="text-sm tracking-[0.3em] text-white/60 uppercase">Loading...</p>
      </div>
    </div>
  ),
})

export default function Home() {
  return <VibeBlocks />
}
