import { describe, it, expect } from 'vitest';
import { InputValidator } from '../validation.js';

describe('InputValidator', () => {
  describe('validateRouteInput', () => {
    it('should pass valid routes', () => {
      const validRoutes = [
        'P34 403210N0772310W N68',
        'KLAX 403210N 0772310W KORD',
        'LAX SFO',
        'KLAX 340000N 1180000W KORD',
        'P34 403210N0772310W 402507N0773505W 401034N0774923W N68'  // Original test case
      ];

      validRoutes.forEach(route => {
        const errors = InputValidator.validateRouteInput(route);
        expect(errors, `Route should be valid: ${route}`).toHaveLength(0);
      });
    });

    it('should reject empty input', () => {
      const errors = InputValidator.validateRouteInput('');
      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toContain('empty');
    });

    it('should reject single waypoint', () => {
      const errors = InputValidator.validateRouteInput('KLAX');
      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toContain('at least 2 waypoints');
    });

    it('should detect invalid coordinate formats', () => {
      const errors = InputValidator.validateRouteInput('KLAX 40321N KORD');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.message).toContain('Invalid coordinate format');
    });

    it('should detect invalid minutes/seconds', () => {
      const errors = InputValidator.validateRouteInput('KLAX 406010N KORD');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.message).toContain('Invalid minutes');
    });

    it('should detect out of range coordinates', () => {
      const errors = InputValidator.validateRouteInput('KLAX 910000N KORD');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.message).toContain('Invalid latitude degrees');
    });

    it('should detect invalid waypoint names', () => {
      const errors = InputValidator.validateRouteInput('A VERYLONGWAYPOINTNAME');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('too short'))).toBe(true);
      expect(errors.some(e => e.message.includes('too long'))).toBe(true);
    });

    it('should detect waypoint names with invalid characters', () => {
      const errors = InputValidator.validateRouteInput('LAX KL@X');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.message).toContain('Invalid characters');
    });
  });

  describe('generateHelpfulErrorMessage', () => {
    it('should generate helpful error message with examples', () => {
      const errors = [
        { message: 'Invalid coordinate format at position 1: "40321N".' }
      ];
      
      const message = InputValidator.generateHelpfulErrorMessage(errors);
      
      expect(message).toContain('Found 1 error');
      expect(message).toContain('Format Examples');
      expect(message).toContain('Airport codes: P34, KLAX, N68');
      expect(message).toContain('Latitude: 403210N (40°32\'10"N)');
    });

    it('should handle multiple errors', () => {
      const errors = [
        { message: 'Error 1' },
        { message: 'Error 2' },
        { message: 'Error 3' }
      ];
      
      const message = InputValidator.generateHelpfulErrorMessage(errors);
      expect(message).toContain('Found 3 errors');
      expect(message).toContain('1. Error 1');
      expect(message).toContain('2. Error 2');
      expect(message).toContain('3. Error 3');
    });

    it('should return empty string for no errors', () => {
      const message = InputValidator.generateHelpfulErrorMessage([]);
      expect(message).toBe('');
    });
  });
});