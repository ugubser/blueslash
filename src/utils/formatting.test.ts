import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, formatNumber, formatGems } from './formatting';

describe('formatDate', () => {
  it('should format a Date object', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = formatDate(date);
    expect(result).toContain('1/15/2024');
  });

  it('should handle null/undefined', () => {
    expect(formatDate(null)).toBe('N/A');
    expect(formatDate(undefined)).toBe('N/A');
  });

  it('should format a string date', () => {
    const result = formatDate('2024-01-15');
    expect(result).toContain('2024');
  });

  it('should handle invalid dates', () => {
    const result = formatDate('invalid-date');
    expect(result).toBe('Invalid Date');
  });
});

describe('formatDateTime', () => {
  it('should format a Date object with time', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = formatDateTime(date);
    expect(result).toMatch(/2024/);
  });

  it('should handle null/undefined', () => {
    expect(formatDateTime(null)).toBe('N/A');
    expect(formatDateTime(undefined)).toBe('N/A');
  });
});

describe('formatNumber', () => {
  it('should format numbers with thousands separators', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('should handle null/undefined', () => {
    expect(formatNumber(null)).toBe('0');
    expect(formatNumber(undefined)).toBe('0');
  });

  it('should format small numbers without separators', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('formatGems', () => {
  it('should pluralize correctly', () => {
    expect(formatGems(0)).toBe('0 gems');
    expect(formatGems(1)).toBe('1 gem');
    expect(formatGems(2)).toBe('2 gems');
    expect(formatGems(1000)).toBe('1,000 gems');
  });

  it('should include thousands separators', () => {
    expect(formatGems(5000)).toBe('5,000 gems');
  });
});
