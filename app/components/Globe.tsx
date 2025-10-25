"use client";
import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface PinLocation {
  lat: number;
  lng: number;
}

interface EarthProps {
  targetLocation: PinLocation | null;
  isRotating: boolean;
}

function Earth({ targetLocation, isRotating }: EarthProps) {
  const globeRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [ThreeGlobe, setThreeGlobe] = useState<any>(null);

  // Dynamically import ThreeGlobe to avoid SSR issues
  useEffect(() => {
    import("three-globe").then((module) => {
      setThreeGlobe(() => module.default);
    });
  }, []);

  // Initialize the globe
  useEffect(() => {
    if (!ThreeGlobe) return;

    const globe = new ThreeGlobe({
      animateIn: false,
    })
      .globeImageUrl(
        "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
      )
      .pointsData(targetLocation ? [targetLocation] : [])
      .pointColor(() => "#ff4444")
      .pointAltitude(0.01)
      .pointRadius(0.6);

    globeRef.current = globe;

    // Add to scene
    if (groupRef.current) {
      groupRef.current.add(globe);
    }

    return () => {
      if (groupRef.current && globe) {
        groupRef.current.remove(globe);
      }
    };
  }, [ThreeGlobe]);

  // Update points when target location changes
  useEffect(() => {
    if (globeRef.current && targetLocation) {
      console.log("🎯 Updating globe with location:", targetLocation);
      globeRef.current.pointsData([targetLocation]);
    } else if (globeRef.current && !targetLocation) {
      globeRef.current.pointsData([]);
    }
  }, [targetLocation]);

  // Rotation animation
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Auto-rotate when no target
    if (isRotating && !targetLocation) {
      groupRef.current.rotation.y += delta * 0.1;
    }

    // Rotate to target location - three-globe uses proper lat/lng coordinate system
    if (targetLocation) {
      // Calculate target rotation
      // three-globe's coordinate system: rotate to bring lat/lng to front
      const targetRotationY = -(targetLocation.lng * Math.PI) / 180;
      const targetRotationX = (targetLocation.lat * Math.PI) / 180;

      const currentRotationY = groupRef.current.rotation.y;
      const currentRotationX = groupRef.current.rotation.x;

      // Calculate shortest angular distance
      let diffY = targetRotationY - currentRotationY;
      while (diffY > Math.PI) diffY -= 2 * Math.PI;
      while (diffY < -Math.PI) diffY += 2 * Math.PI;

      const diffX = targetRotationX - currentRotationX;

      // Smooth rotation
      if (Math.abs(diffY) > 0.001) {
        groupRef.current.rotation.y += diffY * 0.05;
      }
      if (Math.abs(diffX) > 0.001) {
        groupRef.current.rotation.x += diffX * 0.05;
      }
    }
  });

  return <group ref={groupRef} />;
}

interface GlobeProps {
  targetLocation: PinLocation | null;
}

export default function Globe({ targetLocation }: GlobeProps) {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 300], fov: 45 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 3, 5]} intensity={1.5} />
        <pointLight position={[10, 0, 0]} intensity={0.8} />
        <pointLight position={[-10, 0, 0]} intensity={0.8} />
        <pointLight position={[0, 0, -10]} intensity={0.5} />
        <Earth targetLocation={targetLocation} isRotating={true} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
}
