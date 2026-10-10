'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Wireframe } from '@react-three/drei';
import * as THREE from 'three';

function AbstractNode() {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create an abstract, tech-looking geometry (icosahedron)
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(2, 1), []);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
      groupRef.current.rotation.z += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
        <mesh geometry={geometry}>
          <meshBasicMaterial color="#FF7A1A" wireframe transparent opacity={0.2} />
        </mesh>
        
        {/* Core */}
        <mesh geometry={new THREE.IcosahedronGeometry(1.2, 0)}>
          <meshStandardMaterial 
            color="#FF7A1A" 
            emissive="#FF7A1A"
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        
        {/* Orbiting ring */}
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[3, 0.02, 16, 100]} />
          <meshBasicMaterial color="#D9A93C" transparent opacity={0.5} />
        </mesh>
      </Float>
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 z-0 opacity-60">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 1.5]} // Cap pixel ratio for performance
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#FF7A1A" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#D9A93C" />
        <AbstractNode />
      </Canvas>
    </div>
  );
}
