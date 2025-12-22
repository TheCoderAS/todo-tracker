"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: React.ReactNode;
};

const CLOSE_DURATION_MS = 220;

export default function Modal({ isOpen, onClose, ariaLabel, children }: ModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(isClosing);

  useEffect(() => {
    closingRef.current = isClosing;
  }, [isClosing]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      return undefined;
    }

    if (shouldRender) {
      setIsClosing(true);
      const timer = window.setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, CLOSE_DURATION_MS);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (!shouldRender || !canvasRef.current) return;

    const container = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.TorusKnotGeometry(1.2, 0.35, 140, 20);
    const material = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.6,
      roughness: 0.25,
      emissive: 0x0f172a
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(4, 4, 6);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x22d3ee, 0.7);
    fillLight.position.set(-3, -3, 5);
    scene.add(fillLight);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / height || 1;
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener("resize", resize);

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const targetScale = closingRef.current ? 0.2 : 1;
      mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.015;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [shouldRender]);

  useEffect(() => {
    if (!shouldRender) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shouldRender, onClose]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-10 backdrop-blur transition-opacity duration-200 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
      />
      <div
        className={`relative max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-800/70 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/60 transition duration-200 ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
