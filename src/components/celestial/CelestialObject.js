import React, { useState, useEffect } from "react";
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
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
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
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        {/* meshBasicMaterial 被注释掉 */}
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
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
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