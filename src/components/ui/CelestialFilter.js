import React, { useState } from 'react';
import { RangeSlider } from './RangeSlider';

/**
 * 天体过滤器面板
 * @param {Object} filters - 当前过滤器状态
 * @param {function} onFilterChange - 过滤器变化回调
 * @param {number} totalObjects - 总天体数
 * @param {number} filteredObjects - 过滤后的天体数
 * @param {Array} availableTypes - 可用的天体类型列表
 * @param {Array} availableFilters - 可用的滤镜列表
 */
export function CelestialFilter({ 
  filters, 
  onFilterChange, 
  totalObjects, 
  filteredObjects,
  availableTypes = [],
  availableFilters = []
}) {
  const [isExpanded, setIsExpanded] = useState(true);

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

  const handleNameChange = (e) => {
    onFilterChange({
      ...filters,
      nameSearch: e.target.value
    });
  };

  const handleTypeToggle = (type) => {
    const currentTypes = filters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    onFilterChange({
      ...filters,
      types: newTypes
    });
  };

  const handleFilterToggle = (filter) => {
    const currentFilters = filters.filters || [];
    const newFilters = currentFilters.includes(filter)
      ? currentFilters.filter(f => f !== filter)
      : [...currentFilters, filter];
    onFilterChange({
      ...filters,
      filters: newFilters
    });
  };


  const handleReset = () => {
    onFilterChange({
      ra: [0, 24],
      dec: [-90, 90],
      nameSearch: '',
      types: [],
      filters: []
    });
  };

  return (
    <div style={{
      //position: 'absolute',
      top: '20px',
      right: '20px',
      width: '300px',
      background: 'rgba(0, 0, 0, 0.85)',
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif',
      color: 'white',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 标题栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        cursor: 'pointer'
      }}
      onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 style={{ 
          margin: 0, 
          fontSize: '16px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🔍 天体过滤器
          <span style={{ fontSize: '12px', color: '#888' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleReset();
          }}
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

      {/* 可折叠内容 */}
      {isExpanded && (
        <div style={{
          padding: '15px',
          overflowY: 'auto',
          maxHeight: 'calc(90vh - 120px)'
        }}>
          {/* 名称搜索 */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: 'bold',
              marginBottom: '5px' 
            }}>
              天体名称
            </label>
            <input
              type="text"
              value={filters.nameSearch || ''}
              onChange={handleNameChange}
              placeholder="搜索..."
              style={{
                width: '100%',
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: 'white',
                fontSize: '13px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4a9eff'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
            />
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

          {/* 天体类型多选 */}
          {availableTypes.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 'bold',
                marginBottom: '8px' 
              }}>
                天体类型
              </label>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                maxHeight: '120px',
                overflowY: 'auto',
                padding: '5px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px'
              }}>
                {availableTypes.map(type => (
                  <label key={type} style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '2px'
                  }}>
                    <input
                      type="checkbox"
                      checked={(filters.types || []).includes(type)}
                      onChange={() => handleTypeToggle(type)}
                      style={{ marginRight: '8px', cursor: 'pointer' }}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 滤镜多选 */}
          {availableFilters.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 'bold',
                marginBottom: '8px' 
              }}>
                滤镜
              </label>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                maxHeight: '100px',
                overflowY: 'auto',
                padding: '5px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px'
              }}>
                {availableFilters.map(filter => (
                  <label key={filter} style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '2px'
                  }}>
                    <input
                      type="checkbox"
                      checked={(filters.filters || []).includes(filter)}
                      onChange={() => handleFilterToggle(filter)}
                      style={{ marginRight: '8px', cursor: 'pointer' }}
                    />
                    {filter}
                  </label>
                ))}
              </div>
            </div>
          )}

         

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
        </div>
      )}
    </div>
  );
}
