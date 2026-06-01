/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ShapeType = 'text' | 'balloon' | 'candy' | 'star' | 'airplane' | 'rainbow';

export interface ParticleConfig {
  shape: ShapeType;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  backgroundColor: string;
  particleSize: number;
  speed: number;
  interactiveForce: number; // For hand attraction/repulsion
  cameraActive: boolean;
  gestureSensitivity: number;
}

export interface HandData {
  detected: boolean;
  x: number; // -1 to 1 mapped coordinator
  y: number; // -1 to 1 mapped coordinator
  z: number;
  openness: number; // 0 (fist/closed) to 1 (fully spread/open)
  isPinching: boolean;
}
