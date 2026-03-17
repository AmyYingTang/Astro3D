import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RangeSlider } from './RangeSlider';
import { CollapsibleSection } from './CollapsibleSection';

/**
 * 天体过滤器面板
 * @param {Object} filters - 当前过滤器状态
 * @param {function} onFilterChange - 过滤器变化回调
 * @param {number} totalObjects - 总天体数
 * @param {number} filteredObjects - 过滤后的天体数
 * @param {Array} availableTypes - 可用的天体类型列表
 * @param {Array} availableFilters - 可用的滤镜列表
 * @param {boolean} props.showLabels - 是否显示星体名称
 * @param {Function} props.onShowLabelsChange - 名称显示状态变化回调
 */
export function CelestialFilter({ 
  filters, 
  onFilterChange, 
  totalObjects, 
  filteredObjects,
  availableTypes = [],
  availableFilters = [],
  showLabels,
  onShowLabelsChange
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [typeExpanded, setTypeExpanded] = useState(false);
  const [filterExpanded, setFilterExpanded] = useState(false);

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
          {t('filter.title')}
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
          {t('filter.reset')}
        </button>
      </div>

      {/* 可折叠内容 */}
      {isExpanded && (
        <div style={{
          padding: '15px',
          overflowY: 'auto',
          maxHeight: 'calc(90vh - 120px)'
        }}>
          <div style={{ 
            marginTop: '5px', 
            paddingTop: '15px', 
            borderTop: '1px solid rgba(255,255,255,0.2)' 
          }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={!showLabels}
                onChange={(e) => onShowLabelsChange(!e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <span>{t('filter.showFullName')}</span>
            </label>
          </div>

          {/* 名称搜索 */}
          <div style={{ marginBottom: '15px' }}>
            {/* <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: 'bold',
              marginBottom: '5px' 
            }}>
              星体名称
            </label> */}
            <input
              type="text"
              value={filters.nameSearch || ''}
              onChange={handleNameChange}
              placeholder={t('filter.searchPlaceholder')}
              style={{
                width: '90%',
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
            label={t('filter.ra')}
            min={0}
            max={24}
            step={0.1}
            value={filters.ra}
            onChange={handleRAChange}
            unit="h"
          />

          {/* DEC 滑块 */}
          <RangeSlider
            label={t('filter.dec')}
            min={-90}
            max={90}
            step={1}
            value={filters.dec}
            onChange={handleDECChange}
            unit="°"
            plusSignForPositive={true}
          />

          {/* 天体类型 - 折叠区域 */}
          <CollapsibleSection
            title={t('filter.objectType')}
            expanded={typeExpanded}
            onToggle={() => setTypeExpanded(!typeExpanded)}
            count={filters.types.length > 0 ? filters.types.length : undefined}
          >
            {availableTypes.map(type => (
              <label key={type} style={{ display: 'block', marginBottom: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.types.includes(type)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...filters.types, type]
                      : filters.types.filter(t => t !== type);
                    onFilterChange({ ...filters, types: newTypes });
                  }}
                  style={{ marginRight: '8px' }}
                />
                {type}
              </label>
            ))}
          </CollapsibleSection>

          {/* 滤镜类型 - 折叠区域 */}
          <CollapsibleSection
            title={t('filter.filterType')}
            expanded={filterExpanded}
            onToggle={() => setFilterExpanded(!filterExpanded)}
            count={filters.filters.length > 0 ? filters.filters.length : undefined}
          >
            {availableFilters.map(filter => (
              <label key={filter} style={{ display: 'block', marginBottom: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.filters.includes(filter)}
                  onChange={(e) => {
                    const newFilters = e.target.checked
                      ? [...filters.filters, filter]
                      : filters.filters.filter(f => f !== filter);
                    onFilterChange({ ...filters, filters: newFilters });
                  }}
                  style={{ marginRight: '8px' }}
                />
                {filter}
              </label>
            ))}
          </CollapsibleSection>

         

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
              {t('filter.showing', { filtered: filteredObjects, total: totalObjects })}
            </div>
            {filteredObjects < totalObjects && (
              <div style={{ 
                marginTop: '5px', 
                fontSize: '11px', 
                color: '#aaa' 
              }}>
                {t('filter.filtered', { count: totalObjects - filteredObjects })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
