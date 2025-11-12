import React, { Suspense } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

function MilkyWayWithTexture() {
  const milkyWayRadius = 9.8;
  const milkyWayTexture = useLoader(
    THREE.TextureLoader, 
    '/textures/milky_way_panorama.jpg'
  );
  
  milkyWayTexture.colorSpace = THREE.SRGBColorSpace;
  milkyWayTexture.wrapS = THREE.RepeatWrapping;
  milkyWayTexture.wrapT = THREE.ClampToEdgeWrapping;
  milkyWayTexture.repeat.x = -1;
  milkyWayTexture.offset.x = 0.26;
  
  return (
    <mesh rotation={[0, Math.PI, 0]}>
      <sphereGeometry args={[milkyWayRadius, 64, 64]} />
      <meshBasicMaterial 
        map={milkyWayTexture} 
        transparent={true}
        opacity={0.85}
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export function MilkyWay() {
  return (
    <Suspense fallback={null}>
      <MilkyWayWithTexture />
    </Suspense>
  );
}