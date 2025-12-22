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
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const geometries = [
      new THREE.IcosahedronGeometry(1.1, 0),
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.OctahedronGeometry(0.7, 0)
    ];
    const materials = [
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.5,
        roughness: 0.2,
        emissive: 0x0f172a
      }),
      new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        metalness: 0.35,
        roughness: 0.35,
        emissive: 0x1e1b4b
      }),
      new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        metalness: 0.4,
        roughness: 0.3,
        emissive: 0x082f49
      })
    ];

    const meshes = geometries.map((geometry, index) => {
      const mesh = new THREE.Mesh(geometry, materials[index]);
      group.add(mesh);
      return mesh;
    });

    meshes[0].position.set(-1.6, 0.6, 0);
    meshes[1].position.set(1.4, -0.4, -0.6);
    meshes[2].position.set(0.2, 1.6, 0.8);

    const starGeometry = new THREE.BufferGeometry();
    const starCount = 160;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      starPositions[i * 3] = (Math.random() - 0.5) * 12;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.8
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(4, 4, 6);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x22d3ee, 0.9);
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
      group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
      group.rotation.x += 0.004;
      group.rotation.y += 0.006;
      meshes[0].rotation.y += 0.01;
      meshes[1].rotation.x -= 0.008;
      meshes[2].rotation.z += 0.012;
      const time = Date.now() * 0.0004;
      camera.position.x = Math.sin(time) * 2.6;
      camera.position.y = Math.cos(time * 0.9) * 1.6;
      camera.position.z = 6.5 + Math.cos(time * 0.6) * 1.2;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      starGeometry.dispose();
      starMaterial.dispose();
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
