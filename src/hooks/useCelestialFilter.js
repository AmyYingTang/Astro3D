import { useState, useMemo } from 'react';
import { convertRA, convertDEC } from '../utils/coordinates';

/**
 * 天体过滤Hook
 * 根据多个条件过滤天体数据
 */
export function useCelestialFilter(data) {
  const [filters, setFilters] = useState({
    ra: [0, 24],
    dec: [-90, 90],
    nameSearch: '',
    types: [],
    filters: []
  });

  // 提取可用选项
  const availableOptions = useMemo(() => {
    if (!data?.length) return { types: [], filters: [] };

    const types = new Set();
    const filterSet = new Set();

    data.forEach(obj => {
      if (obj.type) types.add(obj.type);
      if (obj.filter) {
        // 处理多个滤镜，用逗号或顿号分隔
        obj.filter.split(/[,，、]/).forEach(f => {
          const trimmed = f.trim();
          if (trimmed) filterSet.add(trimmed);
        });
      }
      
    });

    return {
      types: Array.from(types).sort(),
      filters: Array.from(filterSet).sort(),
      
    };
  }, [data]);

  // 通配符匹配函数
  const wildcardMatch = (text, pattern) => {
    if (!pattern) return true;
    
    // 转换通配符为正则表达式
    const regexPattern = pattern
      .toLowerCase()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
      .replace(/\\\*/g, '.*'); // * 变成 .*
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(text.toLowerCase());
  };

  // 过滤后的数据
  const filteredData = useMemo(() => {
    if (!data?.length) return [];

    return data.filter(obj => {
      // RA过滤
      const raString = obj.ra;
      const raDeg = convertRA(raString);
      const raHours = raDeg / 15;
      const raInRange = raHours >= filters.ra[0] && raHours <= filters.ra[1];
      if (!raInRange) return false;

      // DEC过滤
      const decString = obj.dec;
      const decDeg = convertDEC(decString);
      const decInRange = decDeg >= filters.dec[0] && decDeg <= filters.dec[1];
      if (!decInRange) return false;

      // 名称搜索（支持通配符）
      if (filters.nameSearch) {
        const nameMatch = wildcardMatch(obj.name || '', filters.nameSearch);
        if (!nameMatch) return false;
      }

      // 天体类型过滤
      if (filters.types.length > 0) {
        if (!obj.type || !filters.types.includes(obj.type)) {
          return false;
        }
      }

      // 滤镜过滤（任意匹配）
      if (filters.filters.length > 0) {
        if (!obj.filter) return false;
        const objFilters = obj.filter.split(/[,，、]/).map(f => f.trim());
        const hasMatch = filters.filters.some(selectedFilter => 
          objFilters.some(objFilter => objFilter.includes(selectedFilter))
        );
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [data, filters]);

  return {
    filters,
    setFilters,
    filteredData,
    totalCount: data?.length || 0,
    filteredCount: filteredData.length,
    availableTypes: availableOptions.types,
    availableFilters: availableOptions.filters
  };
}
