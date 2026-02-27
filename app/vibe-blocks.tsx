"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import { useRef } from "react"
import * as THREE from "three"

const BoxWithEdges = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshPhysicalMaterial
          color="#0070f3"
          roughness={0.1}
          metalness={0.8}
          transparent={true}
          opacity={0.9}
          transmission={0.5}
          clearcoat={1}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(0.5, 0.5, 0.5)]} />
        <lineBasicMaterial color="#214dbd" linewidth={2} />
      </lineSegments>
    </group>
  )
}

const BoxLetter = ({ letter, position }: { letter: string; position: [number, number, number] }) => {
  const group = useRef<THREE.Group>(null)

  const getLetterShape = (letter: string): number[][] => {
    const shapes: Record<string, number[][]> = {
      V: [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,0,1,0],
        [0,1,0,1,0],
        [0,0,1,0,0],
      ],
      I: [
        [1,1,1],
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [1,1,1],
      ],
      B: [
        [1,1,1,0],
        [1,0,0,1],
        [1,1,1,0],
        [1,0,0,1],
        [1,1,1,0],
      ],
      E: [
        [1,1,1],
        [1,0,0],
        [1,1,0],
        [1,0,0],
        [1,1,1],
      ],
    }
    return shapes[letter] || shapes['V']
  }

  const letterShape = getLetterShape(letter)
  const width = letterShape[0].length

  return (
    <group ref={group} position={position}>
      {letterShape.map((row, i) =>
        row.map((cell, j) => {
          if (cell) {
            const xOffset = j * 0.5 - (width * 0.5 * 0.5) + 0.25
            return (
              <BoxWithEdges
                key={`${i}-${j}`}
                position={[xOffset, (4 - i) * 0.5 - 1, 0]}
              />
            )
          }
          return null
        })
      )}
    </group>
  )
}

const Scene = () => {
  return (
    <>
      <group position={[-0.5, 0, 0]} rotation={[0, Math.PI / 1.5, 0]}>
        <BoxLetter letter="V" position={[-4.5, 0, 0]} />
        <BoxLetter letter="I" position={[-1.5, 0, 0]} />
        <BoxLetter letter="B" position={[1.5, 0, 0]} />
        <BoxLetter letter="E" position={[4, 0, 0]} />
      </group>
      <OrbitControls
        enableZoom
        enablePan
        enableRotate
        autoRotate
        autoRotateSpeed={2}
      />

      <ambientLight intensity={0.5} />

      <directionalLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />

      <Environment
        files="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dither_it_M3_Drone_Shot_equirectangular-jpg_San_Francisco_Big_City_1287677938_12251179%20(1)-NY2qcmpjkyG6rDp1cPGIdX0bHk3hMR.jpg"
        background
      />
    </>
  )
}

export default function VibeBlocks() {
  return (
    <div className="relative w-full h-screen bg-gray-900">
      <Canvas camera={{ position: [10.047021, -0.127436, -11.137374], fov: 50 }}>
        <Scene />
      </Canvas>

      {/* Overlay text */}
      <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
        <p className="text-sm sm:text-base tracking-[0.3em] text-white/60 uppercase font-light">
          Matter Labs · Lisbon Off-site 2026
        </p>
      </div>
    </div>
  )
}
