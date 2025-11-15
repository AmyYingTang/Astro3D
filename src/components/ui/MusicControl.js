import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";

/**
 * 🎧 MusicControl
 * - 背景音乐控制组件（播放/暂停 + 音量调节）
 * - 支持外部触发播放 (通过 ref)
 * - 带淡入效果 & 防止重复播放
 */
const MusicControl = forwardRef(function MusicControl(
  {
    src = "/music/space-space-galaxy-universe-music-301239.mp3",
    initialVolume = 0.3,
    position = { top: 20, right: 20 },
    fadeDuration = 1000, // 淡入时间（毫秒）
  },
  ref
) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const hasPlayed = useRef(false); // ✅ 防止重复播放

  // 暴露外部控制方法
  useImperativeHandle(ref, () => ({
    play: () => {
      console.log('🎵 [MusicControl] play() 被调用', {
        hasPlayed: hasPlayed.current,
        playing: playing,
        audioReady: !!audioRef.current
      });

      if (!hasPlayed.current) {
        console.log('✅ [MusicControl] 设置 playing = true');

        setPlaying(true);
        hasPlayed.current = true;
      } else {
        console.log('⛔ [MusicControl] 已经播放过，跳过');
      }    
    },
    pause: () => setPlaying(false),
  }));

  // 控制播放 / 音量 + 淡入逻辑
  useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  console.log('🔄 [MusicControl] useEffect 触发', { playing });

  let fadeInterval; // ⭐ 用于清理

  if (playing) {
    console.log('▶️ [MusicControl] 尝试播放音频...');
    audio.volume = 0;
    audio
      .play()
      .then(() => {
        console.log('✅ [MusicControl] 播放成功！设置 hasPlayed = true');
        // ⭐ 只在播放成功后才锁定
        hasPlayed.current = true;

        // 🎧 平滑淡入
        let currentVolume = 0;
        const target = volume;
        const steps = Math.max(1, Math.floor(fadeDuration / 50));
        const stepSize = target / steps;
        fadeInterval = setInterval(() => {
          currentVolume += stepSize;
          if (currentVolume >= target) {
            currentVolume = target;
            clearInterval(fadeInterval);
            console.log('🎶 [MusicControl] 淡入完成');
          }
          audio.volume = currentVolume;
        }, 50);
      })
      .catch((err) => {
        console.error('❌ [MusicControl] 播放失败:', err.name, err.message);

        setPlaying(false); // ⭐ 自动关闭播放状态
        hasPlayed.current = false; // ⭐ 允许重试
      });
  } else {
    console.log('⏸️ [MusicControl] 淡出/暂停');
    // 🎧 平滑淡出
    let currentVolume = audio.volume;
    fadeInterval = setInterval(() => {
      currentVolume -= 0.05;
      if (currentVolume <= 0) {
        currentVolume = 0;
        clearInterval(fadeInterval);
        audio.pause();
        audio.currentTime = 0;
      }
      audio.volume = currentVolume;
    }, 50);
  }

  // ⭐ cleanup: 组件卸载或 playing 变化时清理 interval
  return () => {
    if (fadeInterval) clearInterval(fadeInterval);
  };
}, [playing, fadeDuration, volume]); // ⭐ 添加依赖项

  // 手动调节音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <>
      <audio ref={audioRef} src={src} loop />

      <div
        style={{
        //   position: "absolute",
        //   top: position.top,
        //   right: position.right,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 10px",
          borderRadius: "12px",
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(6px)",
          boxShadow: "0 0 6px rgba(0,0,0,0.3)",
          //zIndex: 1000,
        }}
      >
        <button
          onClick={() => setPlaying((p) => !p)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            color: playing ? "#38bdf8" : "#94a3b8",
            transition: "color 0.3s ease, transform 0.2s ease",
            transform: playing ? "scale(1.2)" : "scale(1)",
          }}
          title={playing ? "Pause Music" : "Play Music"}
        >
          {playing ? "🔊" : "🔈"}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={{
            width: "80px",
            cursor: "pointer",
            accentColor: "#38bdf8",
          }}
          title={`Volume: ${(volume * 100).toFixed(0)}%`}
        />
      </div>
    </>
  );
});

export default MusicControl;

