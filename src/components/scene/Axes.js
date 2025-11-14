import React from "react";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";

export function Axes({ length = 5.1 }) {
  const makeLine = (start, end, color, label, labelPos) => {
    const points = [start, end];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return (
      <group key={color}>
        <line geometry={geometry}>
          <lineBasicMaterial color={color} />
        </line>
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
          position={labelPos}
        >
          <Text   
            position={[0, 0, 0]}         
            fontSize={0.2}
            color={color}
            anchorX="centre"
            anchorY="middle"
          >
            {label}
          </Text>
        </Billboard>
        
      </group>
    );
  };

  return (
    <group>
      {/* +X轴：RA 0h（非洲） */}
      {makeLine(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(length, 0, 0),
        'red',
        'RA 0h',
        [length + 0.2, 0, 0]
      )}

      {/* +Y轴：北天极 */}
      {makeLine(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, length, 0),
        'blue',
        'DEC +90°',
        [0, length + 0.2, 0]
      )}

      {/* +Z轴：RA 18h（银心方向） */}
      {makeLine(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, length),
        'green',
        'RA 18h',
        [0, 0, length + 0.2]
      )}

      {/* -X轴：RA 12h */}
      {makeLine(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-length, 0, 0),
        'orange',
        'RA 12h',
        [-length - 0.2, 0, 0]
      )}

      {/* -Z轴：RA 6h（亚洲方向） */}
      {makeLine(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -length),
        'cyan',
        'RA 6h',
        [0, 0, -length - 0.2]
      )}
    </group>
  );
}