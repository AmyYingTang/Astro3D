import React, { useRef, useState, useEffect } from "react";
import { useLoader, useThree, useFrame } from "@react-three/fiber";
import { Html, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { useTranslation } from 'react-i18next';
import { convertRA, convertDEC, raDecToXYZ } from "../../utils/coordinates";

/**
 * DeepSkyPhoto - 在天球上展示深空摄影作品
 * 
 * @param {string} imageUrl - 图片URL
 * @param {string} ra - 赤经 (如 "9h 0m 17s")
 * @param {string} dec - 赤纬 (如 "-45° 54′ 57″")
 * @param {number} fovDeg - 视场角（度），决定照片在天球上的大小
 * @param {string} name - 天体名称
 * @param {object} metadata - 额外信息 (距离、拍摄参数等)
 */
export function DeepSkyPhoto({ 
  imageUrl, 
  ra, 
  dec, 
  fovDeg = 0.5, 
  name = "Deep Sky Object",
  metadata = {}
}) {
  const { t } = useTranslation();
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  const meshRef = useRef();
  const { camera, controls } = useThree();
  
  const [hovered, setHovered] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  
  // 动画状态
  const animationRef = useRef({
    active: false,
    startPos: null,
    endPos: null,
    startTarget: null,
    endTarget: null,
    progress: 0
  });

  // 计算位置
  const raDeg = convertRA(ra);
  const decDeg = convertDEC(dec);
  const sphereRadius = 9.5; // 略小于银河底图半径(9.8)，这样照片在银河前面
  const [x, y, z] = raDecToXYZ(raDeg, decDeg, sphereRadius);
  const position = new THREE.Vector3(x, y, z);

  // 根据视场角计算照片在天球上的大小
  // fovDeg度对应的弧长 = 2 * π * radius * (fovDeg / 360)
  const photoSize = 2 * Math.PI * sphereRadius * (fovDeg / 360);
  
  // 计算图片宽高比
  const aspectRatio = texture.image ? texture.image.width / texture.image.height : 1;
  const width = photoSize * Math.max(1, aspectRatio);
  const height = photoSize * Math.max(1, 1/aspectRatio);

  // 点击放大
  const handleClick = () => {
    if (isZooming) return;
    
    if (!isZoomedIn) {
      // 放大：飞向照片
      setIsZooming(true);
      
      // 计算目标相机位置（照片前方一定距离）
      const direction = position.clone().normalize();
      const targetDistance = sphereRadius - 2; // 离照片2个单位
      const targetPos = direction.multiplyScalar(targetDistance);
      
      animationRef.current = {
        active: true,
        startPos: camera.position.clone(),
        endPos: targetPos,
        startTarget: controls?.target?.clone() || new THREE.Vector3(0, 0, 0),
        endTarget: position.clone(),
        progress: 0,
        zoomingIn: true
      };
    } else {
      // 缩小：返回原位
      setIsZooming(true);
      
      animationRef.current = {
        active: true,
        startPos: camera.position.clone(),
        endPos: new THREE.Vector3(0, 0, 7), // 回到初始位置
        startTarget: controls?.target?.clone() || position.clone(),
        endTarget: new THREE.Vector3(0, 0, 0),
        progress: 0,
        zoomingIn: false
      };
    }
  };

  // 动画帧
  useFrame((state, delta) => {
    const anim = animationRef.current;
    if (!anim.active) return;
    
    // 缓动进度
    anim.progress += delta * 0.8; // 调整速度
    const t = Math.min(anim.progress, 1);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    
    // 插值相机位置
    camera.position.lerpVectors(anim.startPos, anim.endPos, eased);
    
    // 插值目标点
    if (controls) {
      const newTarget = new THREE.Vector3().lerpVectors(anim.startTarget, anim.endTarget, eased);
      controls.target.copy(newTarget);
      controls.update();
    }
    
    // 动画完成
    if (t >= 1) {
      anim.active = false;
      setIsZooming(false);
      setIsZoomedIn(anim.zoomingIn);
    }
  });

  // 设置纹理
  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
  }, [texture]);

  return (
    <group position={[x, y, z]}>
      {/* 照片平面 */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        // 让平面朝向球心
        onUpdate={(self) => {
          self.lookAt(0, 0, 0);
        }}
      >
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial 
          map={texture} 
          transparent={true}
          opacity={hovered ? 1 : 0.9}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 发光边框（hover时显示） */}
      {hovered && (
        <mesh
          onUpdate={(self) => self.lookAt(0, 0, 0)}
        >
          <planeGeometry args={[width * 1.05, height * 1.05]} />
          <meshBasicMaterial 
            color="#4a9eff"
            transparent={true}
            opacity={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 标签 */}
      <Billboard follow={true}>
        <Html
          position={[0, -height/2 - 0.1, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            color: 'white',
            fontSize: '12px',
            fontFamily: 'monospace',
            textShadow: '0 0 10px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
            background: hovered ? 'rgba(0,0,0,0.7)' : 'transparent',
            padding: hovered ? '4px 8px' : '0',
            borderRadius: '4px',
            transition: 'all 0.3s'
          }}>
            {name}
            {hovered && (
              <span style={{ color: '#4a9eff', marginLeft: '8px' }}>
                {isZoomedIn ? t('deepsky.clickReturn') : t('deepsky.clickZoom')}
              </span>
            )}
          </div>
        </Html>
      </Billboard>

      {/* 详细信息面板（放大后显示） */}
      {isZoomedIn && (
        <Html
          position={[width/2 + 0.3, 0, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '11px',
            fontFamily: 'monospace',
            border: '1px solid rgba(74, 158, 255, 0.5)',
            minWidth: '200px'
          }}>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '14px', 
              marginBottom: '12px',
              color: '#4a9eff'
            }}>
              {name}
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: '#888' }}>RA:</span> {ra}
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: '#888' }}>DEC:</span> {dec}
            </div>
            {metadata.distance && (
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#888' }}>{t('deepsky.distance')}:</span> {metadata.distance}
              </div>
            )}
            {metadata.exposure && (
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#888' }}>{t('deepsky.exposure')}:</span> {metadata.exposure}
              </div>
            )}
            {metadata.photographer && (
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#888' }}>{t('deepsky.photographer')}:</span> {metadata.photographer}
              </div>
            )}
            <div style={{ 
              marginTop: '12px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              color: '#666',
              fontSize: '10px'
            }}>
              {t('deepsky.fov')}: {fovDeg.toFixed(2)}°
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * DeepSkyPhotos - 批量渲染多张深空照片
 */
export function DeepSkyPhotos({ photos = [] }) {
  return (
    <group>
      {photos.map((photo, index) => (
        <DeepSkyPhoto
          key={photo.id || index}
          imageUrl={photo.imageUrl}
          ra={photo.ra}
          dec={photo.dec}
          fovDeg={photo.fovDeg || 0.5}
          name={photo.name}
          metadata={photo.metadata}
        />
      ))}
    </group>
  );
}
