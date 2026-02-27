"use client"

import dynamic from "next/dynamic"

const HeroPong = dynamic(() => import("./hero-pong"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-black text-white font-sans">
      <div className="text-center">
        <h1 className="text-6xl font-light tracking-tight mb-4">Hello World</h1>
        <p className="text-sm tracking-[0.3em] text-white/60 uppercase">ML Lisbon Offsite</p>
      </div>
    </div>
  ),
})

export default function Home() {
  return <HeroPong />
}
