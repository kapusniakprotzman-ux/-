/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateTextPoints } from './textSampler';

// Re-export text sampler for convenience
export { generateTextPoints };

/**
 * Generate 3D balloon shape points.
 * Squeezed lower half, small knot at base, waving hanging string.
 */
export function generateBalloonPoints(count: number): { x: number; y: number; z: number; colorIndex: number }[] {
  const points: { x: number; y: number; z: number; colorIndex: number }[] = [];
  const bulbCount = Math.floor(count * 0.85);
  const tailCount = count - bulbCount;

  // 1. Balloon Bulb (85% of particles)
  for (let i = 0; i < bulbCount; i++) {
    const u = Math.random() * Math.PI * 2; // Longitude
    const v = Math.acos(Math.random() * 2 - 1); // Latitude (uniform distribution)
    
    // Pear-like teardrop morph: squeeze bottom
    const scale = 1.0 - 0.22 * (1.0 + Math.cos(v));
    const r = 2.1;
    
    const x = r * scale * Math.sin(v) * Math.cos(u);
    const z = r * scale * Math.sin(v) * Math.sin(u);
    const y = r * Math.cos(v) * 1.35 + 0.6; // Shift up slightly

    // Give some color variation index: 0 is primary, 1 is secondary
    const colorIndex = Math.random() > 0.4 ? 0 : 1;
    points.push({ x, y, z, colorIndex });
  }

  // 2. Base Knot and Hanging Wavy String (15% of particles)
  for (let i = 0; i < tailCount; i++) {
    if (i < tailCount * 0.2) {
      // Small triangular knot at bottom
      const u = Math.random() * Math.PI * 2;
      const h = Math.random() * 0.35;
      const r = h * 0.7; // flared opening
      const x = r * Math.cos(u);
      const z = r * Math.sin(u);
      const y = -1.2 - h;
      points.push({ x, y, z, colorIndex: 0 });
    } else {
      // Wavy string dangling down
      const t = (i - tailCount * 0.2) / (tailCount * 0.8); // 0 to 1
      const y = -1.55 - t * 2.8; // hangs down
      const waveFreq = 3.5;
      const waveAmp = 0.25;
      const x = Math.sin(t * waveFreq * Math.PI) * waveAmp;
      const z = Math.cos(t * waveFreq * Math.PI) * waveAmp * 0.6;
      points.push({ x, y, z, colorIndex: 1 });
    }
  }

  return points;
}

/**
 * Generate wrapped candy points.
 * Ellipse core and triangular flaring twins on left and right.
 */
export function generateCandyPoints(count: number): { x: number; y: number; z: number; colorIndex: number }[] {
  const points: { x: number; y: number; z: number; colorIndex: number }[] = [];
  const coreCount = Math.floor(count * 0.6);
  const wrapCount = count - coreCount;
  const sideCount = Math.floor(wrapCount / 2);

  // 1. Center Sweet Body (ellipsoidal)
  for (let i = 0; i < coreCount; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.acos(Math.random() * 2 - 1);
    
    const rx = 1.9;
    const ry = 1.15;
    const rz = 1.15;

    const x = rx * Math.sin(v) * Math.cos(u);
    const y = ry * Math.cos(v);
    const z = rz * Math.sin(v) * Math.sin(u);

    // Diagonal stripes on candy body! Let's classify using theta
    const stripColorIdx = Math.sin(u * 4 + v * 3) > 0 ? 0 : 1;
    points.push({ x, y, z, colorIndex: stripColorIdx });
  }

  // 2. Twisted Wrappings on Left & Right
  const generateTwist = (dir: number, countNum: number) => {
    for (let i = 0; i < countNum; i++) {
      const t = Math.random(); // 0 to 1 distance
      const theta = Math.random() * Math.PI * 2;
      
      const maxRadius = 0.15 + t * 0.85; // flaring cone
      const x = dir * (1.9 + t * 1.3); // extension on X axis
      
      // Twist spiral rotation
      const spiralAngle = theta + t * 4.0;
      const y = Math.sin(spiralAngle) * maxRadius;
      const z = Math.cos(spiralAngle) * maxRadius;

      // Outer edges of wrap have colorIndex 1, center twist has colorIndex 0
      const colorIndex = t > 0.5 ? 1 : 0;
      points.push({ x, y, z, colorIndex });
    }
  };

  generateTwist(-1, sideCount);
  generateTwist(1, wrapCount - sideCount);

  return points;
}

/**
 * Generate 3D five-pointed star.
 * Tapered pillow volume, symmetric polar points.
 */
export function generateStarPoints(count: number): { x: number; y: number; z: number; colorIndex: number }[] {
  const points: { x: number; y: number; z: number; colorIndex: number }[] = [];
  const R_outer = 2.8;
  const R_inner = 1.1;
  const thickness = 0.65;

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    
    // Polar form triangle wave for 5 points
    const p = 5 * theta / (Math.PI * 2);
    const frac = p - Math.floor(p);
    const factor = 1.0 - 2.0 * Math.abs(frac - 0.5);
    const Rs = R_inner + (R_outer - R_inner) * factor;

    // Radius distribution (using sqrt for linear density)
    const r = Math.sqrt(Math.random()) * Rs;

    // Thickness tapers to outer points
    const edgeFactor = 1.0 - (r / Rs);
    const zMax = thickness * Math.max(0.12, edgeFactor);
    const z = (Math.random() - 0.5) * 2.0 * zMax;

    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);

    // Stellate rings color index
    const colorIndex = r > R_inner * 1.2 ? 0 : 1;
    points.push({ x, y, z, colorIndex });
  }

  return points;
}

/**
 * Generate Origami Paper Airplane.
 * Symmetry, geometric flat surfaces with tiny organic jitter.
 */
export function generateAirplanePoints(count: number): { x: number; y: number; z: number; colorIndex: number }[] {
  const points: { x: number; y: number; z: number; colorIndex: number }[] = [];

  // Setup 3D points representing the folds of paper plane
  const Nose = { x: 0, y: -0.2, z: 2.6 };
  const TailTop = { x: 0, y: 0.7, z: -1.8 };
  const TailKeel = { x: 0, y: -0.7, z: -1.3 };
  const LeftTip = { x: -3.0, y: 1.0, z: -1.8 };
  const RightTip = { x: 3.0, y: 1.0, z: -1.8 };
  const LeftCrease = { x: -0.6, y: 0.1, z: -1.6 };
  const RightCrease = { x: 0.6, y: 0.1, z: -1.6 };

  // Organize into discrete triangles representing paper faces
  const triangles = [
    { a: Nose, b: LeftCrease, c: LeftTip, colorIndex: 0 },   // Left Wing outer
    { a: Nose, b: RightCrease, c: RightTip, colorIndex: 0 }, // Right Wing outer
    { a: Nose, b: TailTop, c: LeftCrease, colorIndex: 1 },    // Left Wing Fold-joint
    { a: Nose, b: TailTop, c: RightCrease, colorIndex: 1 },   // Right Wing Fold-joint
    { a: Nose, b: LeftCrease, c: TailKeel, colorIndex: 0 },   // Left Fuselage
    { a: Nose, b: RightCrease, c: TailKeel, colorIndex: 0 }   // Right Fuselage
  ];

  const particlesPerTriangle = Math.floor(count / triangles.length);

  triangles.forEach((tri, index) => {
    const isLast = index === triangles.length - 1;
    const n = isLast ? (count - index * particlesPerTriangle) : particlesPerTriangle;

    for (let i = 0; i < n; i++) {
      let r1 = Math.random();
      let r2 = Math.random();
      if (r1 + r2 > 1) {
        r1 = 1 - r1;
        r2 = 1 - r2;
      }

      // Barycentric coordinate interpolation
      const x = tri.a.x + r1 * (tri.b.x - tri.a.x) + r2 * (tri.c.x - tri.a.x);
      const y = tri.a.y + r1 * (tri.b.y - tri.a.y) + r2 * (tri.c.y - tri.a.y);
      const z = tri.a.z + r1 * (tri.b.z - tri.a.z) + r2 * (tri.c.z - tri.a.z);

      const jitter = 0.035;
      points.push({
        x: x + (Math.random() - 0.5) * jitter,
        y: y + (Math.random() - 0.5) * jitter,
        z: z + (Math.random() - 0.5) * jitter,
        colorIndex: tri.colorIndex
      });
    }
  });

  return points;
}

/**
 * Generate 3D Rainbow semi-ring bands.
 * Consists of exactly 7 concentric ribbons of particles.
 */
export function generateRainbowPoints(count: number): { x: number; y: number; z: number; colorIndex: number }[] {
  const points: { x: number; y: number; z: number; colorIndex: number }[] = [];

  for (let i = 0; i < count; i++) {
    // Distribute equally into 7 bands (indexing 0..6 translates to violet..red)
    const bandIdx = Math.floor(Math.random() * 7);
    
    const baseR = 1.8;
    const bandThickness = 0.18;
    const r = baseR + bandIdx * bandThickness;

    // Angle theta from 0 to PI creating a beautiful arch
    const theta = Math.random() * Math.PI;

    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta) - 1.1; // Offset Y downwards
    const z = (Math.random() - 0.5) * 0.7; // Thick extruded look

    points.push({
      x,
      y,
      z,
      colorIndex: bandIdx // Storing band index so we can map to the full rainbow spectrum!
    });
  }

  return points;
}
