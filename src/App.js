// 文件：App.jsx
import React, { Suspense, useMemo, useState, useEffect, useRef } from "react";
import Papa from "papaparse"
import { Canvas,useLoader,useFrame,useThree} from "@react-three/fiber";
import { OrbitControls, Stars, Text, Html } from "@react-three/drei";
import * as THREE from "three";

// === 梅西耶星体数据（包含Wikipedia页面名称） ===
// const messierData = [
//   { name: "M1", wikiName: "Crab_Nebula", ra: 83.63, dec: 22.01, dist: 2 },
//   { name: "M13", wikiName: "Messier_13", ra: 250.42, dec: 36.46, dist: 2.5 },
//   { name: "M31", wikiName: "Andromeda_Galaxy", ra: 10.68, dec: 41.27, dist: 3 },
//   { name: "M42", wikiName: "Orion_Nebula", ra: 83.82, dec: -5.39, dist: 2 },
//   { name: "M45", wikiName: "Pleiades", ra: 56.75, dec: 24.12, dist: 2.2 },
//   { name: "M51", wikiName: "Whirlpool_Galaxy", ra: 202.47, dec: 47.19, dist: 3 },
//   { name: "M57", wikiName: "Ring_Nebula", ra: 283.39, dec: 33.03, dist: 2.8 },
//   { name: "M81", wikiName: "Messier_81", ra: 148.89, dec: 69.07, dist: 3 },
//   { name: "M82", wikiName: "Messier_82", ra: 148.97, dec: 69.68, dist: 3.1 },
//   { name: "M87", wikiName: "Messier_87", ra: 187.71, dec: 12.39, dist: 3.5 },
//   { name: "M8", wikiName: "Lagoon_Nebula", ra: 270.92, dec: -24.38, dist: 2.3 },
//   { name: "M20", wikiName: "Trifid_Nebula", ra: 270.68, dec: -22.97, dist: 2.4 },
//   { name: "M27", wikiName: "Dumbbell_Nebula", ra: 299.90, dec: 22.72, dist: 2.5 },
//   { name: "M33", wikiName: "Triangulum_Galaxy", ra: 23.46, dec: 30.66, dist: 2.8 },
//   { name: "M63", wikiName: "Sunflower_Galaxy", ra: 198.96, dec: 42.03, dist: 3.1 },
//   { name: "M64", wikiName: "Black_Eye_Galaxy", ra: 194.19, dec: 21.68, dist: 2.7 },
//   { name: "M101", wikiName: "Pinwheel_Galaxy", ra: 210.80, dec: 54.35, dist: 3 },
//   { name: "M104", wikiName: "Sombrero_Galaxy", ra: 190.00, dec: -11.62, dist: 2.9 },
//   { name: "M83", wikiName: "Southern_Pinwheel_Galaxy", ra: 204.25, dec: -29.87, dist: 2.6 },
//   { name: "M5", wikiName: "Messier_5", ra: 229.64, dec: 2.08, dist: 2.4 },
// ];
const messierData = [];

const astronomicalScore = (lightYears) => {
  if (lightYears < 5000) {
    return Math.round((2.0 + (lightYears / 5000) * 3.0) * 10) / 10;
  } else if (lightYears < 200000) {
    return Math.round((5.0 + ((lightYears - 5000) / 195000) * 2.0) * 10) / 10;
  } else {
    const score = 7.0 + Math.min((lightYears - 200000) / 28800000, 1) * 3.0;
    return Math.round(score * 10) / 10;
  }
};

const convertRA = (raString) => {
  // 处理格式: "05h 23m 34s"
  const match = raString.match(/(\d+)h\s*(\d+)m\s*(\d+)s/);
  if (!match) return 0;
  
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const seconds = parseInt(match[3]);
  
  // 转换为度数 (小时 * 15 + 分钟 * 0.25 + 秒 * 0.00416667)
  return hours * 15 + minutes * 0.25 + seconds * 0.004166667;
};

const convertDEC = (decString) => {
  // 处理格式: "-69° 45' 22"" 或 "+41° 16' 09""
  const match = decString.match(/([+-]?\d+)°\s*(\d+)'\s*(\d+)/);
  if (!match) return 0;
  
  const degrees = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const seconds = parseInt(match[3]);
  
  const isNegative = degrees < 0;
  const decimal = Math.abs(degrees) + minutes / 60 + seconds / 3600;
  
  return (isNegative ? -decimal : decimal);
};

const extractWikiTitle = (url) => {
  const parts = url.split('/wiki/');
  return parts.length > 1 ? decodeURIComponent(parts[1]) : url;
  //return url.split('/wiki/')[1] || url;
};

// === Wikipedia API 图片获取 Hook ===
function useWikipediaImage(wikiPageName) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImage() {
      try {
        console.log(`Fetching image for Wikipedia page: ${wikiPageName}`);
        
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
          console.log(`✗ No thumbnail for ${wikiPageName}`);
        }
      } catch (error) {
        console.error(`Error fetching image for ${wikiPageName}:`, error);
      } finally {
        setLoading(false);
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
  const cloudsTexture = useLoader(THREE.TextureLoader, '/textures/earth_clouds.jpg');
  
  // 设置纹理的颜色空间
  earthTexture.colorSpace = THREE.SRGBColorSpace;
  cloudsTexture.colorSpace = THREE.SRGBColorSpace;

  //TODO useFrame(({ clock }) => { cloudRef.current.rotation.y = clock.getElapsedTime() * 0.01; });
  
  return (
    <group>
      {/* 地球主体 */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.8}
          metalness={0.1}
          emissive="#224466"        // 稍微自发光一点，让暗处不太黑
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

// === 银河系渲染（使用真实纹理）===
function MilkyWayWithTexture() {
  const milkyWayRadius = 9.8;
  const milkyWayTexture = useLoader(
    THREE.TextureLoader, 
    '/textures/milky_way_panorama.jpg'
  );
  
  milkyWayTexture.colorSpace = THREE.SRGBColorSpace;
  
  // 🔧 关键修复：调整纹理映射以对齐 RA/DEC 坐标系
  // ESO 全景图通常以银河系中心为中心点
  // 银河系中心在 RA ≈ 266.4° (17h 45m), DEC ≈ -29°
  // 我们需要旋转纹理使 RA=0（春分点）对齐到正确位置
  milkyWayTexture.wrapS = THREE.RepeatWrapping;
  milkyWayTexture.wrapT = THREE.ClampToEdgeWrapping;
  milkyWayTexture.repeat.x = -1; // 水平翻转（因为从内部看球体）
  milkyWayTexture.offset.x = 0.26; // 调整偏移使银河系中心对齐（266.4°/360° ≈ 0.74, 需要偏移 1-0.74 = 0.26）
  
  return (
    <mesh rotation={[0, Math.PI, 0]}> {/* Y轴旋转180度进一步对齐 */}
      <sphereGeometry args={[milkyWayRadius, 64, 64]} />
      <meshBasicMaterial 
        map={milkyWayTexture} 
        transparent={true}
        opacity={0.85}
        side={THREE.BackSide}  // 从内部看
        depthWrite={false}
        toneMapped={false}     // 保持原始亮度
      />
    </mesh>
  );
}

// 主银河系组件（带错误处理）
function MilkyWay() {
  return (
    <Suspense fallback={null}>
      <MilkyWayWithTexture />
    </Suspense>
  );
}


// === 天球网格 ===
function CelestialGrid({ radius = 3 }) {
  const lines = [];

  for (let dec = -60; dec <= 60; dec += 30) {
    const circle = new THREE.EllipseCurve(
      0, 0,
      radius * Math.cos(THREE.MathUtils.degToRad(dec)),
      radius * Math.cos(THREE.MathUtils.degToRad(dec))
    );
    const points = circle.getPoints(64).map((p) => 
      new THREE.Vector3(p.x, radius * Math.sin(THREE.MathUtils.degToRad(dec)), p.y)
    );
    lines.push(points);
  }

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
function Axes({ length = 3.1 }) {
  const makeLine = (start, end, color, label, labelPos) => {
    const points = [start, end];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return (
      <group key={color}>
        <line geometry={geometry}>
          <lineBasicMaterial color={color} />
        </line>
        <Text
          position={labelPos}
          fontSize={0.2}
          color={color}
          anchorX={color === 'red' ? 'left' : 'center'}
          anchorY={color === 'red' ? 'middle' : 'bottom'}
        >
          {label}
        </Text>
      </group>
    );
  };

  return (
    <group>
      {makeLine(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(length, 0, 0),
        'red',
        'RA 0h',
        [length + 0.2, 0, 0]
      )}
      {makeLine(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, length, 0),
        'blue',
        'DEC +90°',
        [0, length + 0.2, 0]
      )}
    </group>
  );
}

function useFontScale() {
  const { camera } = useThree();
  const [fontScale, setFontScale] = useState(1);
  
  useFrame(() => {
    const distance = camera.position.length();
    const scale = Math.min(1.5, Math.max(1, distance / 8));
    setFontScale(scale);
  });
  
  return fontScale;
}

// === 单个天体 ===
function CelestialObject({ obj, index, overridePosition }) {
  console.log(`......................: ${obj.wikiUrl}`);
  const { imageUrl, loading } = useWikipediaImage(extractWikiTitle(obj.wikiUrl));
  const fontScale = useFontScale(); 

  // 🔧 如果传入了overridePosition就用它，否则正常计算
  let x, y, z;
  if (overridePosition) {
    [x, y, z] = overridePosition;
  } else {
    const isExtragalactic = obj.dist > 100000;
    const radius = isExtragalactic ? 10.2 : astronomicalScore(obj.dist);
    [x, y, z] = raDecToXYZ(convertRA(obj.ra), convertDEC(obj.dec), radius);
  }

  const color = new THREE.Color(`hsl(${(index * 25) % 360}, 80%, 60%)`);
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    const wikiUrl = `${obj.wikiUrl}`;
    window.open(wikiUrl, '_blank');
  };

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  const InfoPanel = () => (
    <Html position={[0, imageUrl ? 0.25 : 0.15, 0]} center distanceFactor={10}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '8px',
        fontSize: `${10 * fontScale}px`,
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        pointerEvents: 'none',
        userSelect: 'none'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: `${10 * fontScale}px`, marginBottom: '5px', color: '#4a9eff' }}>
          {obj.name}
        </div>
        <div>RA: {obj.ra}</div>
        <div>DEC: {obj.dec}</div>
        <div>Distance: {parseFloat(obj.dist).toLocaleString()} light years</div>
        <div style={{ marginTop: '5px', fontSize: `${10 * fontScale}px`, color: '#aaa' }}>
          {loading ? 'Loading...' : 'Click to view on Wikipedia →'}
        </div>
      </div>
    </Html>
  );

  if (imageUrl && !loading) {
    return (
      <group position={[x, y, z]}>
        <ImageSprite 
          imageUrl={imageUrl} 
          size={0.3}
         // onClick={handleClick}
         // onPointerEnter={() => setHovered(true)}
         // onPointerLeave={() => setHovered(false)}
        />
        <Text
          position={[0, -0.2, 0]}
          fontSize={0.1 * fontScale}
          color="#ffffff"
          anchorX="center"
          anchorY="top"
          outlineWidth={0.01}
          outlineColor="black"
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onClick={handleClick}
        >
          {obj.name}
        </Text>
        {hovered && <InfoPanel />}
      </group>
    );
  }

  return (
    <group position={[x, y, z]}>
      <mesh
        //onClick={handleClick}
        //onPointerEnter={() => setHovered(true)}
        //onPointerLeave={() => setHovered(false)}
      >
        <sphereGeometry args={[0.05, 16, 16]} />
        {/* <meshBasicMaterial 
          color={loading ? "#666" : color}
          emissive={hovered ? color : "#000000"}
          emissiveIntensity={hovered ? 0.5 : 0}
        />  */}
      </mesh>
      <Text
        position={[0.1, 0.1, 0]}
        fontSize={0.12 * fontScale}
        color="#ffffff"
        anchorX="left"
        anchorY="bottom"
        outlineWidth={0.01}
        outlineColor="black"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={handleClick}
      >
        {obj.name}
      </Text>
      {hovered && <InfoPanel />}
      {loading && (
        <Html position={[0, -0.15, 0]} center>
          <div style={{ 
            color: 'yellow', 
            fontSize: '10px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}>
            loading...
          </div>
        </Html>
      )}
    </group>
  );
}

// === 图片精灵组件 ===
function ImageSprite({ imageUrl, size = 0.3, onClick, onPointerEnter, onPointerLeave }) {
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
      <mesh
        onClick={onClick}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#ff6600" />
      </mesh>
    );
  }
  
  return (
    <sprite 
      scale={[size, size, 1]}
      onClick={onClick}
      onPointerOver={onPointerEnter}
      onPointerOut={onPointerLeave}
    >
      <spriteMaterial map={texture} transparent={true} />
    </sprite>
  );
}

// === 星体组 ===
// function CelestialObjects({data}) {
//   if (!data?.length) return null;
  
//   return (
//     <group>
//       {data.map((obj, i) => (
//         <CelestialObject key={i} obj={obj} index={i} />
//       ))}
//     </group>
//   );
// }
// === 天体组 ===
function CelestialObjects({data}) {
  
  
  
  // 🔧 自动检测并调整重叠天体位置
  const adjustedData = useMemo(() => {
    if (!data?.length) {
      console.log('No data to display');
      return null;
    }
    console.log(`Rendering ${data.length} celestial objects`);

    const minDistance = 0.5; // 最小允许距离（可调整）
    
    // 计算所有天体的初始位置
    const objects = data.map((obj, i) => {
      const isExtragalactic = obj.dist > 100000;
      const radius = isExtragalactic ? 10.2 : astronomicalScore(obj.dist);
      const raDeg = convertRA(obj.ra);
      const decDeg = convertDEC(obj.dec);
      const [x, y, z] = raDecToXYZ(raDeg, decDeg, radius);
      
      return {
        ...obj,
        position: [x, y, z],
        index: i
      };
    });
    
    // 碰撞检测和调整（多次迭代以处理连锁碰撞）
    for (let iteration = 0; iteration < 3; iteration++) {
      for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
          const [x1, y1, z1] = objects[i].position;
          const [x2, y2, z2] = objects[j].position;
          
          const dist = Math.sqrt(
            Math.pow(x2 - x1, 2) + 
            Math.pow(y2 - y1, 2) + 
            Math.pow(z2 - z1, 2)
          );
          
          if (dist < minDistance && dist > 0.001) {
            // 沿着两点连线方向推开
            const pushFactor = (minDistance - dist) / 2;
            const dirX = (x2 - x1) / dist;
            const dirY = (y2 - y1) / dist;
            const dirZ = (z2 - z1) / dist;
            
            // 两个天体各向相反方向移动一半距离
            objects[i].position = [
              x1 - dirX * pushFactor,
              y1 - dirY * pushFactor,
              z1 - dirZ * pushFactor
            ];
            
            objects[j].position = [
              x2 + dirX * pushFactor,
              y2 + dirY * pushFactor,
              z2 + dirZ * pushFactor
            ];
            
            console.log(`Adjusted collision between ${objects[i].name} and ${objects[j].name}, distance was ${dist.toFixed(3)}`);
          }
        }
      }
    }
    
    return objects;
  }, [data]);
  
  return (
    <group>
      {adjustedData.map((obj) => (
        <CelestialObject 
          key={obj.index} 
          obj={obj} 
          index={obj.index}
          overridePosition={obj.position}
        />
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
  const [messierData, setMessierData] = useState([]);
  useEffect(() => {
    fetch("/data/celestial_objects_database_southern_all.csv")      
      .then((res) => res.text())
      .then((text) => {
        const parsed = Papa.parse(text, { header: true }).data;
        // 清理数据，转为数值
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
          • 鼠标左键拖动旋转 /右键平移/ 滚轮缩放<br/>
          • <strong>悬停星体</strong>查看详细信息<br/>
          • <strong>点击星体</strong>打开Wikipedia页面<br/>
        </p>
      </div>
    </div>
  );
}