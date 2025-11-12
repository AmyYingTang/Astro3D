import React from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";

export function Axes({ length = 3.1 }) {
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