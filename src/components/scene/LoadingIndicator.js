import React from "react";
import { Html } from "@react-three/drei";
import { useTranslation } from 'react-i18next';

export function LoadingIndicator() {
  const { t } = useTranslation();
  return (
    <Html center>
      <div style={{
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px 20px',
        borderRadius: '5px',
        fontFamily: 'Arial, sans-serif'
      }}>
        {t('loading.initializing')}
      </div>
    </Html>
  );
}