import React from "react";
import { Html } from "@react-three/drei";

export function LoadingIndicator() {
  return (
    <Html center>
      <div style={{
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px 20px',
        borderRadius: '5px',
        fontFamily: 'Arial, sans-serif'
      }}>
        正在初始化场景...
      </div>
    </Html>
  );
}