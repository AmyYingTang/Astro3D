import { useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";

export function useFontScale() {
  const { camera } = useThree();
  const [fontScale, setFontScale] = useState(1);
  
  useFrame(() => {
    const distance = camera.position.length();
    const scale = Math.min(1.5, Math.max(1, distance / 8));
    setFontScale(scale);
  });
  
  return fontScale;
}