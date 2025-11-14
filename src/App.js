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

export default function App() {
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

  const handleFirstDrag = () => {
    musicRef.current?.play();
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
  
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <color attach="background" args={["#000"]} />
        <ambientLight intensity={1.6} />
        <pointLight position={[5, 5, 5]} />
        <Suspense fallback={<LoadingIndicator />}>
          <MilkyWay />
          <Earth />
          <CelestialGrid />
          <Axes />
          <CelestialObjects data={filteredData} showLabels={showLabels}/>
        </Suspense>
        <Stars radius={100} depth={50} count={5000} factor={2} fade />
        <OrbitControls enablePan={true} onStart={handleFirstDrag} panSpeed={1} maxDistance={50} minDistance={2}/>

      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        maxWidth: '300px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>天体可视化Draft</h3>
        <p style={{ margin: '5px 0', fontSize: '12px' }}>
          
          • 鼠标左键拖动旋转 /右键平移/ 滚轮缩放<br/>
          • <strong>悬停星体</strong>查看详细信息<br/>
          • <strong>点击星体</strong>打开Wikipedia页面<br/>
          • Credits:<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;• Celestial objects images from Wikipedia<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;• Earth textures by Solar System Scope<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;• Milky Way texture by <a
              href="https://josefrancisco.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#4da3ff' }}
            >ESO/José Francisco
            </a>
            <br/>
          &nbsp;&nbsp;&nbsp;&nbsp;• Music by Maksym Malko from Pixabay<br/>
        </p>
      </div>
      
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
        
      </div>

       

      
    </div>
  );
}