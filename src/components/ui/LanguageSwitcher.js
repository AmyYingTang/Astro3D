import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh');

  const toggle = () => {
    i18n.changeLanguage(isZh ? 'en' : 'zh');
  };

  return (
    <button
      onClick={toggle}
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '20px',
        padding: '6px 14px',
        cursor: 'pointer',
        fontSize: '13px',
        fontFamily: 'Arial, sans-serif',
        transition: 'all 0.3s',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = 'rgba(0, 0, 0, 0.9)';
        e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'rgba(0, 0, 0, 0.7)';
        e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      }}
      title={isZh ? 'Switch to English' : '切换到中文'}
    >
      <span style={{ opacity: isZh ? 1 : 0.5, fontWeight: isZh ? 'bold' : 'normal' }}>中</span>
      <span style={{ opacity: 0.5 }}>/</span>
      <span style={{ opacity: isZh ? 0.5 : 1, fontWeight: isZh ? 'normal' : 'bold' }}>EN</span>
    </button>
  );
}
