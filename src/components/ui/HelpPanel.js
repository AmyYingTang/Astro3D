import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 📖 HelpPanel
 * - 默认展开，用户交互后自动收起
 */
export default function HelpPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const close = () => setIsOpen(false);
    window.addEventListener('pointerdown', close, { once: true });
    return () => window.removeEventListener('pointerdown', close);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
      }}
    >
      {/* 帮助按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          cursor: 'pointer',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(0, 0, 0, 0.9)';
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(0, 0, 0, 0.7)';
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }}
        title={t('help.tooltip')}
      >
        {isOpen ? '✕' : '?'}
      </button>

      {/* 帮助内容面板 */}
      {isOpen && (
        <div
          style={{
            marginTop: '10px',
            color: 'white',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '15px',
            borderRadius: '8px',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            maxWidth: '300px',
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0' }}>MyAstro3D beta</h3>
          <p style={{ margin: '5px 0', fontSize: '12px' }}>
            • {t('help.mouseInstructions')}<br />
            • <strong>{t('help.hoverPrompt')}</strong>{t('help.hoverAction')}<br />
            • <strong>{t('help.clickPrompt')}</strong>{t('help.clickAction')}<br />
            • Credits:<br />
            &nbsp;&nbsp;&nbsp;&nbsp;• Celestial objects images from Wikipedia<br />
            &nbsp;&nbsp;&nbsp;&nbsp;• Earth textures by Solar System Scope<br />
            &nbsp;&nbsp;&nbsp;&nbsp;• Milky Way texture by{' '}
            <a
              href="https://josefrancisco.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#4da3ff' }}
            >
              ESO/José Francisco
            </a>
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;• Music by Maksym Malko from Pixabay<br />
          </p>
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}
