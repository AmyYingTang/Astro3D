import React, { useState, useMemo } from "react";
import { CelestialObject } from "./CelestialObject";
import { convertRA, convertDEC, raDecToXYZ } from "../../utils/coordinates";
import { astronomicalScore } from "../../utils/dataProcessing";
import { useStaggeredFadeIn } from '../ui/WelcomeAnimation';

export function CelestialObjects({data, showLabels, isAnimating = false}) {
  const [activeObjectIndex, setActiveObjectIndex] = useState(null);

  const visibleIndices = useStaggeredFadeIn(data.length, isAnimating);

  // 自动检测并调整重叠天体位置
  const adjustedData = useMemo(() => {
    if (!data?.length) {
      console.log('No data to display');
      return [];
    }
    console.log(`Rendering ${data.length} celestial objects`);

    const minDistance = 0.5; // 最小允许距离（可调整）
    
    // 计算所有天体的初始位置
    const objects = data.map((obj, i) => {
      const isExtragalactic = obj.dist > 100000;
      const radius = isExtragalactic ? 10.2 : astronomicalScore(obj.dist);
      const raDeg = convertRA(obj.ra);
      const decDeg = convertDEC(obj.dec);
      const [x, y, z] = raDecToXYZ(raDeg, decDeg, radius);
      
      return {
        ...obj,
        position: [x, y, z],
        index: i
      };
    });
    
    // 碰撞检测和调整（多次迭代以处理连锁碰撞）
    for (let iteration = 0; iteration < 3; iteration++) {
      for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
          const [x1, y1, z1] = objects[i].position;
          const [x2, y2, z2] = objects[j].position;
          
          const dist = Math.sqrt(
            Math.pow(x2 - x1, 2) + 
            Math.pow(y2 - y1, 2) + 
            Math.pow(z2 - z1, 2)
          );
          
          if (dist < minDistance && dist > 0.001) {
            // 沿着两点连线方向推开
            const pushFactor = (minDistance - dist) / 2;
            const dirX = (x2 - x1) / dist;
            const dirY = (y2 - y1) / dist;
            const dirZ = (z2 - z1) / dist;
            
            // 两个天体各向相反方向移动一半距离
            objects[i].position = [
              x1 - dirX * pushFactor,
              y1 - dirY * pushFactor,
              z1 - dirZ * pushFactor
            ];
            
            objects[j].position = [
              x2 + dirX * pushFactor,
              y2 + dirY * pushFactor,
              z2 + dirZ * pushFactor
            ];
            
            console.log(`Adjusted collision between ${objects[i].name} and ${objects[j].name}, distance was ${dist.toFixed(3)}`);
          }
        }
      }
    }
    
    return objects;
  }, [data]);
  
  if (!adjustedData.length) {
    return null;
  }
  
  return (
    <group>
      {adjustedData.map((obj,index) => {
        const isVisible = visibleIndices.has(index);
        const opacity = isVisible ? 1 : 0;
        const scale = isVisible ? 1 : 0.5;

        return (
          <mesh 
            key={obj.index}  
            scale={[scale, scale, scale]}  // ⭐ 添加缩放
            opacity={opacity}              // ⭐ 添加透明度
            transparent                    // ⭐ 启用透明
          >
            {/* 你的天体渲染代码 */}
            <CelestialObject 
              //key={obj.index} 
              obj={obj} 
              index={obj.index}
              overridePosition={obj.position}
              showLabels={showLabels}
              isActive={activeObjectIndex === obj.index}
              onActivate={() => setActiveObjectIndex(obj.index)}
              onDeactivate={() => {
                if (activeObjectIndex === obj.index) {
                  setActiveObjectIndex(null);
                }
              }}
            />
          </mesh>
        );
        
      })}
    </group>
  );
}