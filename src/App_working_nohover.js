// 文件：App.jsx
import React, { Suspense, useMemo, useState, useEffect } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars, Text, Html } from "@react-three/drei";
import * as THREE from "three";

// === 梅西耶星体数据（包含Wikipedia页面名称） ===
const messierData = [
  { name: "M1", wikiName: "Crab_Nebula", ra: 83.63, dec: 22.01, dist: 2 },
  { name: "M13", wikiName: "Messier_13", ra: 250.42, dec: 36.46, dist: 2.5 },
  { name: "M31", wikiName: "Andromeda_Galaxy", ra: 10.68, dec: 41.27, dist: 3 },
  { name: "M42", wikiName: "Orion_Nebula", ra: 83.82, dec: -5.39, dist: 2 },
  { name: "M45", wikiName: "Pleiades", ra: 56.75, dec: 24.12, dist: 2.2 },
  { name: "M51", wikiName: "Whirlpool_Galaxy", ra: 202.47, dec: 47.19, dist: 3 },
  { name: "M57", wikiName: "Ring_Nebula", ra: 283.39, dec: 33.03, dist: 2.8 },
  { name: "M81", wikiName: "Messier_81", ra: 148.89, dec: 69.07, dist: 3 },
  { name: "M82", wikiName: "Messier_82", ra: 148.97, dec: 69.68, dist: 3.1 },
  { name: "M87", wikiName: "Messier_87", ra: 187.71, dec: 12.39, dist: 3.5 },
  { name: "M8", wikiName: "Lagoon_Nebula", ra: 270.92, dec: -24.38, dist: 2.3 },
  { name: "M20", wikiName: "Trifid_Nebula", ra: 270.68, dec: -22.97, dist: 2.4 },
  { name: "M27", wikiName: "Dumbbell_Nebula", ra: 299.90, dec: 22.72, dist: 2.5 },
  { name: "M33", wikiName: "Triangulum_Galaxy", ra: 23.46, dec: 30.66, dist: 2.8 },
  { name: "M63", wikiName: "Sunflower_Galaxy", ra: 198.96, dec: 42.03, dist: 3.1 },
  { name: "M64", wikiName: "Black_Eye_Galaxy", ra: 194.19, dec: 21.68, dist: 2.7 },
  { name: "M101", wikiName: "Pinwheel_Galaxy", ra: 210.80, dec: 54.35, dist: 3 },
  { name: "M104", wikiName: "Sombrero_Galaxy", ra: 190.00, dec: -11.62, dist: 2.9 },
  { name: "M83", wikiName: "Southern_Pinwheel_Galaxy", ra: 204.25, dec: -29.87, dist: 2.6 },
  { name: "M5", wikiName: "Messier_5", ra: 229.64, dec: 2.08, dist: 2.4 },
];

// === Wikipedia API 图片获取 Hook ===
function useWikipediaImage(wikiPageName) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImage() {
      try {
        console.log(`Fetching image for Wikipedia page: ${wikiPageName}`);
        
        // 直接使用Wikipedia页面名称获取图片
        const imageApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(wikiPageName)}&prop=pageimages&pithumbsize=500`;
        
        const response = await fetch(imageApiUrl);
        const data = await response.json();
        
        const pages = data.query?.pages;
        if (!pages) {
          console.log(`No page found for: ${wikiPageName}`);
          setLoading(false);
          return;
        }

        const pageId = Object.keys(pages)[0];
        const thumbnail = pages[pageId]?.thumbnail?.source;

        if (thumbnail) {
          console.log(`✓ Image found for ${wikiPageName}: ${thumbnail}`);
          setImageUrl(thumbnail);
        } else {
          console.log(`✗ No thumbnail for ${wikiPageName}, trying alternative method...`);
          // 尝试获取页面的第一张图片
          await fetchFirstImage(wikiPageName);
        }
      } catch (error) {
        console.error(`Error fetching image for ${wikiPageName}:`, error);
      } finally {
        setLoading(false);
      }
    }

    // 获取页面中的第一张图片
    async function fetchFirstImage(pageTitle) {
      try {
        const imageListUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(pageTitle)}&prop=images&imlimit=10`;
        
        const response = await fetch(imageListUrl);
        const data = await response.json();
        
        const pages = data.query?.pages;
        if (!pages) return;
        
        const pageId = Object.keys(pages)[0];
        const images = pages[pageId]?.images;
        
        if (images && images.length > 0) {
          // 找到第一个看起来像主图的图片
          for (const img of images) {
            const filename = img.title;
            if (!filename.includes('Commons-logo') && 
                !filename.includes('Wiki') &&
                !filename.includes('Icon') &&
                (filename.includes('.jpg') || filename.includes('.png') || filename.includes('.jpeg'))) {
              
              // 获取图片URL
              const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&iiurlwidth=500`;
              const imgResponse = await fetch(imgUrl);
              const imgData = await imgResponse.json();
              
              const imgPages = imgData.query?.pages;
              if (imgPages) {
                const imgPageId = Object.keys(imgPages)[0];
                const imageUrl = imgPages[imgPageId]?.imageinfo?.[0]?.thumburl || imgPages[imgPageId]?.imageinfo?.[0]?.url;
                
                if (imageUrl) {
                  console.log(`✓ Alternative image found for ${pageTitle}: ${imageUrl}`);
                  setImageUrl(imageUrl);
                  break;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching alternative image:`, error);
      }
    }

    if (wikiPageName) {
      fetchImage();
    } else {
      setLoading(false);
    }
  }, [wikiPageName]);

  return { imageUrl, loading };
}

// === RA/DEC → 三维坐标转换 ===
function raDecToXYZ(raDeg, decDeg, radius) {
  const ra = THREE.MathUtils.degToRad(raDeg);
  const dec = THREE.MathUtils.degToRad(decDeg);
  const x = radius * Math.cos(dec) * Math.cos(ra);
  const y = radius * Math.sin(dec);
  const z = -radius * Math.cos(dec) * Math.sin(ra);
  return [x, y, z];
}

// === 地球模型（使用真实纹理） ===
function Earth() {
  // 使用高质量的地球纹理
  // 纹理来源说明：
  // 这些纹理应该从以下来源下载并放入 public 文件夹：
  // 1. Solar System Scope: https://www.solarsystemscope.com/textures/
  // 2. Planet Pixel Emporium: https://planetpixelemporium.com/earth8081.html
  // 3. NASA Visible Earth: https://visibleearth.nasa.gov/
  
  // 如果你还没有纹理文件，可以使用备用方案（程序化生成）
  const USE_REAL_TEXTURES = true; // 设置为 true 当你下载了纹理文件
  
  if (USE_REAL_TEXTURES) {
    // 真实纹理版本
    return <EarthWithTextures />;
  } else {
    // 备用方案：简化的程序化地球
    return <EarthFallback />;
  }
}

// 使用真实纹理的地球组件
function EarthWithTextures() {
  // 加载纹理
  // 请确保这些文件存在于 public 文件夹中
  const earthTexture = useLoader(THREE.TextureLoader, '/textures/earth_day.jpg');
  
  // 设置纹理的颜色空间
  earthTexture.colorSpace = THREE.SRGBColorSpace;
  
  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial map={earthTexture} />
    </mesh>
  );
}

// 备用方案：简化但更准确的程序化地球
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
    
    // 绘制简化但识别度高的大陆
    const w = canvas.width;
    const h = canvas.height;
    
    // 转换经纬度到像素
    const lonLatToXY = (lon, lat) => {
      const x = ((lon + 180) / 360) * w;
      const y = ((90 - lat) / 180) * h;
      return [x, y];
    };
    
    // 绘制大陆
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
    
    // 主要大陆（简化版）
    // 非洲
    drawLand([
      [10, 37], [35, 30], [51, 12], [40, -10], [32, -28], [18, -35],
      [10, -15], [0, 5], [-17, 30]
    ], '#2d5a1f');
    
    // 欧亚大陆
    drawLand([
      [-10, 35], [10, 40], [30, 50], [60, 70], [100, 75], [140, 60],
      [145, 40], [135, 25], [100, 10], [70, 8], [60, 20], [40, 40],
      [20, 42], [0, 38]
    ], '#2d5a1f');
    
    // 北美
    drawLand([
      [-170, 70], [-100, 70], [-75, 55], [-80, 45], [-100, 30],
      [-110, 15], [-90, 20], [-75, 45], [-55, 50], [-80, 70],
      [-140, 75]
    ], '#3a6a2a');
    
    // 南美
    drawLand([
      [-80, 12], [-70, 0], [-60, -15], [-55, -35], [-70, -55],
      [-75, -30], [-78, -5]
    ], '#2d5a1f');
    
    // 澳大利亚
    drawLand([
      [115, -10], [140, -12], [153, -28], [145, -40], [125, -35],
      [113, -20]
    ], '#4a7a3a');
    
    // 极地冰盖
    ctx.fillStyle = '#e8f0f8';
    // 北极
    ctx.fillRect(0, 0, w, h * 0.08);
    // 南极
    ctx.fillRect(0, h * 0.87, w, h * 0.13);
    // 格陵兰
    ctx.beginPath();
    const greenland = [[-45, 80], [-40, 83], [-25, 80], [-20, 70], [-40, 65], [-50, 70]];
    greenland.forEach((coord, i) => {
      const [x, y] = lonLatToXY(coord[0], coord[1]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    
    // 添加地形细节
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
    
    // 添加云层
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

// === 天球网格 ===
function CelestialGrid({ radius = 3, segments = 12 }) {
  const lines = [];

  // 赤纬圈
  for (let dec = -60; dec <= 60; dec += 30) {
    const circle = new THREE.EllipseCurve(
      0,
      0,
      radius * Math.cos(THREE.MathUtils.degToRad(dec)),
      radius * Math.cos(THREE.MathUtils.degToRad(dec))
    );
    const points = circle.getPoints(64).map((p) => new THREE.Vector3(p.x, radius * Math.sin(THREE.MathUtils.degToRad(dec)), p.y));
    lines.push(points);
  }

  // 赤经线
  for (let ra = 0; ra < 360; ra += 30) {
    const curve = [];
    for (let dec = -90; dec <= 90; dec += 5) {
      const [x, y, z] = raDecToXYZ(ra, dec, radius);
      curve.push(new THREE.Vector3(x, y, z));
    }
    lines.push(curve);
  }

  return (
    <group>
      {lines.map((line, i) => {
        const geometry = new THREE.BufferGeometry().setFromPoints(line);
        return (
          <line key={i} geometry={geometry}>
            <lineBasicMaterial color="#888" />
          </line>
        );
      })}
    </group>
  );
}

// === 赤经/赤纬主轴 ===
function Axes({ length = 3.5 }) {
  const makeLine = (start, end, color) => {
    const points = [start, end];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return (
      <line geometry={geometry}>
        <lineBasicMaterial color={color} linewidth={8} />
        <Text
          position={[length + 0.2, 0, 0]}
          fontSize={0.2}
          color="red"
          anchorX="left"
          anchorY="middle"
        >
          RA 0h
        </Text>
        <Text
          position={[0, length + 0.2, 0]}
          fontSize={0.2}
          color="blue"
          anchorX="center"
          anchorY="bottom"
        >
          DEC +90°
        </Text>
      </line>
    );
  };

  return (
    <group>
      {makeLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0), "red")}
      {makeLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0), "blue")}
    </group>
  );
}

// === 单个梅西耶天体（带Wikipedia图片） ===
function MessierObject({ obj, index }) {
  const { imageUrl, loading } = useWikipediaImage(obj.wikiName);
  const [x, y, z] = raDecToXYZ(obj.ra, obj.dec, obj.dist);
  const color = new THREE.Color(`hsl(${(index * 25) % 360}, 80%, 60%)`);

  // 如果有图片，使用Sprite显示
  if (imageUrl && !loading) {
    return (
      <group position={[x, y, z]}>
        <ImageSprite imageUrl={imageUrl} size={0.3} />
        <Text
          position={[0, -0.2, 0]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="top"
          outlineWidth={0.01}
          outlineColor="black"
        >
          {obj.name}
        </Text>
      </group>
    );
  }

  // 如果没有图片或正在加载，显示彩色球体
  return (
    <group position={[x, y, z]}>
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color={loading ? "#666" : color} />
      </mesh>
      <Text
        position={[0.1, 0.1, 0]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="left"
        anchorY="bottom"
        outlineWidth={0.01}
        outlineColor="black"
      >
        {obj.name}
      </Text>
      {loading && (
        <Html position={[0, -0.15, 0]} center>
          <div style={{ 
            color: 'yellow', 
            fontSize: '10px',
            whiteSpace: 'nowrap'
          }}>
            loading...
          </div>
        </Html>
      )}
    </group>
  );
}

// === 图片精灵组件 ===
function ImageSprite({ imageUrl, size = 0.3 }) {
  const [texture, setTexture] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (loadedTexture) => {
        setTexture(loadedTexture);
        console.log(`Texture loaded successfully: ${imageUrl}`);
      },
      undefined,
      (err) => {
        console.error('Error loading texture:', err);
        setError(true);
      }
    );
  }, [imageUrl]);

  if (error || !texture) {
    return (
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#ff6600" />
      </mesh>
    );
  }
  
  return (
    <sprite scale={[size, size, 1]}>
      <spriteMaterial map={texture} transparent={true} />
    </sprite>
  );
}

// === 梅西耶星体组 ===
function MessierObjects() {
  return (
    <group>
      {messierData.map((obj, i) => (
        <MessierObject key={i} obj={obj} index={i} />
      ))}
    </group>
  );
}

// === 加载提示 ===
function LoadingIndicator() {
  return (
    <Html center>
      <div style={{
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px 20px',
        borderRadius: '5px',
        fontFamily: 'Arial, sans-serif'
      }}>
        正在初始化场景...
      </div>
    </Html>
  );
}

// === 主组件 ===
export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <color attach="background" args={["#000"]} />
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} />
        <Suspense fallback={<LoadingIndicator />}>
          <Earth />
          <CelestialGrid />
          <Axes />
          <MessierObjects />
        </Suspense>
        <Stars radius={100} depth={50} count={5000} factor={2} fade />
        <OrbitControls enablePan={false} />
      </Canvas>
      
      {/* 信息面板 */}
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
        <h3 style={{ margin: '0 0 10px 0' }}>梅西耶天体可视化</h3>
        <p style={{ margin: '5px 0', fontSize: '12px' }}>
          • 图片来源：Wikipedia<br/>
          • Textures by Solar System Scope<br/>
          • 鼠标拖动旋转 / 滚轮缩放<br/>
          • 灰色 = 加载中<br/>
          • 橙色 = 无图片<br/>
          • 彩色 = 无数据<br/>
          • 打开控制台查看详细信息
        </p>
      </div>
    </div>
  );
}