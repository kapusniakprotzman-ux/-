/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Gift, Camera, Sliders, Info, HelpCircle, Heart, Star, CloudMoon, Compass, Share2, Minimize2 } from 'lucide-react';
import { ParticleConfig, HandData, ShapeType } from './types';
import ThreeCanvas from './components/ThreeCanvas';
import HandTracker from './components/HandTracker';
import ControlPanel from './components/ControlPanel';

export default function App() {
  // Master Configuration State
  const [config, setConfig] = useState<ParticleConfig>({
    shape: 'text',
    primaryColor: '#FF80B5', // Bubblegum Pink
    secondaryColor: '#54EAFF', // Cotton Cyan
    glowColor: '#FFF37D', // Gold Sparkle
    backgroundColor: '#0F091F', // Midnight Obsidian
    particleSize: 0.18,
    speed: 0.65,
    interactiveForce: 1.2,
    cameraActive: false,
    gestureSensitivity: 0.95
  });

  // Hand Tracker Coordinate State
  const [handData, setHandData] = useState<HandData>({
    detected: false,
    x: 0,
    y: 0,
    z: 0,
    openness: 1.0,
    isPinching: false
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHowTo, setShowHowTo] = useState(true);
  const appContainerRef = useRef<HTMLDivElement | null>(null);

  // Fullscreen event sync listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Update Config Helper
  const handleConfigChange = (updater: Partial<ParticleConfig>) => {
    setConfig(prev => ({ ...prev, ...updater }));
  };

  // Fullscreen toggle helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      appContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Quick Preset Shapes Launcher
  const presetShapes: { type: ShapeType; emoji: string; label: string }[] = [
    { type: 'text', emoji: '🎁', label: '节日贺词' },
    { type: 'balloon', emoji: '🎈', label: '气球' },
    { type: 'candy', emoji: '🍬', label: '糖果' },
    { type: 'star', emoji: '⭐', label: '星星' },
    { type: 'airplane', emoji: '✈️', label: '纸飞机' },
    { type: 'rainbow', emoji: '🌈', label: '彩虹' }
  ];

  return (
    <div
      ref={appContainerRef}
      id="root-viewport"
      className="min-h-screen bg-gradient-to-b from-[#FFF2F2] via-[#F4F9FF] to-[#EDF6FF] flex flex-col relative overflow-x-hidden font-sans pb-12 transition-colors duration-1000"
      style={{
        background: isFullscreen ? config.backgroundColor : undefined
      }}
    >
      {/* Background Decorative Children illustrations (Only shown in standard mode) */}
      {!isFullscreen && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Top-Right Dreamy Cloud */}
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 0.15, x: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute top-8 right-12 text-[140px]"
          >
            ☁️
          </motion.div>
          {/* Top-Left Stars */}
          <motion.div
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: 0.35, scale: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            className="absolute top-16 left-16 text-4xl text-amber-300"
          >
            ✨
          </motion.div>
          {/* Middle-Right Lollipop floating */}
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/3 right-16 text-5xl opacity-20 filter blur-[0.6px]"
          >
            🍭
          </motion.div>
          {/* Lower-Left Balloon floating */}
          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-1/4 left-16 text-6xl opacity-25 filter blur-[0.6px]"
          >
            🎈
          </motion.div>
        </div>
      )}

      {/* HEADER SECTION (Slide away in fullscreen to maximize 3D layout) */}
      <AnimatePresence>
        {!isFullscreen && (
          <motion.header
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-7xl mx-auto px-4 pt-6 pb-2 grid grid-cols-1 md:grid-cols-2 items-center gap-4 z-10 relative select-none"
          >
            {/* Title Block with playful fonts */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-rose-400 via-pink-400 to-amber-300 rounded-2xl flex items-center justify-center shadow-[0_8px_20px_rgba(244,63,94,0.3)] shrink-0 animate-bounce" style={{ animationDuration: '4s' }}>
                <Gift className="text-white w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-rose-100 text-rose-500 font-sans font-black text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full border border-rose-200">
                    JUNE 1st SPECIAL 🎁
                  </span>
                  <div className="flex gap-0.5 text-amber-400">
                    <Star size={10} className="fill-amber-400" />
                    <Star size={10} className="fill-amber-400 animate-pulse" />
                    <Star size={10} className="fill-amber-400" />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 tracking-tight font-sans mt-0.5">
                  童心筑梦 3D 手势星海
                </h1>
              </div>
            </div>

            {/* Quick description & manual button */}
            <div className="flex items-center justify-start md:justify-end gap-3 md:gap-4 mt-2 md:mt-0">
              <span className="text-xs font-medium text-slate-500 max-w-[260px] text-left md:text-right leading-relaxed hidden sm:block">
                探索物理引擎与AI视觉神经。摇晃手指，引导漫天星海凝聚、爆裂，创造属于您的儿童节魔法！
              </span>
              <button
                onClick={() => setShowHowTo(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/50 text-slate-600 transition-all font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                id="btn-help-guide"
              >
                <HelpCircle size={15} className="text-rose-400" /> 手势秘籍
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* MAIN LAYOUT CONTAINER */}
      <main className="w-full max-w-7xl mx-auto px-4 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch z-10 relative mt-2">
        
        {/* LEFT COLUMN: The Three.js 3D Screen (Takes 7 or 8 columns based on state) */}
        <div className={`flex flex-col lg:col-span-8 h-full transition-all duration-300 relative ${isFullscreen ? 'lg:col-span-12 px-0 py-0' : ''}`}>
          
          {/* Fullscreen Overlay Floating Controls */}
          {isFullscreen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-6 inset-x-6 z-20 pointer-events-none flex items-center justify-between select-none"
            >
              <div className="bg-slate-950/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3 shadow-lg">
                <span className="text-xl">🎪</span>
                <div>
                  <h4 className="text-white text-xs font-bold leading-none">童梦奇境·全屏魔镜</h4>
                  <span className="text-[9px] text-slate-400 font-mono mt-1 block">Active Shape: {config.shape.toUpperCase()}</span>
                </div>
              </div>

              {/* Quick Launcher icons inside Fullscreen Overlay */}
              <div className="flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 pointer-events-auto shadow-lg">
                {presetShapes.map(sh => (
                  <button
                    key={sh.type}
                    onClick={() => handleConfigChange({ shape: sh.type })}
                    className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      config.shape === sh.type ? 'bg-rose-500 text-white' : 'hover:bg-white/10 text-slate-300'
                    }`}
                    title={sh.label}
                  >
                    {sh.emoji}
                  </button>
                ))}
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800 text-white border border-white/10 pointer-events-auto shadow-lg cursor-pointer transition-all duration-200"
              >
                <Minimize2 size={16} />
              </button>
            </motion.div>
          )}

          {/* Interactive Canvas container */}
          <div className={`relative w-full rounded-3xl bg-slate-950 shadow-2xl transition-all duration-500 border-4 border-white ${
            isFullscreen ? 'h-screen border-none rounded-none' : 'h-[580px]'
          }`}>
            <ThreeCanvas config={config} handData={handData} />
            
            {/* Gesture feedback HUD */}
            {handData.detected && !isFullscreen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-4 right-4 z-20 select-none pointer-events-none"
              >
                <div className="flex items-center gap-3 bg-slate-950/60 border border-white/10 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-lg">
                  <div className="relative flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border border-emerald-400 bg-emerald-500/10 flex items-center justify-center">
                      <span className="text-base animate-pulse">
                        {handData.openness > 0.72 ? '🖐️' : (handData.openness < 0.28 ? '✊' : '👌')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-white leading-none">手部姿态实时捕捉</h5>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                      张合度: <span className="text-emerald-400 font-mono font-bold">{Math.round(handData.openness * 100)}%</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Camera Control panel + Controls Panel (Stays hidden in fullscreen) */}
        {!isFullscreen && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="flex flex-col lg:col-span-4 gap-6 h-full"
          >
            {/* AI Gesture Camera Feed Controller */}
            <HandTracker
              onHandUpdate={setHandData}
              active={config.cameraActive}
              onActiveToggle={(active) => handleConfigChange({ cameraActive: active })}
            />

            {/* Custom Interactive Settings Canvas Controllers */}
            <ControlPanel
              config={config}
              onConfigChange={handleConfigChange}
              onFullscreenToggle={toggleFullscreen}
              isFullscreen={isFullscreen}
            />
          </motion.div>
        )}

      </main>

      {/* GESTURE TUTORIAL / GAME GUIDE DIALOG POP-UP */}
      <AnimatePresence>
        {showHowTo && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 border border-rose-50 shadow-2xl relative overflow-hidden font-sans select-none"
            >
              {/* Cute upper decorative candy ribbon */}
              <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-300" />
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-bounce">🎈</span>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">手势星空魔法秘籍</h2>
                </div>
                <button
                  onClick={() => setShowHowTo(false)}
                  className="p-1 px-2.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all font-bold cursor-pointer text-sm"
                  id="btn-close-guide"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                欢迎来到 3D 手势粒子魔法沙盒！开启你顶部的摄像头，将一只手放入镜头区域，即可召唤属于你的引力奇点（推荐摄像头位于平视视角，光线充足）：
              </p>

              {/* Three magic gestures visualizer list */}
              <div className="flex flex-col gap-3.5 mt-5">
                {/* GESTURE 1 */}
                <div className="flex items-start gap-3.5 bg-[#FFF5F6] p-3 rounded-2xl border border-rose-100/50">
                  <div className="text-2xl bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    ✊
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-rose-500 flex items-center gap-1">
                      <span>握紧拳头</span>
                      <span className="text-[10px] bg-rose-200/50 text-rose-600 px-1.5 py-0.2 rounded-full font-sans font-black">
                        GRAVITY VORTEX
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-normal mt-1 w-full">
                      粒子会瞬间瓦解原有形状并向你的拳心中心聚集。在镜头里旋转、移动，就像握持着一个吸引漫天星宿的黑洞力场！
                    </p>
                  </div>
                </div>

                {/* GESTURE 2 */}
                <div className="flex items-start gap-3.5 bg-[#F4FBFF] p-3 rounded-2xl border border-sky-100/50">
                  <div className="text-2xl bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    🖐️
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-sky-500 flex items-center gap-1">
                      <span>张开五指</span>
                      <span className="text-[10px] bg-sky-200/50 text-sky-600 px-1.5 py-0.2 rounded-full font-sans font-black">
                        SUPERNOVA SCATTER
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-normal mt-1">
                      粒子群会受到排斥，爆裂散开化作五彩斑斓的流星风暴！当手掌向外移，粒子会像璀璨的烟花一样在屏幕舒张、飞舞。
                    </p>
                  </div>
                </div>

                {/* GESTURE 3 */}
                <div className="flex items-start gap-3.5 bg-[#FFFDF1] p-3 rounded-2xl border border-yellow-100/50">
                  <div className="text-2xl bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    👌 / 🖖
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-amber-500 flex items-center gap-1">
                      <span>舒缓摆手 / 魔法棒</span>
                      <span className="text-[10px] bg-amber-200/50 text-amber-600 px-1.5 py-0.2 rounded-full font-sans font-black">
                        WAND FLOW
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-normal mt-1">
                      粒子会形成一道细腻、轻盈的星河漩涡，跟随你指尖的运动轨迹柔顺滑行，绘制出梦幻般的星空飘带。
                    </p>
                  </div>
                </div>
              </div>

              {/* Tips block */}
              <div className="mt-5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-500 leading-relaxed flex items-center gap-2">
                <span>🧁</span>
                <span>
                  <strong>温馨提示：</strong>如果你不希望使用摄像头，你完全可以<strong>用鼠标在左边3D画布上拖拽点击</strong>旋转视点、或在右边控制栏自由调节粒子！
                </span>
              </div>

              {/* Play with sparkles button */}
              <button
                onClick={() => setShowHowTo(false)}
                id="btn-confirm-guide"
                className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-rose-400 to-amber-300 text-white font-bold font-sans text-xs shadow-md shadow-rose-200 hover:scale-101 active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles size={14} /> 开启我的节日手势魔法!
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Outer humble kid-friendly signature footer */}
      {!isFullscreen && (
        <footer className="w-full text-center mt-12 mb-2 select-none z-10 relative">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1 font-sans">
            玩具箱粒子世界 
            <Heart size={10} className="text-rose-400 fill-rose-300 animate-pulse" /> 
            六一儿童节快乐 · 愿你童心永驻
          </p>
        </footer>
      )}
    </div>
  );
}
