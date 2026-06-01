/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sparkles, Maximize2, Minimize2, Palette, Sliders, PlayCircle, Rocket } from 'lucide-react';
import { ParticleConfig, ShapeType } from '../types';
import { useState, useEffect } from 'react';

interface ControlPanelProps {
  config: ParticleConfig;
  onConfigChange: (updater: Partial<ParticleConfig>) => void;
  onFullscreenToggle: () => void;
  isFullscreen: boolean;
}

// Children's Day Inspired Color Presets
const COLOR_PRESETS = [
  {
    name: '梦幻泡泡糖 🌸',
    primary: '#FF80B5', // Bubblegum Pink
    secondary: '#54EAFF', // Cotton Sky Cyan
    glow: '#FFF066', // Butter Yellow
    bg: '#0F091F', // Deep Midnight Purple
  },
  {
    name: '香橙蜜瓜汽水 🍊',
    primary: '#FF922B', // Vivid Tangerine
    secondary: '#FFD43B', // Sunny Yellow
    glow: '#A9FF46', // Melon Green
    bg: '#140D05', // Deep Brown-black
  },
  {
    name: '星月童话 🎠',
    primary: '#9E77ED', // Dreamy Lavender
    secondary: '#FF85D7', // Magenta Fairy
    glow: '#FFF37D', // Gold stardust
    bg: '#070514', // Celestial Dark Blue
  },
  {
    name: '夏令营草地 🌲',
    primary: '#51CF66', // Grass Green
    secondary: '#FFD43B', // Golden Wildflower
    glow: '#E9FF70', // Lime shine
    bg: '#040F0A', // Forest shadows
  },
];

export default function ControlPanel({ config, onConfigChange, onFullscreenToggle, isFullscreen }: ControlPanelProps) {
  const [activePreset, setActivePreset] = useState<number>(0);

  // Apply a color preset
  const applyPreset = (idx: number) => {
    setActivePreset(idx);
    const preset = COLOR_PRESETS[idx];
    onConfigChange({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      glowColor: preset.glow,
      backgroundColor: preset.bg,
    });
  };

  const shapes: { type: ShapeType; label: string; icon: string }[] = [
    { type: 'text', label: '节日贺词', icon: '🎁' },
    { type: 'balloon', label: '五彩气球', icon: '🎈' },
    { type: 'candy', label: '缤纷糖果', icon: '🍬' },
    { type: 'star', label: '童趣金星', icon: '⭐' },
    { type: 'airplane', label: '折纸飞机', icon: '✈️' },
    { type: 'rainbow', label: '七色彩虹', icon: '🌈' },
  ];

  return (
    <div className="flex flex-col gap-5 w-full bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-rose-100 shadow-[0_8px_30px_rgb(253,242,242,0.6)] font-sans select-none">
      
      {/* SECTION 1: Shape selections */}
      <div className="flex flex-col gap-2.5">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <span className="text-rose-500 text-base">✨</span> 拼装 3D 粒子模型
        </h3>
        <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
          {shapes.map(item => (
            <button
              key={item.type}
              onClick={() => onConfigChange({ shape: item.type })}
              id={`btn-shape-${item.type}`}
              className={`p-3 rounded-xl border-2 text-xs font-bold transition-all duration-300 flex flex-col items-center gap-1.5 cursor-pointer relative overflow-hidden group ${
                config.shape === item.type
                  ? 'bg-gradient-to-br from-rose-400 to-amber-300 text-white border-transparent shadow-md scale-102 font-bold'
                  : 'bg-white border-rose-50/70 hover:border-rose-100 text-slate-600 hover:text-slate-800 hover:bg-rose-50/30'
              }`}
            >
              <span className="text-xl group-hover:scale-120 transition-transform duration-300">{item.icon}</span>
              <span>{item.label}</span>
              {config.shape === item.type && (
                <div className="absolute inset-0 bg-white/10 mix-blend-overlay pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-rose-100/50" />

      {/* SECTION 2: Preschool Preset Themes */}
      <div className="flex flex-col gap-2.5">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <Palette size={16} className="text-rose-400" />
          <span>童年糖果主题配色</span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {COLOR_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(idx)}
              id={`btn-preset-${idx}`}
              className={`p-2 rounded-xl text-left border-2 text-slate-700 transition-all duration-300 text-[11px] font-bold cursor-pointer flex flex-col gap-2 relative ${
                activePreset === idx
                  ? 'bg-rose-50/80 border-rose-400/80'
                  : 'bg-white/40 border-slate-100 hover:border-rose-200 hover:bg-rose-50/20'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span>{preset.name}</span>
                {activePreset === idx && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-md shadow-sm border border-black/5" style={{ backgroundColor: preset.primary }} />
                <span className="w-4 h-4 rounded-md shadow-sm border border-black/5" style={{ backgroundColor: preset.secondary }} />
                <span className="w-4 h-4 rounded-md shadow-sm border border-black/5" style={{ backgroundColor: preset.glow }} />
                <span className="w-4 h-4 rounded-md shadow-sm border border-black/5 block ml-auto" style={{ backgroundColor: preset.bg }} />
              </div>
            </button>
          ))}
        </div>

        {/* Customized Custom Palette inputs */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-medium">主色调 (A)</span>
            <div className="flex items-center gap-1.5 bg-white/80 p-1 rounded-xl border border-rose-50">
              <input
                type="color"
                value={config.primaryColor}
                onChange={e => onConfigChange({ primaryColor: e.target.value })}
                id="input-col-primary"
                className="w-5 h-5 rounded cursor-pointer border-0"
              />
              <span className="text-[9px] font-mono text-slate-500">{config.primaryColor.toUpperCase()}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-medium">辅色调 (B)</span>
            <div className="flex items-center gap-1.5 bg-white/80 p-1 rounded-xl border border-rose-50">
              <input
                type="color"
                value={config.secondaryColor}
                onChange={e => onConfigChange({ secondaryColor: e.target.value })}
                id="input-col-secondary"
                className="w-5 h-5 rounded cursor-pointer border-0"
              />
              <span className="text-[9px] font-mono text-slate-500">{config.secondaryColor.toUpperCase()}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-medium">背景画布 (C)</span>
            <div className="flex items-center gap-1.5 bg-white/80 p-1 rounded-xl border border-rose-50">
              <input
                type="color"
                value={config.backgroundColor}
                onChange={e => onConfigChange({ backgroundColor: e.target.value })}
                id="input-col-bg"
                className="w-5 h-5 rounded cursor-pointer border-0"
              />
              <span className="text-[9px] font-mono text-slate-500">{config.backgroundColor.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-rose-100/50" />

      {/* SECTION 3: Detailed sliders */}
      <div className="flex flex-col gap-2.5">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <Sliders size={16} className="text-amber-400" />
          <span>动力学微调组件</span>
        </h3>
        
        {/* Dynamic size */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
            <span>粒子晶体大小</span>
            <span className="font-mono font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
              {(config.particleSize * 10).toFixed(1)} Pixels
            </span>
          </div>
          <input
            type="range"
            min="0.08"
            max="0.45"
            step="0.02"
            value={config.particleSize}
            onChange={e => onConfigChange({ particleSize: parseFloat(e.target.value) })}
            id="slider-size"
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-rose-50 rounded-lg appearance-none"
          />
        </div>

        {/* Morphing Speed */}
        <div className="flex flex-col gap-1.5 mt-1.5">
          <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
            <span>流体凝聚速率 (变换速度)</span>
            <span className="font-mono font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
              {Math.round(config.speed * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.5"
            step="0.05"
            value={config.speed}
            onChange={e => onConfigChange({ speed: parseFloat(e.target.value) })}
            id="slider-speed"
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-rose-50 rounded-lg appearance-none"
          />
        </div>

        {/* Attraction force multiplier */}
        <div className="flex flex-col gap-1.5 mt-1.5">
          <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
            <span>手势牵引引力强度</span>
            <span className="font-mono font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
              {Math.round(config.interactiveForce * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.5"
            step="0.1"
            value={config.interactiveForce}
            onChange={e => onConfigChange({ interactiveForce: parseFloat(e.target.value) })}
            id="slider-force"
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-rose-50 rounded-lg appearance-none"
          />
        </div>
      </div>

      <hr className="border-rose-100/50" />

      {/* SECTION 4: System Utility buttons */}
      <div className="flex gap-2">
        <button
          onClick={onFullscreenToggle}
          id="btn-fullscreen"
          className="w-full py-3 px-4 rounded-xl text-xs font-bold font-sans transition-all duration-300 flex items-center justify-center gap-2 border shadow-sm cursor-pointer hover:scale-101 active:scale-99 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          {isFullscreen ? (
            <>
              <Minimize2 size={14} /> 退出全屏模式
            </>
          ) : (
            <>
              <Maximize2 size={14} /> 进入全屏魔镜
            </>
          )}
        </button>
      </div>

    </div>
  );
}
