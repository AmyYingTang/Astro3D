import React, { useState, useEffect, useRef } from "react";
import { Text, Html, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { useTranslation } from 'react-i18next';
import { useWikipediaImage } from "../../hooks/useWikipediaImage";
import { useFontScale } from "../../hooks/useFontScale";
import { extractWikiTitle, convertRA, convertDEC, raDecToXYZ } from "../../utils/coordinates";
import { astronomicalScore } from "../../utils/dataProcessing";
import { getDisplayName, getShortName, getConstellation, getType, getFilter, getSummary, getAngularDiameter } from "../../utils/nameUtils";
import { ImageSprite } from "./ImageSprite";

export function CelestialObject({ obj, index, overridePosition, showLabels, isActive, onActivate, onDeactivate}) {
  console.log(`......................: ${obj.wikiUrl}`);
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('zh') ? 'zh' : 'en';
  const { imageUrl, loading } = useWikipediaImage(extractWikiTitle(obj.wikiUrl));
  const fontScale = useFontScale(); 

  // 如果传入了overridePosition就用它，否则正常计算
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
  const [isPanelHovered, setIsPanelHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const leaveTimeoutRef = useRef(null);
  const dragTimeoutRef = useRef(null);

  const handleClick = () => {
    const wikiUrl = `${obj.wikiUrl}`;
    window.open(wikiUrl, '_blank');
  };

  // 处理3D对象的hover
  const handleObjectEnter = () => {
    // 如果正在拖动，不显示Panel
    if (isDragging) return;
    
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setHovered(true);
    onActivate?.();
  };

  const handleObjectLeave = () => {
    // 延迟150ms后检查，如果panel没有被hover则隐藏
    leaveTimeoutRef.current = setTimeout(() => {
      if (!isPanelHovered) {
        setHovered(false);
        onDeactivate?.(); 
      }
    }, 150);
  };

  // 处理InfoPanel的hover
  const handlePanelEnter = () => {
    setIsPanelHovered(true);
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setHovered(true);
  };

  const handlePanelLeave = () => {
    setIsPanelHovered(false);
    // 立即隐藏，因为鼠标已经离开整个hover区域
    leaveTimeoutRef.current = setTimeout(() => {
      setHovered(false);
      onDeactivate?.(); 
    }, 150);
  };

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    
    // 监听鼠标移动来检测是否真的在拖动
    let mouseDownTime = 0;
    let hasMoved = false;
    
    const handleMouseDown = (e) => {
      mouseDownTime = Date.now();
      hasMoved = false;
    };
    
    const handleMouseMove = (e) => {
      // 如果鼠标按下后移动了，说明是拖动
      if (mouseDownTime > 0) {
        hasMoved = true;
        setIsDragging(true);
        // 如果正在拖动，立即隐藏Panel
        setHovered(false);
        setIsPanelHovered(false);
        onDeactivate?.(); 
      }
    };
    
    const handleMouseUp = () => {
      mouseDownTime = 0;
      // 只有真的拖动过才需要延迟恢复
      if (hasMoved) {
        dragTimeoutRef.current = setTimeout(() => {
          setIsDragging(false);
        }, 100);
      } else {
        // 如果只是点击没有拖动，立即恢复
        setIsDragging(false);
      }
      hasMoved = false;
    };
    
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.body.style.cursor = 'auto';
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [hovered, onDeactivate]);

  const InfoPanel = () => (
    <Html 
      position={[0, imageUrl ? 0.35 : 0.25, 0]} 
      center 
      //distanceFactor={10}
      zIndexRange={[1000, 0]}
      occlude={false}
      portal={{ current: document.body }}
      style={{
        pointerEvents: 'none',  // ⭐ 外层容器不捕获事件
      }}
    >
      <div 
        style={{
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '10px',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          border: '2px solid rgba(74, 158, 255, 0.5)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
          userSelect: 'none',
          cursor: 'pointer',
          minWidth: imageUrl ? '190px' : 'auto',
          pointerEvents: 'auto',
        }}
          onClick={handleClick}
          onMouseEnter={handlePanelEnter}          
          onMouseLeave={handlePanelLeave}
          onPointerEnter={handlePanelEnter}
          onPointerLeave={handlePanelLeave}
        >
       
        {imageUrl && (
          <div style={{ 
            marginBottom: '10px', 
            position: 'relative',
            width: '170px',
            height: '170px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto'
          }}>
            {/* 光晕层 */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(100,150,255,0.2) 0%, transparent 70%)',
              animation: 'celestialPulse 3s ease-in-out infinite'
            }} />
            
            <div style={{
              position: 'absolute',
              width: '85%',
              height: '85%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(100,150,255,0.3) 0%, transparent 70%)',
              animation: 'celestialPulse 3s ease-in-out infinite 0.5s'
            }} />
            
            {/* 图片 */}
            <img 
              src={imageUrl} 
              width="130" 
              height="130" 
              style={{ 
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 0 20px rgba(100, 150, 255, 0.6)',
                position: 'relative',
                zIndex: 2
              }} 
              alt={obj.name}
            />
            
            <style>{`
              @keyframes celestialPulse {
                0%, 100% { opacity: 0.4; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.1); }
              }
            `}</style>
          </div>
        )}
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: '12px', 
          marginBottom: '6px', 
          color: '#4a9eff',
          textAlign: 'center'
        }}>
          {getDisplayName(obj.name, lang)}
        </div>
        <div style={{ fontSize: `${10 * fontScale}px`, marginBottom: '2px' }}>
          <span style={{ color: '#888' }}>RA:</span> {obj.ra}
        </div>
        <div style={{ fontSize: `${10 * fontScale}px`, marginBottom: '2px' }}>
          <span style={{ color: '#888' }}>DEC:</span> {obj.dec}
        </div>
        <div style={{ fontSize: `${10 * fontScale}px`, marginBottom: '2px' }}>
          <span style={{ color: '#888' }}>{t('info.distance')}:</span> {parseFloat(obj.dist).toLocaleString()} ly
        </div>
        <div style={{ fontSize: `${10 * fontScale}px`, marginBottom: '2px' }}>
          <span style={{ color: '#888' }}>{t('info.type')}:</span> {getType(obj.type, lang)}
        </div>
        <div style={{ fontSize: `${10 * fontScale}px`, marginBottom: '2px' }}>
          <span style={{ color: '#888' }}>{t('info.filter')}:</span> {getFilter(obj.filter, lang)}
        </div>
        <div style={{ fontSize: `${10 * fontScale}px`, marginBottom: '2px' }}>
          <span style={{ color: '#888' }}>{t('info.constellation')}:</span> {getConstellation(obj.constel, lang)}
        </div>
        <div style={{ fontSize: `${10 * fontScale}px`, marginBottom: '2px' }}>
          <span style={{ color: '#888' }}>{t('info.magnitude')}:</span> {obj.appaMag}
        </div>
        <div style={{ fontSize: `${10 * fontScale}px`, marginBottom: '2px' }}>
          <span style={{ color: '#888' }}>{t('info.angularDiameter')}:</span> {getAngularDiameter(obj.angDia, lang)}
        </div>
         <div style={{ fontSize: `${10 * fontScale}px`, marginBottom: '2px' }}>
          <span style={{ color: '#888' }}>{t('info.summary')}:</span> {getSummary(obj.summary, lang)}
        </div>
        <div style={{ 
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '9px', 
          color: '#4a9eff',
          fontStyle: 'italic',
          textAlign: 'center'
        }}>
          {loading ? t('info.loading') : t('info.clickWiki')}
        </div>
      </div>
    </Html>
  );

  if (imageUrl && !loading) {
    return (
      <group position={[x, y, z]}>
        
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          <ImageSprite 
            imageUrl={imageUrl} 
            size={0.3}
            position={[x, y, z]}  
            onPointerEnter={handleObjectEnter}
            onPointerLeave={handleObjectLeave}
            onClick={handleClick}
          />
          
          <Text
            position={[0, -0.2, 0]}
            fontSize={0.1 * fontScale}
            color="#ffffff"
            anchorX="center"
            anchorY="top"
            outlineWidth={0.01}
            outlineColor="black"
            onPointerEnter={handleObjectEnter}
            onPointerLeave={handleObjectLeave}
            onClick={handleClick}
          >
            {showLabels
              ? getDisplayName(obj.name, lang)
              : getShortName(obj.name)
            }
          </Text>
          
        </Billboard>
        {(hovered && isActive)  && <InfoPanel />}
      </group>
    );
  }

  return (
    <group position={[x, y, z]}>
      
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <mesh
          onPointerEnter={handleObjectEnter}
          onPointerLeave={handleObjectLeave}
          onClick={handleClick}
        >
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <Text
          position={[0.1, 0.1, 0]}
          fontSize={0.12 * fontScale}
          color="#ffffff"
          anchorX="left"
          anchorY="bottom"
          outlineWidth={0.01}
          outlineColor="black"
          onPointerEnter={handleObjectEnter}
          onPointerLeave={handleObjectLeave}
          onClick={handleClick}
        >
          {showLabels
            ? obj.name
            : obj.name.split("-")[0].trim()
          }
        </Text>
       
      </Billboard>
      {(hovered && isActive)  && <InfoPanel />}
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