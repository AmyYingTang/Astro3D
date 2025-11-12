// 文件：App.jsx
import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Text } from "@react-three/drei";
import * as THREE from "three";

// === 梅西耶星体数据（示例） ===
const messierData = [
  { name: "M1", ra: 83.63, dec: 22.01, dist: 2 },
  { name: "M13", ra: 250.42, dec: 36.46, dist: 2.5 },
  { name: "M31", ra: 10.68, dec: 41.27, dist: 3 },
  { name: "M42", ra: 83.82, dec: -5.39, dist: 2 },
  { name: "M45", ra: 56.75, dec: 24.12, dist: 2.2 },
  { name: "M51", ra: 202.47, dec: 47.19, dist: 3 },
  { name: "M57", ra: 283.39, dec: 33.03, dist: 2.8 },
  { name: "M81", ra: 148.89, dec: 69.07, dist: 3 },
  { name: "M82", ra: 148.97, dec: 69.68, dist: 3.1 },
  { name: "M87", ra: 187.71, dec: 12.39, dist: 3.5 },
  { name: "M8", ra: 270.92, dec: -24.38, dist: 2.3 },
  { name: "M20", ra: 270.68, dec: -22.97, dist: 2.4 },
  { name: "M27", ra: 299.90, dec: 22.72, dist: 2.5 },
  { name: "M33", ra: 23.46, dec: 30.66, dist: 2.8 },
  { name: "M63", ra: 198.96, dec: 42.03, dist: 3.1 },
  { name: "M64", ra: 194.19, dec: 21.68, dist: 2.7 },
  { name: "M101", ra: 210.80, dec: 54.35, dist: 3 },
  { name: "M104", ra: 190.00, dec: -11.62, dist: 2.9 },
  { name: "M83", ra: 204.25, dec: -29.87, dist: 2.6 },
  { name: "M5", ra: 229.64, dec: 2.08, dist: 2.4 },
];

// === RA/DEC → 三维坐标转换 ===
function raDecToXYZ(raDeg, decDeg, radius) {
  const ra = THREE.MathUtils.degToRad(raDeg);
  const dec = THREE.MathUtils.degToRad(decDeg);
  const x = radius * Math.cos(dec) * Math.cos(ra);
  const y = radius * Math.sin(dec);
  const z = -radius * Math.cos(dec) * Math.sin(ra);
  return [x, y, z];
}

// === 地球模型 ===
function Earth() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1e90ff"; // 浅蓝色海洋
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#2e8b57"; // 绿色大陆    
    for (let i = 0; i < 300; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 256, Math.random() * 2 + 1, 0, 2 * Math.PI);
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
      {/* {lines.map((line, i) => (
        <line key={i}>
          <bufferGeometry setFromPoints={line} />
          <lineBasicMaterial color="#444" linewidth={0.5} />
        </line>
      ))} */}
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
  // const axisMaterial = new THREE.LineBasicMaterial({ linewidth: 2 });
  const makeLine = (start, end, color) => {
  const points = [start, end];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} linewidth={8} />
      {/* <mesh position={[length, 0, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="red" />
    </mesh> */}
    {/* 赤经标签 */}
      <Text
        position={[length + 0.2, 0, 0]}
        fontSize={0.2}
        color="red"
        anchorX="left"
        anchorY="middle"
      >
        RA 0h
      </Text>

      {/* 赤纬标签 */}
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
      {makeLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0), "red")} {/* 赤经轴 */}
      {makeLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0), "blue")} {/* 赤纬轴 */}
    </group>
  );
}

// === 梅西耶星体 + 标签 ===
function MessierObjects() {
  return (
    <group>
      {messierData.map((obj, i) => {
        const [x, y, z] = raDecToXYZ(obj.ra, obj.dec, obj.dist);
        const color = new THREE.Color(`hsl(${(i * 25) % 360}, 80%, 60%)`);
        return (
          <group key={i} position={[x, y, z]}>
            <mesh>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshBasicMaterial color={color} />
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
          </group>
        );
      })}
    </group>
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
        <Suspense fallback={null}>
          <Earth />
          <CelestialGrid />
          <Axes />
          <MessierObjects />
        </Suspense>
        <Stars radius={100} depth={50} count={5000} factor={2} fade />
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}

