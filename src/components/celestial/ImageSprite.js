import React, { useState, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export function ImageSprite({ imageUrl, size = 0.3, onClick, onPointerEnter, onPointerLeave, position }) {
  const [baseImage, setBaseImage] = useState(null);
  const [textureReady, setTextureReady] = useState(false);
  const [error, setError] = useState(false);
  const glowRef = useRef();
  const spriteRef = useRef(); 
  const canvasRef = useRef(null);
  const textureRef = useRef(null);
  const { camera } = useThree();

  // 加载原始图片
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (loadedTexture) => {
        setBaseImage(loadedTexture.image);
      },
      undefined,
      (err) => {
        console.error('Error loading texture:', err);
        setError(true);
      }
    );
  }, [imageUrl]);

  // 创建canvas和纹理，并绘制初始内容
  useEffect(() => {
    if (!baseImage) return;
    
    const canvas = document.createElement('canvas');
    const imgSize = 512;
    canvas.width = imgSize;
    canvas.height = imgSize;
    
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    
    // 清除画布
    ctx.clearRect(0, 0, imgSize, imgSize);

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

    const scale = 0.7;
    const offset = imgSize * (1 - scale) / 2;
    ctx.drawImage(baseImage, offset, offset, imgSize * scale, imgSize * scale);
    ctx.restore();

    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(imgSize / 2, imgSize / 2, imgSize * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    
    // 创建纹理
    textureRef.current = new THREE.CanvasTexture(canvas);
    textureRef.current.needsUpdate = true;
    
    // ⭐ 设置纹理准备完成
    setTextureReady(true);
  }, [baseImage]);

  // 根据距离重绘纹理
  const updateTexture = (glowOpacity) => {
    if (!canvasRef.current || !baseImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imgSize = 512;
    
    // 清除画布
    ctx.clearRect(0, 0, imgSize, imgSize);

    // 外层光晕 - 使用动态不透明度
    const gradient = ctx.createRadialGradient(
      imgSize / 2, imgSize / 2, imgSize * 0.3,
      imgSize / 2, imgSize / 2, imgSize / 2
    );
    gradient.addColorStop(0, `rgba(100, 150, 255, ${0.6 * glowOpacity})`);
    gradient.addColorStop(0.7, `rgba(100, 150, 255, ${0.3 * glowOpacity})`);
    gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, imgSize, imgSize);

    // 圆形图片
    ctx.save();
    ctx.beginPath();
    ctx.arc(imgSize / 2, imgSize / 2, imgSize * 0.35, 0, Math.PI * 2);
    ctx.clip();

    const scale = 0.7;
    const offset = imgSize * (1 - scale) / 2;
    ctx.drawImage(baseImage, offset, offset, imgSize * scale, imgSize * scale);
    ctx.restore();

    // 边框 - 也使用动态不透明度
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * glowOpacity})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(imgSize / 2, imgSize / 2, imgSize * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  };

  // // 脉冲动画
  // useFrame((state) => {
  //   if (glowRef.current) {
  //     const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
  //     glowRef.current.scale.set(size * scale, size * scale, 1);
  //   }
  // });

  
  // ⭐ 添加距离渐隐，同时更新光晕强度
  useFrame((state) => {
    if (spriteRef.current && position && textureRef.current) {
      const distance = camera.position.distanceTo(new THREE.Vector3(...position));
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      
      // 扩大渐隐范围，让过渡更长
      const minDist = 2;     // 开始渐隐的距离
      const maxDist = 35;    // 完全透明的距离
      
      let t = (distance - minDist) / (maxDist - minDist);
      t = THREE.MathUtils.clamp(t, 0, 1);
      
      // 使用三次方曲线，让远处渐隐更慢更平滑
      const smoothed = Math.pow(t, 2.5);
      
      // 计算整体不透明度和光晕不透明度
      const opacity = THREE.MathUtils.lerp(1.0, 0.08, smoothed);
      
      // 光晕随距离衰减得更快，这样远处就不会有突兀的光晕
      const glowOpacity = THREE.MathUtils.lerp(1.0, 0.0, smoothed);
      
      // 更新纹理（只在光晕不透明度变化明显时更新，避免每帧都重绘）
      const currentGlowOpacity = spriteRef.current.userData.lastGlowOpacity || 1.0;
      if (Math.abs(currentGlowOpacity - glowOpacity) > 0.02) {
        updateTexture(glowOpacity);
        spriteRef.current.userData.lastGlowOpacity = glowOpacity;
      }
      
      if (spriteRef.current.material) {
        spriteRef.current.material.opacity = opacity;
      }
      spriteRef.current.scale.set(size * scale, size * scale, 1);
    }
  });
  
  if (error || !textureReady) {
    return (
     <mesh onClick={onClick} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
       <sphereGeometry args={[0.05, 16, 16]} />
       <meshBasicMaterial color="#ff6600" />
     </mesh>
   );
  }
  
  return (
    <sprite 
      ref={spriteRef}
      scale={[size, size, 1]}
      onClick={onClick}
      onPointerOver={onPointerEnter}
      onPointerOut={onPointerLeave}
    >
      <spriteMaterial map={textureRef.current} transparent={true} alphaTest={0.01} depthWrite={false} opacity={1.0} />
    </sprite>
  );
}