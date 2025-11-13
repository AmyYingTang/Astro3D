import { useState, useMemo } from 'react';
import { convertRA, convertDEC } from '../utils/coordinates';

/**
 * 天体过滤Hook
 * 根据RA和DEC范围过滤天体数据
 */
export function useCelestialFilter(data) {
  const [filters, setFilters] = useState({
    ra: [0, 24],      // RA范围 (小时)
    dec: [-90, 90]    // DEC范围 (度)
  });

  // 过滤后的数据
  const filteredData = useMemo(() => {
    if (!data?.length) return [];

    return data.filter(obj => {
      // 转换RA为小时 (0-24h)
      const raString = obj.ra;
      const raDeg = convertRA(raString);
      const raHours = raDeg / 15; // 度转小时

      // 转换DEC为度 (-90 to +90)
      const decString = obj.dec;
      const decDeg = convertDEC(decString);

      // 检查是否在范围内
      const raInRange = raHours >= filters.ra[0] && raHours <= filters.ra[1];
      const decInRange = decDeg >= filters.dec[0] && decDeg <= filters.dec[1];

      return raInRange && decInRange;
    });
  }, [data, filters]);

  return {
    filters,
    setFilters,
    filteredData,
    totalCount: data?.length || 0,
    filteredCount: filteredData.length
  };
}
