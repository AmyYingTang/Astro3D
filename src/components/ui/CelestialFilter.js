import React from 'react';
import { RangeSlider } from './RangeSlider';

/**
 * 天体过滤器面板
 * @param {Object} filters - 当前过滤器状态 { ra: [min, max], dec: [min, max] }
 * @param {function} onFilterChange - 过滤器变化回调
 * @param {number} totalObjects - 总天体数
 * @param {number} filteredObjects - 过滤后的天体数
 */
export function CelestialFilter({ filters, onFilterChange, totalObjects, filteredObjects }) {
  const handleRAChange = (newRange) => {
    onFilterChange({
      ...filters,
      ra: newRange
    });
  };

  const handleDECChange = (newRange) => {
    onFilterChange({
      ...filters,
      dec: newRange
    });
  };

  const handleReset = () => {
    onFilterChange({
      ra: [0, 24],
      dec: [-90, 90]
    });
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '280px',
      background: 'rgba(0, 0, 0, 0.85)',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif',
      color: 'white',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)'
    }}>
      {/* 标题 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          🔍 天体过滤器
        </h3>
        <button
          onClick={handleReset}
          style={{
            padding: '4px 10px',
            fontSize: '11px',
            background: 'rgba(74, 158, 255, 0.2)',
            border: '1px solid #4a9eff',
            borderRadius: '4px',
            color: '#4a9eff',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(74, 158, 255, 0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(74, 158, 255, 0.2)';
          }}
        >
          重置
        </button>
      </div>

      {/* RA 滑块 */}
      <RangeSlider
        label="赤经 (RA)"
        min={0}
        max={24}
        step={0.1}
        value={filters.ra}
        onChange={handleRAChange}
        unit="h"
      />

      {/* DEC 滑块 */}
      <RangeSlider
        label="赤纬 (DEC)"
        min={-90}
        max={90}
        step={1}
        value={filters.dec}
        onChange={handleDECChange}
        unit="°"
      />

      {/* 统计信息 */}
      <div style={{
        marginTop: '15px',
        padding: '10px',
        background: 'rgba(74, 158, 255, 0.1)',
        borderRadius: '6px',
        fontSize: '13px',
        textAlign: 'center'
      }}>
        <div style={{ color: '#4a9eff', fontWeight: 'bold' }}>
          显示 {filteredObjects} / {totalObjects} 个天体
        </div>
        {filteredObjects < totalObjects && (
          <div style={{ 
            marginTop: '5px', 
            fontSize: '11px', 
            color: '#aaa' 
          }}>
            {totalObjects - filteredObjects} 个天体被过滤
          </div>
        )}
      </div>

      {/* 说明文字 */}
      <div style={{
        marginTop: '10px',
        fontSize: '11px',
        color: '#888',
        lineHeight: '1.4'
      }}>
        💡 拖动滑块调整可见天体的赤经和赤纬范围
      </div>
    </div>
  );
}
