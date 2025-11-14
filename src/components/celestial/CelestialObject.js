import React, { useState, useEffect, useRef } from "react";
import { Text, Html, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { useWikipediaImage } from "../../hooks/useWikipediaImage";
import { useFontScale } from "../../hooks/useFontScale";
import { extractWikiTitle, convertRA, convertDEC, raDecToXYZ } from "../../utils/coordinates";
import { astronomicalScore } from "../../utils/dataProcessing";
import { ImageSprite } from "./ImageSprite";

export function CelestialObject({ obj, index, overridePosition }) {
  console.log(`......................: ${obj.wikiUrl}`);
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
  const leaveTimeoutRef = useRef(null);

  const handleClick = () => {
    const wikiUrl = `${obj.wikiUrl}`;
    window.open(wikiUrl, '_blank');
  };

  // 处理3D对象的hover
  const handleObjectEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setHovered(true);
  };

  const handleObjectLeave = () => {
    // 延迟150ms后检查，如果panel没有被hover则隐藏
    leaveTimeoutRef.current = setTimeout(() => {
      if (!isPanelHovered) {
        setHovered(false);
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
    }, 150);
  };

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, [hovered]);

  const InfoPanel = () => (
    <Html 
      position={[0, imageUrl ? 0.35 : 0.25, 0]} 
      center 
      distanceFactor={10}
      zIndexRange={[1000, 0]}
      style={{ pointerEvents: 'none' }}
      occlude={false}
    >
      <div 
        style={{
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: `${10 * fontScale}px`,
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          border: '2px solid rgba(74, 158, 255, 0.5)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
          pointerEvents: 'auto',
          userSelect: 'none',
          cursor: 'pointer',
          zIndex: 9999,
          position: 'relative',
          minWidth: imageUrl ? '170px' : 'auto',
        }}
        onClick={handleClick}
        onMouseEnter={handlePanelEnter}
        onMouseLeave={handlePanelLeave}
        onPointerEnter={handlePanelEnter}
        onPointerLeave={handlePanelLeave}
      >
        {imageUrl && (
          <div style={{ marginBottom: '10px', textAlign: 'center' }}>
            <img 
              src={imageUrl} 
              width="150" 
              height="150" 
              style={{ 
                borderRadius: '4px',
                display: 'block',
                margin: '0 auto',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }} 
              alt={obj.name}
            />
          </div>
        )}
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: `${12 * fontScale}px`, 
          marginBottom: '6px', 
          color: '#4a9eff',
          textAlign: 'center'
        }}>
          {obj.name}
        </div>
        <div style={{ fontSize: `${10 * fontScale}px`, marginBottom: '2px' }}>
          <span style={{ color: '#888' }}>RA:</span> {obj.ra}
        </div>
        <div style={{ fontSize: `${10 * fontScale}px`, marginBottom: '2px' }}>
          <span style={{ color: '#888' }}>DEC:</span> {obj.dec}
        </div>
        <div style={{ fontSize: `${10 * fontScale}px`, marginBottom: '8px' }}>
          <span style={{ color: '#888' }}>Distance:</span> {parseFloat(obj.dist).toLocaleString()} ly
        </div>
        <div style={{ 
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: `${9 * fontScale}px`, 
          color: '#4a9eff',
          fontStyle: 'italic',
          textAlign: 'center'
        }}>
          {loading ? 'Loading...' : 'Click anywhere to view on Wikipedia →'}
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
          onPointerEnter={handleObjectEnter}
          onPointerLeave={handleObjectLeave}
          onClick={handleClick}
        />
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
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
            {obj.name}
          </Text>
        </Billboard>
        {hovered && <InfoPanel />}
      </group>
    );
  }

  return (
    <group position={[x, y, z]}>
      <mesh
        onPointerEnter={handleObjectEnter}
        onPointerLeave={handleObjectLeave}
        onClick={handleClick}
      >
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
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
          {obj.name}
        </Text>
      </Billboard>
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