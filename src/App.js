import React, { Suspense, useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";

import { Earth } from "./components/scene/Earth";
import { MilkyWay } from "./components/scene/MilkyWay";
import { CelestialGrid } from "./components/celestial/CelestialGrid";
import { Axes } from "./components/scene/Axes";
import { CelestialObjects } from "./components/celestial/CelestialObjects";
import { LoadingIndicator } from "./components/scene/LoadingIndicator";
import { CelestialFilter } from "./components/ui/CelestialFilter";
import { useCelestialFilter } from "./hooks/useCelestialFilter";
import "./components/ui/RangeSlider.css"; 
import  MusicControl  from "./components/ui/MusicControl";
import HelpPanel from './components/ui/HelpPanel';

import { useWelcomeAnimation, WelcomeAnimationUI, WelcomeAnimationController } from './components/ui/WelcomeAnimation';

export default function App() {
  const { 
    isPlaying, 
    step, 
    skipAnimation,
    handleComplete,
    handleStepChange,
    hasPlayed,
    startAnimation
  } = useWelcomeAnimation();

  const [celestialData, setcelestialData] = useState([]);

  // 🔧 添加过滤器Hook
  const { 
    filters, 
    setFilters, 
    filteredData, 
    totalCount, 
    filteredCount,
    availableTypes, 
    availableFilters, 
    availableMonths,
    showLabels,
    setShowLabels
  } = useCelestialFilter(celestialData);

  const musicRef = useRef();
  const isMouseDown = useRef(false); // ⭐ 改用布尔值

  const handleFirstInteraction = () => {
    console.log('🎯 [App] handleFirstInteraction 触发');
    console.log('🔍 [App] isMouseDown.current:', isMouseDown.current);
    
    if (isMouseDown.current) {
      console.log('🖱️ [App] 真实拖动，触发音乐');
      musicRef.current?.play();
    } else {
      console.log('🔍 [App] zoom 操作，忽略');
    }
  };

  
  useEffect(() => {

    fetch("/data/celestial_objects_full.csv")      
      .then((res) => res.text())
      .then((text) => {
        const parsed = Papa.parse(text, { header: true }).data;
        const cleaned = parsed.map(d => ({
          name: d.天体名称,
          ra: d.RA,
          dec: d.DEC,
          dist: d.距离光年,
          imageUrl: d.Image || null,
          wikiUrl: d.Wikipedia || null,
          type: d.天体类型 || null,        
          filter: d.滤镜 || null,           
          bestMonth: d.最佳观测月份 || null 
        }));
        setcelestialData(cleaned);
      });
  }, []);

  
  useEffect(() => {
    const handlePointerDown = () => {
      isMouseDown.current = true;
      console.log('👇 [App] 鼠标按下');
    };
    
    const handlePointerUp = () => {
      isMouseDown.current = false;
      console.log('👆 [App] 鼠标抬起');
    };
    
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);
  
  return (    
    <div style={{ width: "100vw", height: "100vh" }}>
      {/* ✅ UI 组件在外部 */}
      <WelcomeAnimationUI 
        isPlaying={isPlaying} 
        step={step} 
        onSkip={skipAnimation} 
      />

      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <color attach="background" args={["#000"]} />
        <ambientLight intensity={1.6} />
        <pointLight position={[5, 5, 5]} />

        {/* ✅ 动画控制器在 Canvas 内部 */}
        <WelcomeAnimationController 
          isPlaying={isPlaying}
          onStepChange={handleStepChange}
          onComplete={handleComplete}
        />

        <Suspense fallback={<LoadingIndicator />}>
          <MilkyWay />
          <Earth />
          <CelestialGrid />
          <Axes />
          <CelestialObjects data={filteredData} showLabels={!showLabels && !isPlaying} isAnimating={isPlaying && step >= 2}/>
        </Suspense>
        <Stars radius={100} depth={50} count={5000} factor={2} fade />
        <OrbitControls 
          enablePan={true} 
          onStart={() => {
            console.log('🎯 [App] OrbitControls onStart 触发');
            // ⭐ 在下一帧检查
            requestAnimationFrame(() => {
              handleFirstInteraction();
            });
          }}
          panSpeed={1} 
          maxDistance={50} 
          minDistance={2}/>

      </Canvas>
      
      <HelpPanel />
      
      {/* UI 控件容器 */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          display: "flex",
          flexDirection: "column",  // ✅ 垂直排列
          alignItems: "flex-end",   // ✅ 靠右对齐
          gap: "12px",              // ✅ 控件间距
          zIndex: 1000,
          // ⭐ 动画播放时降低透明度
          opacity: isPlaying ? 0.3 : 1,
        }}
      >
        

        <MusicControl ref={musicRef} fadeDuration={1200}  />

        {/* 🔧 添加右侧过滤器面板 */}
        <CelestialFilter
          filters={filters}
          onFilterChange={setFilters}
          totalObjects={totalCount}
          filteredObjects={filteredCount}
          availableTypes={availableTypes}      
          availableFilters={availableFilters}  
          availableMonths={availableMonths}    
          showLabels={showLabels}
          onShowLabelsChange={setShowLabels}
        />

        {/* ✅ 重播按钮（首次播放后显示） */}
        {hasPlayed && !isPlaying && (
          <button
            onClick={startAnimation}
            style={{
              //position: 'absolute',
              top: '180px',
              left: '20px',
              zIndex: 1000,
              padding: '10px 20px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'Arial, sans-serif',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(0, 0, 0, 0.9)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(0, 0, 0, 0.7)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
          >
            🎬 重播欢迎动画
          </button>
        )}
        
      </div>

       

      
    </div>
  );
}