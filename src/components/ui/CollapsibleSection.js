
import React, { useState, useRef, useEffect } from 'react';

export function CollapsibleSection({ title, expanded, onToggle, count, children }) {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [children, expanded]);

  return (
    <div style={{ marginBottom: '15px' }}>
      {/* 标题 */}
      <div 
        onClick={onToggle}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 10px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: '13px' }}>
          {title} {count !== undefined && count > 0 && `(${count})`}
        </span>
        <span style={{ 
          fontSize: '12px', 
          transition: 'transform 0.2s',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          display: 'inline-block'
        }}>
          ▼
        </span>
      </div>
      
      {/* 内容 - 平滑动画 */}
      <div
        style={{
          maxHeight: expanded ? `${height}px` : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out',
        }}
      >
        <div ref={contentRef} style={{ paddingTop: '8px', paddingLeft: '5px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}