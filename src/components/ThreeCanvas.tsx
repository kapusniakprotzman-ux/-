/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ParticleConfig, HandData } from '../types';
import {
  generateTextPoints,
  generateBalloonPoints,
  generateCandyPoints,
  generateStarPoints,
  generateAirplanePoints,
  generateRainbowPoints
} from '../utils/shapes';

interface ThreeCanvasProps {
  config: ParticleConfig;
  handData: HandData;
}

// Particle Count constant - 5200 represents high density and amazing performance
const PARTICLE_COUNT = 5200;

export default function ThreeCanvas({ config, handData }: ThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Maintain references for core Three.js components inside the animation loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const handCursorRef = useRef<THREE.Mesh | null>(null);

  // Interactive smooth hand coordinate tracking
  const smoothedHandPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const handVisible = useRef<boolean>(false);

  // Store mathematical layout variables
  const particlesData = useRef<{
    currentPos: THREE.Vector3[];
    targetPos: THREE.Vector3[];
    vPos: THREE.Vector3[]; // Velocities
    colorIndex: number[];
    randomDelay: number[];
  }>({
    currentPos: [],
    targetPos: [],
    vPos: [],
    colorIndex: [],
    randomDelay: []
  });

  // Track state changes to re-trigger morphs
  const currentShapeRef = useRef<string>('');

  // 1. Setup Three JS Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 580;

    // SCENE
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // CAMERA
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 10);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.2, 100);
    pointLight.position.set(5, 5, 10);
    scene.add(pointLight);

    // ORBIT CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 25;
    controls.minDistance = 3;
    controls.enablePan = false; // keep centered

    // GLOW VERTEX PARTICLE TEXTURE (Canvas-Based Feathered Radial Gradient)
    const texture = createGlowTexture();

    // INITIALIZE GEOMETRY
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    // Populate initial cloud coordinates (random sphere)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const r = 2.5 + Math.random() * 1.5;

        // Position
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // Store internally
        particlesData.current.currentPos.push(new THREE.Vector3(x, y, z));
        particlesData.current.targetPos.push(new THREE.Vector3(x, y, z));
        particlesData.current.vPos.push(new THREE.Vector3(0, 0, 0));
        particlesData.current.colorIndex.push(Math.random() > 0.5 ? 0 : 1);
        particlesData.current.randomDelay.push(0.3 + Math.random() * 0.7); // speed modifier
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // CUSTOM MATERIAL COMBINING GLOW & ADDITIVE BLENDING FOR HIGH LUMINESCENCE
    const material = new THREE.PointsMaterial({
      size: config.particleSize * 0.8,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending, // Dynamic overlapping neon shine
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    pointsRef.current = points;

    // 3D HAND CURSOR MESH (Glowing Star)
    const ringGeo = new THREE.RingGeometry(0.12, 0.28, 8);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfff37d,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const handCursor = new THREE.Mesh(ringGeo, ringMat);
    scene.add(handCursor);
    handCursorRef.current = handCursor;

    // HANDLE RESIZE
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 580;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ANIMATION LOOP
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      updatePhysics(delta);

      controls.update();

      if (rendererRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, camera);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
    };
  }, []);

  // 2. Fetch/Update Shapes dynamically when config triggers change
  useEffect(() => {
    if (pointsRef.current === null) return;
    
    // Avoid double work
    if (currentShapeRef.current === config.shape) return;
    currentShapeRef.current = config.shape;

    let targetPoints: { x: number; y: number; z: number; colorIndex: number }[] = [];

    // Math models fetching
    switch (config.shape) {
      case 'balloon':
        targetPoints = generateBalloonPoints(PARTICLE_COUNT);
        break;
      case 'candy':
        targetPoints = generateCandyPoints(PARTICLE_COUNT);
        break;
      case 'star':
        targetPoints = generateStarPoints(PARTICLE_COUNT);
        break;
      case 'airplane':
        targetPoints = generateAirplanePoints(PARTICLE_COUNT);
        break;
      case 'rainbow':
        targetPoints = generateRainbowPoints(PARTICLE_COUNT);
        break;
      case 'text':
      default:
        targetPoints = generateTextPoints('六一儿童节快乐', PARTICLE_COUNT);
        break;
    }

    // Apply target positions and indices
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (targetPoints[i]) {
        particlesData.current.targetPos[i].set(
          targetPoints[i].x,
          targetPoints[i].y,
          targetPoints[i].z
        );
        particlesData.current.colorIndex[i] = targetPoints[i].colorIndex;
      }
    }
  }, [config.shape]);

  // Update dynamic size from config
  useEffect(() => {
    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      mat.size = config.particleSize * 0.8;
      mat.needsUpdate = true;
    }
  }, [config.particleSize]);

  // 3. Update hand visual state when handData coordinates update
  useEffect(() => {
    if (handData.detected) {
      handVisible.current = true;
    } else {
      handVisible.current = false;
    }
  }, [handData.detected]);

  // PHYSICS ENGINE FOR TWINKLE & HAND ATTRACTION REPEL
  const updatePhysics = (delta: number) => {
    if (!pointsRef.current) return;

    const pointsGeo = pointsRef.current.geometry;
    const positionAttr = pointsGeo.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = pointsGeo.getAttribute('color') as THREE.BufferAttribute;

    const data = particlesData.current;
    const limit = Math.min(PARTICLE_COUNT, positionAttr.count);

    // Color instances
    const primaryColObj = new THREE.Color(config.primaryColor);
    const secondaryColObj = new THREE.Color(config.secondaryColor);
    const brightYellow = new THREE.Color('#FFF47D'); // Accent

    // Rainbow colors mapping
    // Rainbow coordinates bands has 7 discrete colors
    const rainbowColors = [
      new THREE.Color('#FF6B6B'), // Pastel Red
      new THREE.Color('#FF922B'), // Pastel Orange
      new THREE.Color('#FCC419'), // Pastel Yellow
      new THREE.Color('#51CF66'), // Pastel Green
      new THREE.Color('#339AF0'), // Pastel Blue
      new THREE.Color('#845EF7'), // Pastel Violet
      new THREE.Color('#DF73FF'), // Pastel Pink
    ];

    // Smooth hand coordinate calculations
    if (handVisible.current) {
      // Map hand inputs smoothly. (Y and Z bounds adjusted for camera range)
      const idealX = handData.x * 6.5; 
      const idealY = handData.y * 4.5;
      const idealZ = handData.z * 1.5;

      smoothedHandPos.current.x += (idealX - smoothedHandPos.current.x) * 0.16;
      smoothedHandPos.current.y += (idealY - smoothedHandPos.current.y) * 0.16;
      smoothedHandPos.current.z += (idealZ - smoothedHandPos.current.z) * 0.16;

      // Animate hand tracking cursor ring in 3D
      if (handCursorRef.current) {
        handCursorRef.current.position.copy(smoothedHandPos.current);
        const mat = handCursorRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity += (0.8 - mat.opacity) * 0.1;
        // make cursor ring rotate playfully
        handCursorRef.current.rotation.z += 0.04;
      }
    } else {
      // Hide hand cursor
      if (handCursorRef.current) {
        const mat = handCursorRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity += (0 - mat.opacity) * 0.1;
      }
    }

    // Dynamic scale modifications (e.g., pinching / hand expansion)
    let extraScaleMultiplier = 1.0;
    let extraScatterForce = false;
    let extraSqueezeForce = false;

    if (handVisible.current) {
      // If hand is wide open (openness > 0.72) -> EXPAND/SCATTER
      if (handData.openness > 0.72) {
        extraScaleMultiplier = 1.0 + (handData.openness - 0.72) * 1.8;
        extraScatterForce = true;
      }
      // If hand is a fist (openness < 0.28) -> ATTRACTION VORTEX SQUEEZE
      if (handData.openness < 0.28) {
        extraSqueezeForce = true;
      }
    }

    const time = Date.now() * 0.001;

    for (let i = 0; i < limit; i++) {
      const cur = data.currentPos[i];
      const tar = data.targetPos[i];
      const vel = data.vPos[i];
      const delay = data.randomDelay[i];

      // 1. Basic Morph Force: Accelerate towards the target layout position
      // Using an individual speed parameter for staggered fluid morphs
      const morphFactor = config.speed * 4.5 * delay;
      let targetX = tar.x;
      let targetY = tar.y;
      let targetZ = tar.z;

      // Make the layout float slightly in the air organically over time like clouds
      const waveOffset = Math.sin(time * 0.8 + i * 0.05) * 0.06;
      const waveOffsetX = Math.cos(time * 0.4 + i * 0.1) * 0.04;
      targetY += waveOffset;
      targetX += waveOffsetX;

      // Apply overall scaling to shape if user triggers pinch/expand
      if (extraScatterForce) {
        // Blow outward from center of shape
        targetX *= extraScaleMultiplier;
        targetY *= extraScaleMultiplier;
        targetZ *= extraScaleMultiplier;
      }

      const dx = targetX - cur.x;
      const dy = targetY - cur.y;
      const dz = targetZ - cur.z;

      // Spring acceleration
      const springK = 6.0;
      vel.x += dx * springK * delta;
      vel.y += dy * springK * delta;
      vel.z += dz * springK * delta;

      // 2. Hand Gestures Forces
      if (handVisible.current) {
        // Distance to smoothed hand
        const distToHand = cur.distanceTo(smoothedHandPos.current);
        const forceVec = new THREE.Vector3().subVectors(smoothedHandPos.current, cur);

        if (extraSqueezeForce) {
          // Strong gravitational attraction pulling all particles into the palm
          const pullK = config.interactiveForce * 18.0;
          // Normalize force
          if (distToHand > 0.1) {
            forceVec.normalize();
            vel.x += forceVec.x * pullK * delta * (1.2 + Math.random() * 0.8);
            vel.y += forceVec.y * pullK * delta * (1.2 + Math.random() * 0.8);
            vel.z += forceVec.z * pullK * delta * (1.2 + Math.random() * 0.8);
          }
        } else if (extraScatterForce) {
          // Pushes nearby particles away dramatically
          const influenceR = 3.5;
          if (distToHand < influenceR && distToHand > 0.05) {
            // Push direction is from hand outwards to particle
            const pushVec = new THREE.Vector3().subVectors(cur, smoothedHandPos.current).normalize();
            // Pushes harder the closer it is
            const scatterK = config.interactiveForce * 12.0 * (1.0 - distToHand / influenceR);
            vel.x += pushVec.x * scatterK * delta;
            vel.y += pushVec.y * scatterK * delta;
            vel.z += pushVec.z * scatterK * delta;
          }
        } else {
          // Gentle floating wand attraction: waves and rotates slightly around current hand position
          const wandInfluenceR = 2.5;
          if (distToHand < wandInfluenceR && distToHand > 0.1) {
            // Gentle pull + spiral wind
            forceVec.normalize();
            const pullWandK = config.interactiveForce * 2.2 * (1.0 - distToHand / wandInfluenceR);
            
            // Add a orbital swirl component around Z axis
            const swirlX = -forceVec.y;
            const swirlY = forceVec.x;

            vel.x += (forceVec.x * 0.7 + swirlX * 0.6) * pullWandK * delta;
            vel.y += (forceVec.y * 0.7 + swirlY * 0.6) * pullWandK * delta;
            vel.z += forceVec.z * 0.7 * pullWandK * delta;
          }
        }
      }

      // Add small Brownian floating force to make the particles twinkle and move organically
      const brownianStrength = 0.5;
      vel.x += (Math.random() - 0.5) * brownianStrength * delta;
      vel.y += (Math.random() - 0.5) * brownianStrength * delta;
      vel.z += (Math.random() - 0.5) * brownianStrength * delta;

      // 3. Apply Velocity with drag (Friction prevents infinite oscillations)
      const dragFactor = Math.max(0.1, 4.2 * (1.0 - speedFactor(dx, dy, dz))); // increase drag as it gets closer
      vel.multiplyScalar(Math.max(0, 1.0 - dragFactor * delta));

      cur.x += vel.x * delta * 50;
      cur.y += vel.y * delta * 50;
      cur.z += vel.z * delta * 50;

      // Save to position buffer
      positionAttr.setXYZ(i, cur.x, cur.y, cur.z);

      // 4. Color Transitions Logic
      let particleColor = primaryColObj;

      if (config.shape === 'rainbow') {
        // Rainbow shape parses exact color strips
        const rainbowColorIdx = data.colorIndex[i] % 7;
        particleColor = rainbowColors[rainbowColorIdx];
      } else {
        // Morph colors: interpolate between primary and secondary based on internal index
        const colIdx = data.colorIndex[i];
        if (colIdx === 1) {
          particleColor = secondaryColObj;
        }

        // Near the glowing hand position, highlight particles yellow to make it reactive
        if (handVisible.current) {
          const distToHand = cur.distanceTo(smoothedHandPos.current);
          if (distToHand < 1.0) {
            // Blend gold accent color
            const blendRatio = 1.0 - distToHand;
            particleColor = particleColor.clone().lerp(brightYellow, blendRatio * 0.85);
          }
        }
      }

      colorAttr.setXYZ(i, particleColor.r, particleColor.g, particleColor.b);
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  };

  // Helper for computing deceleration threshold
  const speedFactor = (dx: number, dy: number, dz: number) => {
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 0.2) return 0.8;
    if (dist < 1.0) return 0.4;
    return 0.1;
  };

  // Helper function to create standard round feathers glow texture
  const createGlowTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      // Fallback blank texture
      return new THREE.Texture();
    }

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    // Sharp hotspot, feathered halo, completely transparent edge
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.12, 'rgba(255, 248, 220, 0.95)');
    gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.45)');
    gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.12)');
    gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden rounded-3xl"
      style={{
        background: `radial-gradient(circle at center, ${config.backgroundColor} 0%, #080A1A 100%)`,
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full block z-0 cursor-grab active:cursor-grabbing" />
      
      {/* Visual background atmospheric specs (3D look) */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 pointer-events-none z-10" />
      
      {/* Ambient glowing dust elements inside WebGL container */}
      <div className="absolute top-4 left-6 pointer-events-none z-10 select-none flex flex-col gap-0.5">
        <span className="text-rose-300 font-bold text-xs tracking-wider font-mono flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] bg-slate-950/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse shrink-0" />
          WebGL Real-time 3D Particle Scene
        </span>
      </div>

      {currentShapeRef.current === 'text' && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none z-10 select-none bg-slate-950/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <span className="text-yellow-200 fill-yellow-200 animate-spin" style={{ animationDuration: '8s' }}>⭐</span>
          <span className="text-slate-100 font-sans text-xs font-bold leading-none tracking-wide text-center">
            点击或拖拽3D空间，自由旋转/缩放粒子图腾
          </span>
        </div>
      )}
    </div>
  );
}
