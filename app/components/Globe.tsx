"use client";
import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface PinLocation {
  lat: number;
  lng: number;
}

interface Pin {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label?: string;
}

export interface GlobeRef {
  rotateToLocation: (lat: number, lng: number, animate?: boolean) => void;
  addPin: (lat: number, lng: number, color?: string, label?: string) => string;
  addCityPin: (
    cityName: string,
    options?: { color?: string; label?: string; rotate?: boolean }
  ) => Promise<{ id: string; lat: number; lng: number } | null>;
  removePin: (id: string) => void;
  clearAllPins: () => void;
  resetRotation: () => void;
}

interface EarthProps {
  targetLocation: PinLocation | null;
  isRotating: boolean;
  pins: Pin[];
  targetRotation: { lat: number; lng: number } | null;
  isResettingRotation: boolean;
  onResetComplete: () => void;
}

function Earth({ targetLocation, isRotating, pins, targetRotation, isResettingRotation, onResetComplete }: EarthProps) {
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

  // Update points when pins or target location changes
  useEffect(() => {
    if (globeRef.current) {
      // Combine legacy targetLocation with new pins array
      const allPins = [...pins];
      if (targetLocation) {
        allPins.push({
          id: '__legacy_target__',
          lat: targetLocation.lat,
          lng: targetLocation.lng,
          color: '#ff4444',
        });
      }

      console.log("🎯 Updating globe with pins:", allPins);
      globeRef.current
        .pointsData(allPins)
        .pointColor((d: Pin) => d.color)
        .pointAltitude(0.01)
        .pointRadius(0.6);
    }
  }, [targetLocation, pins]);

  // Rotation animation
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const rotationSpeed = 0.05;

    // Auto-rotate when no target
    if (isRotating && !targetRotation && !targetLocation && !isResettingRotation) {
      groupRef.current.rotation.y += delta * 0.1;
    }

    // Rotate to target location (new or legacy)
    const activeTarget = targetRotation || targetLocation;
    if (activeTarget) {
      // Calculate target rotation
      // three-globe's coordinate system: rotate to bring lat/lng to front
      const targetRotationY = -(activeTarget.lng * Math.PI) / 180;
      const targetRotationX = (activeTarget.lat * Math.PI) / 180;

      const currentRotationY = groupRef.current.rotation.y;
      const currentRotationX = groupRef.current.rotation.x;

      // Calculate shortest angular distance
      let diffY = targetRotationY - currentRotationY;
      while (diffY > Math.PI) diffY -= 2 * Math.PI;
      while (diffY < -Math.PI) diffY += 2 * Math.PI;

      const diffX = targetRotationX - currentRotationX;

      // Smooth rotation
      const threshold = 0.001;
      if (Math.abs(diffY) > threshold) {
        groupRef.current.rotation.y += diffY * rotationSpeed;
      }
      if (Math.abs(diffX) > threshold) {
        groupRef.current.rotation.x += diffX * rotationSpeed;
      }

      // If resetting and we've reached the target (lat=0), complete the reset
      if (isResettingRotation && Math.abs(diffX) <= threshold && Math.abs(diffY) <= threshold) {
        onResetComplete();
      }
    }
  });

  return <group ref={groupRef} />;
}

interface GlobeProps {
  targetLocation: PinLocation | null;
}

const Globe = forwardRef<GlobeRef, GlobeProps>(({ targetLocation }, ref) => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [targetRotation, setTargetRotation] = useState<{ lat: number; lng: number } | null>(null);
  const [isResettingRotation, setIsResettingRotation] = useState(false);

  useImperativeHandle(ref, () => ({
    rotateToLocation: (lat: number, lng: number, animate: boolean = true) => {
      setIsResettingRotation(false); // Cancel any ongoing reset
      if (animate) {
        setTargetRotation({ lat, lng });
      } else {
        // For instant rotation, we'd need access to groupRef from Earth
        // For now, animate is always true
        setTargetRotation({ lat, lng });
      }
    },

    addPin: (lat: number, lng: number, color: string = '#ff4444', label?: string) => {
      const id = `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newPin: Pin = { id, lat, lng, color, label };
      setPins((prev) => [...prev, newPin]);
      console.log("📍 Added pin:", newPin);
      return id;
    },

    addCityPin: async (
      cityName: string,
      options?: { color?: string; label?: string; rotate?: boolean }
    ) => {
      const { color = '#ff4444', label, rotate = true } = options || {};

      try {
        console.log(`🌆 Geocoding city: ${cityName}...`);

        // Call Nominatim API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`,
          {
            headers: {
              'User-Agent': 'KnightHacks2025-Globe-App', // Nominatim requires User-Agent
            },
          }
        );

        if (!response.ok) {
          console.error(`❌ Geocoding API error: ${response.status} ${response.statusText}`);
          return null;
        }

        const data = await response.json();

        if (!data || data.length === 0) {
          console.error(`❌ City not found: ${cityName}`);
          return null;
        }

        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        console.log(`✅ Found: ${display_name} (${latitude}, ${longitude})`);

        // Add pin (inline logic - can't use this.addPin)
        const pinId = `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newPin: Pin = {
          id: pinId,
          lat: latitude,
          lng: longitude,
          color,
          label: label || cityName
        };
        setPins((prev) => [...prev, newPin]);
        console.log("📍 Added pin:", newPin);

        // Rotate to location if requested (inline logic - can't use this.rotateToLocation)
        if (rotate) {
          setIsResettingRotation(false);
          setTargetRotation({ lat: latitude, lng: longitude });
        }

        return {
          id: pinId,
          lat: latitude,
          lng: longitude,
        };
      } catch (error) {
        console.error(`❌ Error geocoding city "${cityName}":`, error);
        return null;
      }
    },

    removePin: (id: string) => {
      setPins((prev) => prev.filter((pin) => pin.id !== id));
      console.log("🗑️ Removed pin:", id);
    },

    clearAllPins: () => {
      setPins([]);
      console.log("🧹 Cleared all pins");
    },

    resetRotation: () => {
      // Smoothly reset latitude to 0 (equator view)
      setTargetRotation({ lat: 0, lng: 0 });
      setIsResettingRotation(true);
      console.log("🔄 Resetting rotation to equator...");
    },
  }));

  const handleResetComplete = () => {
    setTargetRotation(null);
    setIsResettingRotation(false);
    console.log("✅ Reset complete - auto-rotation enabled");
  };

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 300], fov: 45 }}>
        <ambientLight intensity={2.0} />
        <directionalLight position={[5, 3, 5]} intensity={2.5} />
        <directionalLight position={[-5, -3, -5]} intensity={1.0} />
        <pointLight position={[10, 0, 0]} intensity={1.2} />
        <pointLight position={[-10, 0, 0]} intensity={1.2} />
        <pointLight position={[0, 10, 0]} intensity={0.8} />
        <pointLight position={[0, -10, 0]} intensity={0.8} />
        <pointLight position={[0, 0, -10]} intensity={1.0} />
        <Earth
          targetLocation={targetLocation}
          isRotating={true}
          pins={pins}
          targetRotation={targetRotation}
          isResettingRotation={isResettingRotation}
          onResetComplete={handleResetComplete}
        />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
});

Globe.displayName = 'Globe';

export default Globe;
