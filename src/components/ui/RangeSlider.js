import React from 'react';

/**
 * 双滑块范围选择器
 * @param {string} label - 标签文字
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {number} step - 步进值
 * @param {[number, number]} value - 当前范围 [最小, 最大]
 * @param {function} onChange - 值变化回调
 * @param {string} unit - 单位显示
 */
export function RangeSlider({ label, min, max, step, value, onChange, unit = '', plusSignForPositive }) {
  const [minVal, maxVal] = value;

  const handleMinChange = (e) => {
    const newMin = parseFloat(e.target.value);
    if (newMin <= maxVal) {
      onChange([newMin, maxVal]);
    }
  };

  const handleMaxChange = (e) => {
    const newMax = parseFloat(e.target.value);
    if (newMax >= minVal) {
      onChange([minVal, newMax]);
    }
  };

  // 计算滑块位置百分比
  const minPercent = ((minVal - min) / (max - min)) * 100;
  const maxPercent = ((maxVal - min) / (max - min)) * 100;

  return (
    <div style={{
      marginBottom: '20px',
      padding: '10px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
    }}>
      {/* 标签和当前值显示 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px',
        fontSize: '13px',
        color: '#fff'
      }}>
        <span style={{ fontWeight: 'bold' }}>{label}</span>
        <span style={{ color: '#4a9eff' }}>
          {plusSignForPositive && minVal > 0 ? `+${minVal}` : minVal}{unit} 
          &nbsp;--&nbsp;  
          {plusSignForPositive && maxVal > 0 ? `+${maxVal}` : maxVal}{unit}
        </span>
      </div>

      {/* 双滑块容器 */}
      <div style={{
        position: 'relative',
        height: '40px',
        marginBottom: '5px'
      }}>
        {/* 背景轨道 */}
        <div style={{
          position: 'absolute',
          top: '18px',
          left: '0',
          right: '0',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px'
        }} />

        {/* 选中范围高亮 */}
        <div style={{
          position: 'absolute',
          top: '18px',
          left: `${minPercent}%`,
          right: `${100 - maxPercent}%`,
          height: '4px',
          background: '#4a9eff',
          borderRadius: '2px'
        }} />

        {/* 最小值滑块 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}          
          style={{
            position: 'absolute',
            width: '100%',
            height: '40px',
            top: '0',
            left: '0',
            appearance: 'none',
            background: 'transparent',
            pointerEvents: 'none',
            cursor: 'pointer',
            zIndex: minVal > max - (max - min) / 4 ? 5 : 3,
            WebkitAppearance: 'none',            
          }}
          // CSS-in-JS 不支持伪元素，需要在全局CSS中定义
          className="range-slider-thumb"
        />

        {/* 最大值滑块 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}         
          style={{
            position: 'absolute',
            width: '100%',
            height: '40px',
            top: '0',
            left: '0',
            appearance: 'none',
            background: 'transparent',
            pointerEvents: 'none',
            cursor: 'pointer',
            zIndex: 4,
            WebkitAppearance: 'none',            
          }}
          className="range-slider-thumb"
        />
      </div>

      {/* 最小/最大标签 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#888'
      }}>
        <span>{min}{unit}</span>
        <span>{plusSignForPositive && max > 0 ? `+${max}` : max}{unit}</span>
      </div>
    </div>
  );
}
