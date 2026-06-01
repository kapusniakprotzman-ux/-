/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Render Chinese text onto a temporary canvas and sample points to formulate
 * a crisp 3D text outline in Three.js coordinates.
 */
export function generateTextPoints(text: string, count: number): { x: number; y: number; z: number; colorIndex: number }[] {
  const canvas = document.createElement('canvas');
  // Wide rectangle to fit long text
  canvas.width = 1200;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    // Fallback if canvas is not supported (random cloud)
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 3,
      z: (Math.random() - 0.5) * 0.5,
      colorIndex: Math.random() > 0.5 ? 0 : 1
    }));
  }

  // Clear background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Write text
  ctx.fillStyle = '#ffffff';
  // Use a fat, ultra-bold system font to produce thick lines
  ctx.font = '900 115px sans-serif, system-ui, "SF Pro Display", "PingFang SC", "Microsoft YaHei"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  // Read pixels
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const activePixels: { x: number; y: number }[] = [];

  // Downsample to select white pixels
  for (let y = 0; y < canvas.height; y += 2) {
    for (let x = 0; x < canvas.width; x += 2) {
      const idx = (y * canvas.width + x) * 4;
      const alpha = data[idx]; // Just grab R channel since it's white/black
      if (alpha > 120) {
        activePixels.push({ x, y });
      }
    }
  }

  // If text is empty or failed
  if (activePixels.length === 0) {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 3,
      z: (Math.random() - 0.5) * 0.5,
      colorIndex: Math.random() > 0.5 ? 0 : 1
    }));
  }

  const points: { x: number; y: number; z: number; colorIndex: number }[] = [];
  
  for (let i = 0; i < count; i++) {
    // Pick an active pixel
    const pixel = activePixels[Math.floor(Math.random() * activePixels.length)];
    
    // Convert to centered Three.js coordinates
    // Map width (0..1200) to approx (-6..6)
    const px = ((pixel.x / canvas.width) - 0.5) * 13.5;
    // Map height (0..300) to approx (-2..2). Canvas Y goes down, WebGL goes up
    const py = -((pixel.y / canvas.height) - 0.5) * 3.8;
    // Add slight random depth thickness
    const pz = (Math.random() - 0.5) * 0.9;

    // Distribute colorIndex based on the X coordinate position
    // Creates a nice left-to-right gradient color split index
    const colorIndex = pixel.x < canvas.width * 0.5 ? 0 : 1;

    points.push({ x: px, y: py, z: pz, colorIndex });
  }

  return points;
}
