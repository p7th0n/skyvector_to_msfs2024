import { describe, it, expect } from 'vitest';
import { FilenameUtils } from '../filename-utils.js';

describe('FilenameUtils', () => {
  describe('generateFlightPlanFilename', () => {
    it('should generate filename with standard airport codes', () => {
      const filename = FilenameUtils.generateFlightPlanFilename('P34', 'N68');
      expect(filename).toBe('P34_N68_sv2msfs2024.pln');
    });

    it('should handle longer airport codes', () => {
      const filename = FilenameUtils.generateFlightPlanFilename('KLAX', 'KORD');
      expect(filename).toBe('KLAX_KORD_sv2msfs2024.pln');
    });

    it('should handle UNKNOWN airports', () => {
      const filename = FilenameUtils.generateFlightPlanFilename('UNKNOWN', 'UNKNOWN');
      expect(filename).toBe('UNKNOWN_UNKNOWN_sv2msfs2024.pln');
    });

    it('should sanitize airport codes with special characters', () => {
      const filename = FilenameUtils.generateFlightPlanFilename('P-34', 'N/68');
      expect(filename).toBe('P34_N68_sv2msfs2024.pln');
    });

    it('should handle lowercase codes', () => {
      const filename = FilenameUtils.generateFlightPlanFilename('klax', 'kord');
      expect(filename).toBe('KLAX_KORD_sv2msfs2024.pln');
    });

    it('should truncate very long airport codes', () => {
      const filename = FilenameUtils.generateFlightPlanFilename('VERYLONGAIRPORTCODE', 'ANOTHERLONGCODE');
      expect(filename).toBe('VERYLONG_ANOTHERL_sv2msfs2024.pln');
    });
  });

  describe('validateAndSanitizeFilename', () => {
    it('should validate correct PLN filename', () => {
      const result = FilenameUtils.validateAndSanitizeFilename('P34_N68_sv2msfs2024.pln');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('P34_N68_sv2msfs2024.pln');
      expect(result.errors).toHaveLength(0);
    });

    it('should add PLN extension if missing', () => {
      const result = FilenameUtils.validateAndSanitizeFilename('P34_N68_sv2msfs2024');
      expect(result.sanitized).toBe('P34_N68_sv2msfs2024.pln');
    });

    it('should replace non-PLN extension', () => {
      const result = FilenameUtils.validateAndSanitizeFilename('P34_N68_sv2msfs2024.txt');
      expect(result.sanitized).toBe('P34_N68_sv2msfs2024.pln');
    });

    it('should sanitize invalid characters', () => {
      const result = FilenameUtils.validateAndSanitizeFilename('P34<>N68|test?.pln');
      expect(result.isValid).toBe(false);
      expect(result.sanitized).toBe('P34__N68_test_.pln');
      expect(result.errors).toContain('Filename contains invalid characters');
    });

    it('should handle empty filename', () => {
      const result = FilenameUtils.validateAndSanitizeFilename('');
      expect(result.isValid).toBe(false);
      expect(result.sanitized).toBe('flightplan.pln');
      expect(result.errors).toContain('Filename cannot be empty');
    });

    it('should handle only extension', () => {
      const result = FilenameUtils.validateAndSanitizeFilename('.pln');
      expect(result.isValid).toBe(false);
      expect(result.sanitized).toBe('flightplan.pln');
      expect(result.errors).toContain('Filename cannot be empty');
    });

    it('should handle reserved Windows names', () => {
      const result = FilenameUtils.validateAndSanitizeFilename('CON.pln');
      expect(result.isValid).toBe(false);
      expect(result.sanitized).toBe('CON_flight.pln');
      expect(result.errors).toContain('Filename uses a reserved name');
    });

    it('should handle very long filenames', () => {
      const longName = 'A'.repeat(250) + '.pln';
      const result = FilenameUtils.validateAndSanitizeFilename(longName);
      expect(result.isValid).toBe(false);
      expect(result.sanitized).toBe('A'.repeat(200) + '.pln');
      expect(result.errors).toContain('Filename is too long');
    });

    it('should trim whitespace', () => {
      const result = FilenameUtils.validateAndSanitizeFilename('  P34_N68.pln  ');
      expect(result.sanitized).toBe('P34_N68.pln');
    });
  });

  describe('getFilenameWithoutExtension', () => {
    it('should remove PLN extension', () => {
      const result = FilenameUtils.getFilenameWithoutExtension('P34_N68_sv2msfs2024.pln');
      expect(result).toBe('P34_N68_sv2msfs2024');
    });

    it('should return filename unchanged if no PLN extension', () => {
      const result = FilenameUtils.getFilenameWithoutExtension('P34_N68_sv2msfs2024.txt');
      expect(result).toBe('P34_N68_sv2msfs2024.txt');
    });

    it('should handle filename without extension', () => {
      const result = FilenameUtils.getFilenameWithoutExtension('P34_N68_sv2msfs2024');
      expect(result).toBe('P34_N68_sv2msfs2024');
    });
  });
});