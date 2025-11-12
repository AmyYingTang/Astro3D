import * as THREE from "three";

export const convertRA = (raString) => {
  // 处理格式: "05h 23m 34s"
  const match = raString.match(/(\d+)h\s*(\d+)m\s*(\d+)s/);
  if (!match) return 0;
  
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const seconds = parseInt(match[3]);
  
  // 转换为度数 (小时 * 15 + 分钟 * 0.25 + 秒 * 0.00416667)
  return hours * 15 + minutes * 0.25 + seconds * 0.004166667;
};

export const convertDEC = (decString) => {
  // 处理格式: "-69° 45' 22"" 或 "+41° 16' 09""
  const match = decString.match(/([+-]?\d+)°\s*(\d+)'\s*(\d+)/);
  if (!match) return 0;
  
  const degrees = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const seconds = parseInt(match[3]);
  
  const isNegative = degrees < 0;
  const decimal = Math.abs(degrees) + minutes / 60 + seconds / 3600;
  
  return (isNegative ? -decimal : decimal);
};

export const raDecToXYZ = (raDeg, decDeg, radius) => {
  const ra = THREE.MathUtils.degToRad(raDeg);
  const dec = THREE.MathUtils.degToRad(decDeg);
  const x = radius * Math.cos(dec) * Math.cos(ra);
  const y = radius * Math.sin(dec);
  const z = -radius * Math.cos(dec) * Math.sin(ra);
  return [x, y, z];
};

export const extractWikiTitle = (url) => {
  const parts = url.split('/wiki/');
  return parts.length > 1 ? decodeURIComponent(parts[1]) : url;
};