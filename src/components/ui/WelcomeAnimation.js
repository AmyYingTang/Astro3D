import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';

/**
 * 欢迎动画控制器 - 必须在 Canvas 内部使用
 */
export function WelcomeAnimationController({ onStepChange, isPlaying, onComplete }) {
  const { camera, controls } = useThree();
  const hasStarted = useRef(false);
  const timelineRef = useRef(null);

  useEffect(() => {
    if (isPlaying && !hasStarted.current) {
      hasStarted.current = true;
      playWelcomeSequence();
    }

     // ⭐ 新增：当 isPlaying 变为 false 时，杀死动画
    if (!isPlaying && timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
      if (controls) {
        controls.enabled = true;
      }
      hasStarted.current = false;
    }
  }, [isPlaying]);

  const playWelcomeSequence = () => {
    if (controls) {
      controls.enabled = false;
    }

    const timeline = gsap.timeline({
      onComplete: () => {
        if (controls) {
          controls.enabled = true;
        }
        onComplete?.();
        hasStarted.current = false;
        timelineRef.current = null; // ⭐ 清空引用
      }
    });
    timelineRef.current = timeline; // ⭐ 清空引用

    timeline.to(camera.position, {
      x: 0,
      y: 0.5,
      z: 1.2,
      duration: 0,
      ease: 'power2.out',
      onUpdate: () => {
        camera.lookAt(0, 0, 0);
      }
    });

    timeline.to(camera.position, {
      x: 0,
      y: 1,
      z: 8,
      duration: 2,
      ease: 'power2.out',
      onStart: () => onStepChange?.(1),
      onUpdate: () => {
        camera.lookAt(0, 0, 0);
      }
    });

    timeline.to(camera.position, {
      x: 3,
      y: 2,
      z: 6,
      duration: 3,
      ease: 'power1.inOut',
      onStart: () => onStepChange?.(2),
      onUpdate: () => {
        camera.lookAt(0, 0, 0);
      }
    });

    timeline.to(camera.position, {
      x: -2,
      y: 1.5,
      z: 5,
      duration: 3,
      ease: 'power1.inOut',
      onStart: () => onStepChange?.(3),
      onUpdate: () => {
        camera.lookAt(0, 0, 0);
      }
    });

    timeline.to(camera.position, {
      x: 0,
      y: 0,
      z: 5,
      duration: 2,
      ease: 'power2.inOut',
      onStart: () => onStepChange?.(4),
      onUpdate: () => {
        camera.lookAt(0, 0, 0);
      },
      onComplete: () => {
        if (controls) {
          controls.target.set(0, 0, 0);
          controls.update();
        }
      }
    });
  };

  return null;
}

/**
 * 欢迎动画 Hook
 */
export function useWelcomeAnimation() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const hasVisited = localStorage.getItem('myastro3d-visited');
    if (!hasVisited) {
      setIsPlaying(true);
      setHasPlayed(false);
    } else {
      setHasPlayed(true);
    }
  }, []);

  const startAnimation = () => {
    setIsPlaying(true);
    setStep(0);
  };

  const skipAnimation = () => {
    setIsPlaying(false);
    setStep(4);
    setHasPlayed(true);
    localStorage.setItem('myastro3d-visited', 'true');
  };

  const handleComplete = () => {
    setIsPlaying(false);
    setHasPlayed(true);
    localStorage.setItem('myastro3d-visited', 'true');
  };

  const handleStepChange = (newStep) => {
    setStep(newStep);
  };

  return {
    isPlaying,
    hasPlayed,
    step,
    startAnimation,
    skipAnimation,
    handleComplete,
    handleStepChange
  };
}

/**
 * 方案 1：简约版 - 移到顶部，加深色背景
 * 推荐指数：⭐⭐⭐⭐⭐
 */
export function WelcomeAnimationUI({ isPlaying, step, onSkip }) {
  const messages = {
    0: "准备启程...",
    1: "从地球出发 🚀",
    2: "探索宇宙空间 ✨",
    3: "环顾星辰大海 ✨",
    4: "欢迎来到 MyAstro3D！"
  };

  if (!isPlaying && step === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: isPlaying ? 'all' : 'none',
      zIndex: 9999,
      transition: 'opacity 0.5s',
      opacity: isPlaying ? 1 : 0
    }}>
      {/* 顶部消息条 - 不遮挡主视区 */}
      <div style={{
        position: 'absolute',
        top: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        pointerEvents: 'auto',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
        padding: '25px 50px',
        borderRadius: '30px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        minWidth: '400px'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          margin: '0 0 15px 0',
          background: 'linear-gradient(90deg, #00d4ff, #0099ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'shimmer 2s ease-in-out infinite'
        }}>
          {messages[step]}
        </h1>

        {/* 进度条 */}
        <div style={{
          width: '100%',
          height: '3px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
          margin: '15px 0',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(step / 4) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00d4ff, #0099ff)',
            transition: 'width 0.3s ease',
            boxShadow: '0 0 10px rgba(0, 212, 255, 0.8)'
          }} />
        </div>

        {/* 步骤指示 */}
        <div style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '10px'
        }}>
          {step}/4
        </div>
      </div>

      {/* 右下角跳过按钮 - 不抢眼但易找 */}
      <button
        onClick={onSkip}
        style={{
          position: 'absolute',
          bottom: '30px',
          right: '30px',
          padding: '12px 25px',
          fontSize: '14px',
          color: 'white',
          background: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '20px',
          cursor: 'pointer',
          transition: 'all 0.3s',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          pointerEvents: 'auto'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(0, 0, 0, 0.95)';
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(0, 0, 0, 0.8)';
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          e.target.style.transform = 'scale(1)';
        }}
      >
        跳过 ⏭
      </button>

      <style>{`
        @keyframes shimmer {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
      `}</style>
    </div>
  );
}

/**
 * 方案 2：极简版 - 只显示进度条
 * 推荐指数：⭐⭐⭐⭐
 */
export function WelcomeAnimationUIMinimal({ isPlaying, step, onSkip }) {
  if (!isPlaying && step === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: 9999
    }}>
      {/* 顶部细线进度条 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '3px',
        background: 'rgba(0,0,0,0.5)'
      }}>
        <div style={{
          width: `${(step / 4) * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #00d4ff, #0099ff)',
          transition: 'width 0.3s ease',
          boxShadow: '0 0 20px rgba(0, 212, 255, 1)'
        }} />
      </div>

      {/* 右上角跳过 */}
      <button
        onClick={onSkip}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '8px 16px',
          fontSize: '12px',
          color: 'white',
          background: 'rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '15px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          backdropFilter: 'blur(5px)',
          pointerEvents: 'auto',
          opacity: 0.7
        }}
        onMouseEnter={(e) => {
          e.target.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.target.style.opacity = '0.7';
        }}
      >
        跳过 ⏭
      </button>
    </div>
  );
}

/**
 * 天体闪烁淡入效果
 */
export function useStaggeredFadeIn(totalObjects, isAnimating) {
  const [visibleIndices, setVisibleIndices] = useState(new Set());

  useEffect(() => {
    if (!isAnimating) {
      setVisibleIndices(new Set(Array.from({ length: totalObjects }, (_, i) => i)));
      return;
    }

    setVisibleIndices(new Set());
    
    const intervalTime = 2000 / totalObjects;
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < totalObjects) {
        setVisibleIndices(prev => new Set([...prev, currentIndex]));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isAnimating, totalObjects]);

  return visibleIndices;
}