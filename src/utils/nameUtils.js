/**
 * Localization utilities for CSV data that contains bilingual content
 */

// Chinese celestial type → English mapping
const typeMap = {
  '矮星系': 'Dwarf Galaxy',
  '发射星云': 'Emission Nebula',
  '反射星云': 'Reflection Nebula',
  '暗星云': 'Dark Nebula',
  '行星状星云': 'Planetary Nebula',
  '超新星遗迹': 'Supernova Remnant',
  '球状星团': 'Globular Cluster',
  '疏散星团': 'Open Cluster',
  '旋涡星系': 'Spiral Galaxy',
  '棒旋星系': 'Barred Spiral Galaxy',
  '不规则星系': 'Irregular Galaxy',
  '透镜状星系': 'Lenticular Galaxy'
};

// Chinese filter terms → English mapping
const filterMap = {
  'Ha(氢阿尔法)': 'Ha',
  'OIII(氧III)': 'OIII',
  'SII(硫II)': 'SII',
  'L(宽带亮度)': 'L (Luminance)',
  'RGB(宽彩)': 'RGB',
  '无滤镜': 'No Filter'
};

/**
 * Extract display name based on language.
 * Format: "NGC 2736 - 铅笔星云 - Pencil Nebula"
 * Returns: "NGC 2736 - Pencil Nebula" for en, full name for zh
 */
export function getDisplayName(fullName, lang) {
  if (!fullName) return '';
  const parts = fullName.split(' - ');
  if (parts.length === 3) {
    const [catalog, , enName] = parts.map(p => p.trim());
    return lang === 'en' ? `${catalog} - ${enName}` : `${parts[0].trim()} - ${parts[1].trim()}`;
  }
  return fullName;
}

/**
 * Extract short label name (for 3D labels).
 * Full name: "NGC 2736 - 铅笔星云 - Pencil Nebula"
 * Short: "NGC 2736" (same for both languages)
 */
export function getShortName(fullName) {
  if (!fullName) return '';
  return fullName.split('-')[0].trim();
}

/**
 * Localize constellation field.
 * Format: "狐狸座 - Vulpecula"
 */
export function getConstellation(constel, lang) {
  if (!constel) return '';
  const parts = constel.split(' - ');
  if (parts.length === 2) {
    return lang === 'en' ? parts[1].trim() : parts[0].trim();
  }
  return constel;
}

/**
 * Localize celestial type.
 */
export function getType(type, lang) {
  if (!type || lang !== 'en') return type || '';
  return typeMap[type] || type;
}

/**
 * Localize filter string.
 * Input: "Ha(氢阿尔法), OIII(氧III)"
 */
export function getFilter(filter, lang) {
  if (!filter || lang !== 'en') return filter || '';
  return filter.split(',').map(f => {
    const trimmed = f.trim();
    return filterMap[trimmed] || trimmed;
  }).join(', ');
}

/**
 * Localize summary - returns original for zh, empty hint for en
 * (no English translation available in CSV)
 */
export function getSummary(summary, lang) {
  if (!summary) return '';
  if (lang === 'en') return '—';
  return summary;
}

/**
 * Localize angular diameter units.
 * Input: "8×6角分", "62×47角秒", "120角秒", "36角分"
 * Output (en): "8×6'", "62×47″", "120″", "36'"
 */
export function getAngularDiameter(angDia, lang) {
  if (!angDia || lang !== 'en') return angDia || '';
  return angDia.replace(/角分/g, "'").replace(/角秒/g, '″');
}
