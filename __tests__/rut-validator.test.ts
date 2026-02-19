import { describe, it, expect } from 'vitest';
import { validateRUT, formatRUT, cleanRUT } from '@/lib/utils/rut-validator';

describe('RUT Validator', () => {
  describe('validateRUT', () => {
    it('valida RUTs correctos', () => {
      expect(validateRUT('12.345.678-5')).toBe(true);
      expect(validateRUT('11.111.111-1')).toBe(true);
    });

    it('rechaza RUTs inválidos', () => {
      expect(validateRUT('12.345.678-9')).toBe(false);
      expect(validateRUT('11.111.111-2')).toBe(false);
      expect(validateRUT('invalid')).toBe(false);
      expect(validateRUT('')).toBe(false);
    });

    it('valida RUTs sin formato', () => {
      expect(validateRUT('123456785')).toBe(true);
      expect(validateRUT('111111111')).toBe(true);
    });
  });

  describe('formatRUT', () => {
    it('formatea correctamente RUTs', () => {
      expect(formatRUT('123456785')).toBe('12.345.678-5');
      expect(formatRUT('111111111')).toBe('11.111.111-1');
      expect(formatRUT('1111111K')).toBe('1.111.111-K');
    });

    it('mantiene formato si ya está formateado', () => {
      expect(formatRUT('12.345.678-5')).toBe('12.345.678-5');
    });

    it('maneja inputs vacíos o inválidos', () => {
      expect(formatRUT('')).toBe('');
      expect(formatRUT('abc')).toBeDefined();
    });
  });

  describe('cleanRUT', () => {
    it('limpia formato de RUT', () => {
      expect(cleanRUT('12.345.678-5')).toBe('123456785');
      expect(cleanRUT('11.111.111-1')).toBe('111111111');
    });

    it('retorna string limpio sin puntos ni guión', () => {
      const cleaned = cleanRUT('1.234.567-8');
      expect(cleaned).not.toContain('.');
      expect(cleaned).not.toContain('-');
    });
  });
});
