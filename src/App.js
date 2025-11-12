import React, { Suspense, useState, useEffect } from "react";
import Papa from "papaparse";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";

import { Earth } from "./components/scene/Earth";
import { MilkyWay } from "./components/scene/MilkyWay";
import { CelestialGrid } from "./components/celestial/CelestialGrid";
import { Axes } from "./components/scene/Axes";
import { CelestialObjects } from "./components/celestial/CelestialObjects";
import { LoadingIndicator } from "./components/scene/LoadingIndicator";

export default function App() {
  const [messierData, setMessierData] = useState([]);
  
  useEffect(() => {
    fetch("/data/celestial_objects_database_southern_all.csv")      
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
        }));
        setMessierData(cleaned);
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
          <CelestialObjects data={messierData}/>
        </Suspense>
        <Stars radius={100} depth={50} count={5000} factor={2} fade />
        <OrbitControls enablePan={true} panSpeed={0.5} maxDistance={50} minDistance={2}/>
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
          • 图片来源：Wikipedia<br/>
          • Textures by Solar System Scope<br/>
          • Milky Way texture by ESO/José Francisco  (
            <a
              href="https://josefrancisco.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#4da3ff' }}
            >
              josefrancisco.org
            </a>
            )<br/>
          • 鼠标左键拖动旋转 /右键平移/ 滚轮缩放<br/>
          • <strong>悬停星体</strong>查看详细信息<br/>
          • <strong>点击星体</strong>打开Wikipedia页面<br/>
        </p>
      </div>
    </div>
  );
}