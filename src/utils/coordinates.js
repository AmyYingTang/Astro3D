import * as THREE from "three";

// export const convertRA = (raString) => {
//   // 处理格式: "05h 23m 34s"
//   const match = raString.match(/(\d+)h\s*(\d+)m\s*(\d+)s/);
//   if (!match) return 0;
  
//   const hours = parseInt(match[1]);
//   const minutes = parseInt(match[2]);
//   const seconds = parseInt(match[3]);
  
//   // 转换为度数 (小时 * 15 + 分钟 * 0.25 + 秒 * 0.00416667)
//   return hours * 15 + minutes * 0.25 + seconds * 0.004166667;
// };

// export const convertDEC = (decString) => {
//   // 处理格式: "-69° 45' 22"" 或 "+41° 16' 09""
//   const match = decString.match(/([+-]?\d+)°\s*(\d+)'\s*(\d+)/);
//   if (!match) return 0;
  
//   const degrees = parseInt(match[1]);
//   const minutes = parseInt(match[2]);
//   const seconds = parseInt(match[3]);
  
//   const isNegative = degrees < 0;
//   const decimal = Math.abs(degrees) + minutes / 60 + seconds / 3600;
  
//   return (isNegative ? -decimal : decimal);
// };
export const convertRA = (raString) => {
  if (!raString || typeof raString !== "string") return 0;

  // 规范化：把多个分隔符统一为空格，去掉多余字符
  const s = raString.trim().replace(/[:/]+/g, ' ').replace(/[^\dhms.\s]/ig, (m) => (m === 'h' || m === 'm' || m === 's' ? m : ' '));

  // 支持多种形式：
  // 1) "05h 23m 34s"
  // 2) "05:23:34" 或 "05 23 34"
  // 3) "05h 23m" (缺秒) -> seconds = 0
  // 4) "5h" (只有小时)
  const re = /(\d{1,2})\s*h(?:\s*(\d{1,2})\s*m)?(?:\s*(\d{1,2}(?:\.\d+)?)\s*s?)?/i;
  const re2 = /(\d{1,2})\s+(\d{1,2})(?:\s+(\d{1,2}(?:\.\d+)?))?/; // "05 23 34" or "05 23"
  let hours = 0, minutes = 0, seconds = 0;

  const m = s.match(re);
  if (m) {
    hours = parseInt(m[1], 10) || 0;
    minutes = parseInt(m[2] || "0", 10) || 0;
    seconds = parseFloat(m[3] || "0") || 0;
  } else {
    const m2 = s.match(re2);
    if (m2) {
      hours = parseInt(m2[1], 10) || 0;
      minutes = parseInt(m2[2] || "0", 10) || 0;
      seconds = parseFloat(m2[3] || "0") || 0;
    } else {
      // 最后尝试纯数字（当作小时）
      const num = parseFloat(s);
      if (!Number.isNaN(num)) hours = num;
      else return 0;
    }
  }

  // RA: 1 hour = 15 degrees; 1 minute = 0.25 deg; 1 second = 0.0041666667 deg
  const deg = hours * 15 + minutes * 0.25 + seconds * (15 / 3600);
  return deg;
};

export const convertDEC = (decString) => {
  if (!decString || typeof decString !== "string") return 0;

  // 规范化输入，替换中文符号，允许 "° ' \" ”" 等
  const s = decString
    .trim()
    .replace(/＋/g, '+')
    .replace(/－/g, '-')
    .replace(/”/g, '"')
    .replace(/′/g, "'")
    .replace(/″/g, '"');

  // 支持形式：
  // 1) "+41° 16' 09\"" 或 "-69° 45' 22\""
  // 2) "41 16 09" 或 "41:16:09"
  // 3) "41° 16'" (缺秒)
  // 4) "41" (只有度)
  const re = /([+-]?\d{1,3})\s*°?\s*(\d{1,2})?\s*['′]?\s*(\d{1,2}(?:\.\d+)?)?\s*(?:["″])?/;
  const re2 = /([+-]?\d{1,3})[:\s]\s*(\d{1,2})?(?:[:\s]\s*(\d{1,2}(?:\.\d+)?))?/;
  let degrees = 0, minutes = 0, seconds = 0;

  let m = s.match(re);
  if (m && m[1] !== undefined) {
    degrees = parseInt(m[1], 10) || 0;
    minutes = parseInt(m[2] || "0", 10) || 0;
    seconds = parseFloat(m[3] || "0") || 0;
  } else {
    const m2 = s.match(re2);
    if (m2 && m2[1] !== undefined) {
      degrees = parseInt(m2[1], 10) || 0;
      minutes = parseInt(m2[2] || "0", 10) || 0;
      seconds = parseFloat(m2[3] || "0") || 0;
    } else {
      const num = parseFloat(s);
      if (!Number.isNaN(num)) return num;
      return 0;
    }
  }

  const sign = degrees < 0 ? -1 : 1;
  const absDeg = Math.abs(degrees);
  const decimal = absDeg + (minutes || 0) / 60 + (seconds || 0) / 3600;
  return sign * decimal;
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