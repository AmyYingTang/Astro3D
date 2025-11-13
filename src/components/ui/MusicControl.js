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
      if (!hasPlayed.current) {
        setPlaying(true);
        hasPlayed.current = true;
      }
    },
    pause: () => setPlaying(false),
  }));

  // 控制播放 / 音量 + 淡入逻辑
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.volume = 0;
      audio
        .play()
        .then(() => {
          // 🎧 平滑淡入
          let currentVolume = 0;
          const target = volume;
          const steps = Math.max(1, Math.floor(fadeDuration / 50));
          const stepSize = target / steps;
          const fadeIn = setInterval(() => {
            currentVolume += stepSize;
            if (currentVolume >= target) {
              currentVolume = target;
              clearInterval(fadeIn);
            }
            audio.volume = currentVolume;
          }, 50);
        })
        .catch(() => {});
    } else {
      // 可选：淡出逻辑
      const fadeOut = setInterval(() => {
        if (audio.volume <= 0.05) {
          clearInterval(fadeOut);
          audio.pause();
          audio.volume = 0;
        } else {
          audio.volume -= 0.05;
        }
      }, 50);
    }
  }, [playing]);

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
          position: "absolute",
          top: position.top,
          right: position.right,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 10px",
          borderRadius: "12px",
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(6px)",
          boxShadow: "0 0 6px rgba(0,0,0,0.3)",
          zIndex: 1000,
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

