import React, { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

// 使用真实纹理的地球组件
function EarthWithTextures() {
  const earthTexture = useLoader(THREE.TextureLoader, '/textures/earth_day.jpg');
  const cloudsTexture = useLoader(THREE.TextureLoader, '/textures/earth_clouds.jpg');
  
  earthTexture.colorSpace = THREE.SRGBColorSpace;
  cloudsTexture.colorSpace = THREE.SRGBColorSpace;

  return (
    <group>
      {/* 地球主体 */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.8}
          metalness={0.1}
          emissive="#224466"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* 云层（半透明球体） */}
      <mesh>
        <sphereGeometry args={[1.01, 64, 64]} />
        <meshPhongMaterial
          map={cloudsTexture}
          transparent={true}
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// 备用方案：程序化地球
function EarthFallback() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    
    // 使用更真实的海洋颜色
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGradient.addColorStop(0, "#1a4d6b");
    oceanGradient.addColorStop(0.5, "#0d3a52");
    oceanGradient.addColorStop(1, "#1a4d6b");
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const w = canvas.width;
    const h = canvas.height;
    
    const lonLatToXY = (lon, lat) => {
      const x = ((lon + 180) / 360) * w;
      const y = ((90 - lat) / 180) * h;
      return [x, y];
    };
    
    const drawLand = (coords, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      coords.forEach((coord, i) => {
        const [x, y] = lonLatToXY(coord[0], coord[1]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
    };
    
    // 主要大陆
    drawLand([
      [10, 37], [35, 30], [51, 12], [40, -10], [32, -28], [18, -35],
      [10, -15], [0, 5], [-17, 30]
    ], '#2d5a1f');
    
    drawLand([
      [-10, 35], [10, 40], [30, 50], [60, 70], [100, 75], [140, 60],
      [145, 40], [135, 25], [100, 10], [70, 8], [60, 20], [40, 40],
      [20, 42], [0, 38]
    ], '#2d5a1f');
    
    drawLand([
      [-170, 70], [-100, 70], [-75, 55], [-80, 45], [-100, 30],
      [-110, 15], [-90, 20], [-75, 45], [-55, 50], [-80, 70],
      [-140, 75]
    ], '#3a6a2a');
    
    drawLand([
      [-80, 12], [-70, 0], [-60, -15], [-55, -35], [-70, -55],
      [-75, -30], [-78, -5]
    ], '#2d5a1f');
    
    drawLand([
      [115, -10], [140, -12], [153, -28], [145, -40], [125, -35],
      [113, -20]
    ], '#4a7a3a');
    
    // 极地冰盖
    ctx.fillStyle = '#e8f0f8';
    ctx.fillRect(0, 0, w, h * 0.08);
    ctx.fillRect(0, h * 0.87, w, h * 0.13);
    
    const greenland = [[-45, 80], [-40, 83], [-25, 80], [-20, 70], [-40, 65], [-50, 70]];
    ctx.beginPath();
    greenland.forEach((coord, i) => {
      const [x, y] = lonLatToXY(coord[0], coord[1]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    
    // 地形细节
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#1a3a15' : '#0a2a10';
      ctx.beginPath();
      ctx.arc(
        Math.random() * w,
        Math.random() * h * 0.8 + h * 0.1,
        Math.random() * 2 + 0.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    
    // 云层
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.ellipse(
        Math.random() * w,
        Math.random() * h,
        Math.random() * 60 + 30,
        Math.random() * 30 + 15,
        Math.random() * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

export function Earth() {
  const USE_REAL_TEXTURES = true;
  
  if (USE_REAL_TEXTURES) {
    return <EarthWithTextures />;
  } else {
    return <EarthFallback />;
  }
}