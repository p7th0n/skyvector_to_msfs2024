import { describe, it, expect } from 'vitest';
import { CoordinateConverter, RouteParser, PlnGenerator } from '../converter.js';

describe('CoordinateConverter', () => {
  describe('skyVectorToDecimal', () => {
    it('should convert latitude coordinates correctly', () => {
      expect(CoordinateConverter.skyVectorToDecimal('403210N')).toBe(40.536111);
      expect(CoordinateConverter.skyVectorToDecimal('402507N')).toBe(40.418611);
      expect(CoordinateConverter.skyVectorToDecimal('401034S')).toBe(-40.176111);
    });

    it('should convert longitude coordinates correctly', () => {
      expect(CoordinateConverter.skyVectorToDecimal('0772310W')).toBe(-77.386111);
      expect(CoordinateConverter.skyVectorToDecimal('0773505W')).toBe(-77.584722);
      expect(CoordinateConverter.skyVectorToDecimal('1203000E')).toBe(120.5);
    });

    it('should throw error for invalid format', () => {
      expect(() => CoordinateConverter.skyVectorToDecimal('invalid')).toThrow();
      expect(() => CoordinateConverter.skyVectorToDecimal('40321')).toThrow();
      expect(() => CoordinateConverter.skyVectorToDecimal('403210X')).toThrow();
    });

    it('should throw error for invalid minutes/seconds', () => {
      expect(() => CoordinateConverter.skyVectorToDecimal('406010N')).toThrow('Invalid minutes/seconds');
      expect(() => CoordinateConverter.skyVectorToDecimal('403260N')).toThrow('Invalid minutes/seconds');
    });

    it('should throw error for out of range coordinates', () => {
      expect(() => CoordinateConverter.skyVectorToDecimal('910000N')).toThrow('Latitude degrees out of range');
      expect(() => CoordinateConverter.skyVectorToDecimal('1810000W')).toThrow('Longitude degrees out of range');
    });
  });
});

describe('RouteParser', () => {
  describe('parseSourceRoute', () => {
    it('should parse mixed route with named waypoints and coordinates', () => {
      const route = 'P34 403210N0772310W 402507N0773505W N68';
      const waypoints = RouteParser.parseSourceRoute(route);
      
      expect(waypoints).toHaveLength(4);
      
      expect(waypoints[0]).toEqual({
        type: 'NAMED',
        name: 'P34'
      });
      
      expect(waypoints[1]).toEqual({
        type: 'GPS',
        latitude: 40.536111,
        longitude: -77.386111
      });
      
      expect(waypoints[2]).toEqual({
        type: 'GPS',
        latitude: 40.418611,
        longitude: -77.584722
      });
      
      expect(waypoints[3]).toEqual({
        type: 'NAMED',
        name: 'N68'
      });
    });

    it('should parse separate lat/lon coordinates', () => {
      const route = 'KLAX 403210N 0772310W KORD';
      const waypoints = RouteParser.parseSourceRoute(route);
      
      expect(waypoints).toHaveLength(3);
      expect(waypoints[1]).toEqual({
        type: 'GPS',
        latitude: 40.536111,
        longitude: -77.386111
      });
    });

    it('should handle empty input', () => {
      const waypoints = RouteParser.parseSourceRoute('');
      expect(waypoints).toHaveLength(0);
    });

    it('should handle only named waypoints', () => {
      const route = 'KLAX KORD KJFK';
      const waypoints = RouteParser.parseSourceRoute(route);
      
      expect(waypoints).toHaveLength(3);
      expect(waypoints.every(wp => wp.type === 'NAMED')).toBe(true);
    });

    it('should throw error for latitude without longitude', () => {
      expect(() => RouteParser.parseSourceRoute('KLAX 403210N')).toThrow('missing longitude');
    });

    it('should throw error for latitude followed by invalid longitude', () => {
      expect(() => RouteParser.parseSourceRoute('KLAX 403210N INVALID')).toThrow('not followed by valid longitude');
    });
  });
});

describe('PlnGenerator', () => {
  describe('escapeXml', () => {
    it('should escape XML characters', () => {
      expect(PlnGenerator.escapeXml('<test>')).toBe('&lt;test&gt;');
      expect(PlnGenerator.escapeXml('A&B')).toBe('A&amp;B');
      expect(PlnGenerator.escapeXml('"quote"')).toBe('&quot;quote&quot;');
    });
  });

  describe('generatePln', () => {
    it('should generate valid PLN XML for simple route', () => {
      const waypoints = [
        { type: 'NAMED' as const, name: 'P34' },
        { type: 'GPS' as const, latitude: 40.536111, longitude: -77.386111 },
        { type: 'NAMED' as const, name: 'N68' }
      ];
      
      const pln = PlnGenerator.generatePln(waypoints);
      
      expect(pln).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(pln).toContain('<Title>P34 to N68</Title>');
      expect(pln).toContain('<DepartureID>P34</DepartureID>');
      expect(pln).toContain('<DestinationID>N68</DestinationID>');
      expect(pln).toContain('<WorldPosition>40.536111,-77.386111,0</WorldPosition>');
      expect(pln).toContain('</SimBase.Document>');
    });

    it('should handle routes with only GPS coordinates', () => {
      const waypoints = [
        { type: 'GPS' as const, latitude: 40.536111, longitude: -77.386111 },
        { type: 'GPS' as const, latitude: 40.418611, longitude: -77.584722 }
      ];
      
      const pln = PlnGenerator.generatePln(waypoints);
      
      expect(pln).toContain('<Title>UNKNOWN to UNKNOWN</Title>');
      expect(pln).toContain('<DepartureID>UNKNOWN</DepartureID>');
      expect(pln).toContain('<DestinationID>UNKNOWN</DestinationID>');
    });

    it('should handle empty waypoint array', () => {
      const pln = PlnGenerator.generatePln([]);
      
      expect(pln).toContain('<Title>UNKNOWN to UNKNOWN</Title>');
      expect(pln).toContain('<DepartureLLA>0,0,0</DepartureLLA>');
    });
  });
});