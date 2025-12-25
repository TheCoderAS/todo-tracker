"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, MathUtils, Mesh, MeshPhysicalMaterial } from "three";

type ProgressOrbCardProps = {
  completed: number;
  target: number;
  loading: boolean;
};

type ProgressOrbProps = {
  progress: number;
};

function ProgressOrb({ progress }: ProgressOrbProps) {
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshPhysicalMaterial>(null);
  const targetRef = useRef(progress);
  const currentRef = useRef(progress);
  const baseColor = useMemo(() => new Color("#0f172a"), []);
  const accentColor = useMemo(() => new Color("#34d399"), []);
  const emissiveColor = useMemo(() => new Color("#5eead4"), []);

  useEffect(() => {
    targetRef.current = progress;
  }, [progress]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const glow = glowRef.current;
    const material = materialRef.current;

    if (!mesh || !material) return;

    const easedProgress = MathUtils.lerp(
      currentRef.current,
      targetRef.current,
      1 - Math.exp(-delta * 3)
    );
    currentRef.current = easedProgress;

    mesh.rotation.y += delta * 0.35;
    mesh.rotation.x += delta * 0.2;

    const pulse = Math.sin(state.clock.elapsedTime * 2.2) * 0.03;
    const scale = 0.92 + easedProgress * 0.28 + pulse;
    mesh.scale.setScalar(scale);

    if (glow) {
      glow.rotation.z -= delta * 0.1;
      glow.scale.setScalar(1.18 + easedProgress * 0.35 + pulse * 1.4);
    }

    material.color.copy(baseColor).lerp(accentColor, easedProgress);
    material.emissive.copy(emissiveColor);
    material.emissiveIntensity = 0.3 + easedProgress * 1.2;
  });

  return (
    <>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.15, 64, 64]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#2dd4bf"
          transparent
          opacity={0.22}
          roughness={0.2}
          metalness={0.15}
        />
      </mesh>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.9, 96, 96]} />
        <meshPhysicalMaterial
          ref={materialRef}
          roughness={0.1}
          metalness={0.35}
          clearcoat={0.7}
          clearcoatRoughness={0.1}
        />
      </mesh>
    </>
  );
}

export default function ProgressOrbCard({
  completed,
  target,
  loading
}: ProgressOrbCardProps) {
  const progress = useMemo(() => {
    if (target <= 0) return 0;
    return Math.min(completed / target, 1);
  }, [completed, target]);

  return (
    <div className="relative flex h-full min-h-[18rem] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/95 via-slate-950/70 to-emerald-950/40 shadow-[0_0_55px_rgba(16,185,129,0.18)]">
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 3.2], fov: 50 }}
          dpr={[1, 2]}
          style={{ pointerEvents: "none" }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[2, 1.5, 3]} intensity={1.1} />
          <pointLight position={[-2, -1, 2]} intensity={0.6} />
          <ProgressOrb progress={progress} />
        </Canvas>
      </div>
      <div className="relative z-10 flex w-full flex-col justify-between gap-6 p-6">
        <div>
          <p className="text-xs uppercase text-emerald-200/70">
            3D progress orb
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Live momentum pulse
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            The orb responds in real time as you complete today’s tasks.
          </p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-4xl font-semibold text-white">
              {Math.round(progress * 100)}%
            </p>
            <p className="text-sm text-emerald-100/80">of today’s plan</p>
          </div>
          <div className="text-right text-sm text-slate-300">
            <p className="text-base font-semibold text-white">
              {completed} / {target}
            </p>
            <p>{loading ? "Syncing progress..." : "Tasks completed"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
