import React, { useState, useEffect } from "react";
import * as THREE from "three";

export function ImageSprite({ imageUrl, size = 0.3, onClick, onPointerEnter, onPointerLeave }) {
  const [texture, setTexture] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (loadedTexture) => {
        setTexture(loadedTexture);
        console.log(`Texture loaded successfully: ${imageUrl}`);
      },
      undefined,
      (err) => {
        console.error('Error loading texture:', err);
        setError(true);
      }
    );
  }, [imageUrl]);

  if (error || !texture) {
    return (
      <mesh
        onClick={onClick}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#ff6600" />
      </mesh>
    );
  }
  
  return (
    <sprite 
      scale={[size, size, 1]}
      onClick={onClick}
      onPointerOver={onPointerEnter}
      onPointerOut={onPointerLeave}
    >
      <spriteMaterial map={texture} transparent={true} />
    </sprite>
  );
}