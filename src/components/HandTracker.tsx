/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Camera as CameraIcon, CameraOff, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { HandData } from '../types';

interface HandTrackerProps {
  onHandUpdate: (data: HandData) => void;
  active: boolean;
  onActiveToggle: (active: boolean) => void;
}

export default function HandTracker({ onHandUpdate, active, onActiveToggle }: HandTrackerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [opennessVal, setOpennessVal] = useState<number>(1.0);
  const [handStateInfo, setHandStateInfo] = useState<string>('未检测到手部');

  const streamRef = useRef<MediaStream | null>(null);
  const activeTrackerRef = useRef<any>(null);
  const activeCameraRef = useRef<any>(null);

  // Poll for MediaPipe script loading
  useEffect(() => {
    let checkCount = 0;
    const interval = setInterval(() => {
      if ((window as any).Hands && (window as any).Camera) {
        setLoaded(true);
        clearInterval(interval);
      }
      checkCount++;
      if (checkCount > 100) { // 10 seconds timeout
        clearInterval(interval);
        setError('无法从CDN加载手势识别组件，请检查网络连接');
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Control camera and MediaPipe based on active state
  useEffect(() => {
    if (!loaded) return;

    if (active) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [active, loaded]);

  const stopCamera = () => {
    setIsCapturing(false);
    onHandUpdate({
      detected: false,
      x: 0,
      y: 0,
      z: 0,
      openness: 1.0,
      isPinching: false,
    });

    if (activeCameraRef.current) {
      try {
        activeCameraRef.current.stop();
      } catch (e) {
        console.error(e);
      }
      activeCameraRef.current = null;
    }

    if (activeTrackerRef.current) {
      try {
        activeTrackerRef.current.close();
      } catch (e) {
        console.error(e);
      }
      activeTrackerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Clear overlay canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const startCamera = async () => {
    if (isCapturing) return;
    setError(null);

    try {
      // 1. Get webcam stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 2. Initialize MediaPipe Hands
      const HandsLib = (window as any).Hands;
      const tracker = new HandsLib({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      tracker.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      tracker.onResults(onResults);
      activeTrackerRef.current = tracker;

      // 3. Setup Camera trigger loop
      const CameraLib = (window as any).Camera;
      if (videoRef.current) {
        const camera = new CameraLib(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && activeTrackerRef.current) {
              await activeTrackerRef.current.send({ image: videoRef.current });
            }
          },
          width: 320,
          height: 240,
        });

        camera.start();
        activeCameraRef.current = camera;
        setIsCapturing(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.name === 'NotAllowedError' ? '需要摄像头授权来体验实时手势控制！' : '摄像头访问失败：' + err.message);
      onActiveToggle(false);
    }
  };

  // Process MediaPipe results
  const onResults = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Direct resolution syncing
    if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Draw skeleton mockup in custom fun neon shades
      drawHandSkeleton(ctx, landmarks);

      // Analyze parameters: Openness
      // Compute ratios of key knuckles
      const wrist = landmarks[0];
      const middleMCP = landmarks[9];

      // distance between wrist and middle MCP is our normalized hand length
      const dRef = getDistance(wrist, middleMCP);

      if (dRef > 0.01) {
        // Tips for 5 fingers
        const tips = [4, 8, 12, 16, 20];
        let totalRatio = 0;

        tips.forEach(tipIdx => {
          const tip = landmarks[tipIdx];
          const dist = getDistance(wrist, tip);
          totalRatio += dist / dRef;
        });

        // average ratio across tip/wrist vs base lengths
        const avgRatio = totalRatio / 5;

        // Fist is near 1.15, full open is near 2.3
        const sensitivity = 0.95;
        let openness = (avgRatio - 1.25) * sensitivity;
        openness = Math.min(1.0, Math.max(0.0, openness));

        setOpennessVal(openness);

        // Map coordinates to screen Space
        // MediaPipe X is 0 (left) to 1 (right). Mirror coordinate so moving physically translates intuitively:
        // We will pass mirrored values
        const mappedX = (0.5 - middleMCP.x) * 2; // -1 to 1
        const mappedY = -(middleMCP.y - 0.5) * 2; // -1 to 1
        const mappedZ = -(middleMCP.z ?? 0) * 4;

        // Pinching is true if index and thumb tips are very close
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const pinchDist = getDistance(thumbTip, indexTip) / dRef;
        const isPinching = pinchDist < 0.4;

        if (openness > 0.72) {
          setHandStateInfo('🖐️ 手掌张开 (粒子流星扩散)');
        } else if (openness < 0.3) {
          setHandStateInfo('✊ 拳头握紧 (粒子重力聚合)');
        } else {
          setHandStateInfo('👌 舒缓手势 (柔和轨迹牵引)');
        }

        // Send to visual loop
        onHandUpdate({
          detected: true,
          x: mappedX,
          y: mappedY,
          z: mappedZ,
          openness: openness,
          isPinching: isPinching,
        });
      }
    } else {
      setHandStateInfo('未检测到手部');
      // Gradually decay back to normal floating
      onHandUpdate({
        detected: false,
        x: 0,
        y: 0,
        z: 0,
        openness: 1.0,
        isPinching: false,
      });
    }
  };

  const getDistance = (p1: any, p2: any) => {
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) +
      Math.pow(p1.y - p2.y, 2) +
      Math.pow((p1.z ?? 0) - (p2.z ?? 0), 2)
    );
  };

  // Beautiful drawings of hand joints
  const drawHandSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Finger connections structure
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [5, 9], [9, 10], [10, 11], [11, 12], // Middle
      [9, 13], [13, 14], [14, 15], [15, 16], // Ring
      [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [0, 17] // Palm bottom
    ];

    // Draw lines with soft rainbow colors
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    connections.forEach(([from, to]) => {
      const p1 = landmarks[from];
      const p2 = landmarks[to];

      // Mirroring coordinates because video view is mirrored via scale-x-[-1]
      const x1 = (1.0 - p1.x) * w;
      const y1 = p1.y * h;
      const x2 = (1.0 - p2.x) * w;
      const y2 = p2.y * h;

      // Draw custom glowing colorful lines
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, '#FF80B5'); // Soft pink
      gradient.addColorStop(1, '#90F9FF'); // Soft cyan
      ctx.strokeStyle = gradient;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Draw joints
    landmarks.forEach((p, idx) => {
      const x = (1.0 - p.x) * w;
      const y = p.y * h;

      // Distinct tips vs general joints
      const isTip = [4, 8, 12, 16, 20].includes(idx);

      ctx.beginPath();
      ctx.arc(x, y, isTip ? 7 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? '#FFF47D' : '#FF9FF3'; // Gold sparkler vs bubblegum pink
      ctx.shadowColor = '#FF9FF3';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    });
  };

  return (
    <div id="gesture-controller" className="relative flex flex-col items-center select-none">
      {/* Tracker Status Card */}
      <div className="w-full bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-rose-100 shadow-[0_8px_30px_rgb(253,242,242,0.6)] flex items-center justify-between gap-4 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${active ? 'bg-rose-100 text-rose-500 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
            {active ? <Sparkles size={20} className="animate-spin" style={{ animationDuration: '6s' }} /> : <CameraOff size={20} />}
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 font-sans">
              AI 手势体感摄像头
              {active && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />}
            </h4>
            <p className="text-xs text-slate-500">
              {active ? '摄像头已开启，请正面将单手置于镜头中' : '开启摄像头以进行空气手势操控'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onActiveToggle(!active)}
          disabled={!loaded}
          id="btn-camera"
          className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all duration-300 flex items-center gap-1.5 cursor-pointer hover:scale-102 active:scale-98 relative overflow-hidden ${
            active 
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)]' 
              : 'bg-emerald-400 hover:bg-emerald-500 text-white shadow-[0_4px_12px_rgba(52,211,153,0.3)]'
          } ${!loaded ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {active ? (
            <>
              <CameraOff size={14} /> Close
            </>
          ) : (
            <>
              <CameraIcon size={14} /> Open
            </>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="w-full mt-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Script Loading Spinner */}
      {!loaded && !error && (
        <div className="w-full mt-2 p-3 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-600 flex items-center gap-2 justify-center">
          <Loader2 size={15} className="animate-spin" />
          <span>正在配置云端手势检测神经网络，请稍候...</span>
        </div>
      )}

      {/* Camera Live Preview Wrapper */}
      {active && isCapturing && (
        <div className="w-full mt-3 relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 border-4 border-white shadow-xl group">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1] absolute inset-0"
          />
          <canvas
            ref={canvasRef}
            className="w-full h-full absolute inset-0 z-10 pointer-events-none"
          />

          {/* HUD Overlay */}
          <div className="absolute inset-x-0 bottom-0 py-2.5 px-3 bg-gradient-to-t from-black/80 to-transparent z-20 flex flex-col gap-1 text-white select-none">
            <span className="text-[11px] text-slate-300 font-bold tracking-wide font-mono flex items-center gap-1">
              <Sparkles size={11} className="text-yellow-300 fill-yellow-300" /> CAMERA FEED
            </span>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-sans font-bold">{handStateInfo}</span>
              <span className="font-mono text-emerald-400">FPS / 30</span>
            </div>
            {/* Openness bar */}
            {handStateInfo !== '未检测到手部' && (
              <div className="w-full mt-1 flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono shrink-0">握拳量</span>
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-rose-400 rounded-full transition-all duration-75"
                    style={{ width: `${(1 - opennessVal) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-teal-400 font-mono shrink-0 w-8 text-right">
                  {Math.round((1 - opennessVal) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
