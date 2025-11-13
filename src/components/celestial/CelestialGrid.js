import React from "react";
import * as THREE from "three";
import { raDecToXYZ } from "../../utils/coordinates";

export function CelestialGrid({ radius = 4.9 }) {
  const lines = [];

  // 赤纬圈
  for (let dec = -60; dec <= 60; dec += 30) {
    const circle = new THREE.EllipseCurve(
      0, 0,
      radius * Math.cos(THREE.MathUtils.degToRad(dec)),
      radius * Math.cos(THREE.MathUtils.degToRad(dec))
    );
    const points = circle.getPoints(64).map((p) => 
      new THREE.Vector3(p.x, radius * Math.sin(THREE.MathUtils.degToRad(dec)), p.y)
    );
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