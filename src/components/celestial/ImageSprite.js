import React, { useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function ImageSprite({ imageUrl, size = 0.3, onClick, onPointerEnter, onPointerLeave }) {
  const [texture, setTexture] = useState(null);
  const [error, setError] = useState(false);
  const glowRef = useRef();

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (loadedTexture) => {
        // ⭐ 创建带光晕的圆形纹理
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const imgSize = 512;
        canvas.width = imgSize;
        canvas.height = imgSize;

        // 外层光晕
        const gradient = ctx.createRadialGradient(
          imgSize / 2, imgSize / 2, imgSize * 0.3,
          imgSize / 2, imgSize / 2, imgSize / 2
        );
        gradient.addColorStop(0, 'rgba(100, 150, 255, 0.6)');
        gradient.addColorStop(0.7, 'rgba(100, 150, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, imgSize, imgSize);

        // 圆形图片
        ctx.save();
        ctx.beginPath();
        ctx.arc(imgSize / 2, imgSize / 2, imgSize * 0.35, 0, Math.PI * 2);
        ctx.clip();

        const img = loadedTexture.image;
        const scale = 0.7;
        const offset = imgSize * (1 - scale) / 2;
        ctx.drawImage(img, offset, offset, imgSize * scale, imgSize * scale);
        ctx.restore();

        // 边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(imgSize / 2, imgSize / 2, imgSize * 0.35, 0, Math.PI * 2);
        ctx.stroke();

        setTexture(new THREE.CanvasTexture(canvas));
      },
      undefined,
      (err) => {
        console.error('Error loading texture:', err);
        setError(true);
      }
    );
  }, [imageUrl]);

  // 脉冲动画
  useFrame((state) => {
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      glowRef.current.scale.set(size * scale, size * scale, 1);
    }
  });

  if (error || !texture) {
    return (
      <mesh onClick={onClick} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#ff6600" />
      </mesh>
    );
  }
  
  return (
    <sprite 
      ref={glowRef}
      scale={[size, size, 1]}
      onClick={onClick}
      onPointerOver={onPointerEnter}
      onPointerOut={onPointerLeave}
    >
      <spriteMaterial map={texture} transparent={true} />
    </sprite>
  );
}