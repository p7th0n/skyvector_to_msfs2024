import { Waypoint, FlightPlan, ConversionError } from './types.js';

const LAT_REGEX = /^(\d{2})(\d{2})(\d{2})([NS])$/;
const LON_REGEX = /^(\d{3})(\d{2})(\d{2})([EW])$/;
const COMBO_REGEX = /^(\d{6}[NS]\d{7}[EW])$/;

export class CoordinateConverter {
  static skyVectorToDecimal(coord: string): number {
    const latMatch = coord.match(LAT_REGEX);
    const lonMatch = coord.match(LON_REGEX);
    
    if (!latMatch && !lonMatch) {
      throw new Error(`Invalid coordinate format: ${coord}`);
    }
    
    const match = latMatch || lonMatch;
    if (!match) {
      throw new Error(`Invalid coordinate format: ${coord}`);
    }
    
    const [, degStr, minStr, secStr, hemisphere] = match;
    if (!degStr || !minStr || !secStr || !hemisphere) {
      throw new Error(`Invalid coordinate format: ${coord}`);
    }
    const deg = parseInt(degStr, 10);
    const minutes = parseInt(minStr, 10);
    const seconds = parseInt(secStr, 10);
    
    if (minutes >= 60 || seconds >= 60) {
      throw new Error(`Invalid minutes/seconds in coordinate: ${coord}`);
    }
    
    if (latMatch && (deg > 90)) {
      throw new Error(`Latitude degrees out of range: ${coord}`);
    }
    
    if (lonMatch && (deg > 180)) {
      throw new Error(`Longitude degrees out of range: ${coord}`);
    }
    
    let decimal = deg + minutes / 60 + seconds / 3600;
    
    if (hemisphere === 'S' || hemisphere === 'W') {
      decimal = -decimal;
    }
    
    return Math.round(decimal * 1000000) / 1000000;
  }
}

export class RouteParser {
  static parseSourceRoute(text: string): Waypoint[] {
    const tokens = text.trim().split(/\s+/);
    const waypoints: Waypoint[] = [];
    let i = 0;
    
    while (i < tokens.length) {
      const token = tokens[i]?.trim();
      if (!token) {
        i++;
        continue;
      }
      
      if (COMBO_REGEX.test(token)) {
        const lat = token.substring(0, 7);
        const lon = token.substring(7);
        const latDecimal = CoordinateConverter.skyVectorToDecimal(lat);
        const lonDecimal = CoordinateConverter.skyVectorToDecimal(lon);
        waypoints.push({
          type: 'GPS',
          latitude: latDecimal,
          longitude: lonDecimal
        });
        i++;
        continue;
      }
      
      if (LAT_REGEX.test(token)) {
        if (i + 1 >= tokens.length) {
          throw new Error(`Latitude '${token}' missing longitude`);
        }
        const lonToken = tokens[i + 1]?.trim();
        if (!lonToken || !LON_REGEX.test(lonToken)) {
          throw new Error(`Latitude '${token}' not followed by valid longitude`);
        }
        const latDecimal = CoordinateConverter.skyVectorToDecimal(token);
        const lonDecimal = CoordinateConverter.skyVectorToDecimal(lonToken);
        waypoints.push({
          type: 'GPS',
          latitude: latDecimal,
          longitude: lonDecimal
        });
        i += 2;
        continue;
      }
      
      waypoints.push({
        type: 'NAMED',
        name: token.toUpperCase()
      });
      i++;
    }
    
    return waypoints;
  }
}

export class PlnGenerator {
  static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  
  static generatePln(waypoints: Waypoint[]): string {
    const namedWaypoints = waypoints.filter(wp => wp.type === 'NAMED');
    
    const departureId = namedWaypoints[0]?.name || 'UNKNOWN';
    const arrivalId = namedWaypoints[namedWaypoints.length - 1]?.name || 'UNKNOWN';
    
    // Find coordinates for departure and arrival airports
    // Look for GPS coordinates near the first and last named waypoints
    const firstWaypoint = waypoints[0];
    const lastWaypoint = waypoints[waypoints.length - 1];
    
    let departureLLA = '0,0,0';
    let destinationLLA = '0,0,0';
    
    // For departure: use first waypoint if it's GPS, otherwise look for next GPS coordinate
    if (firstWaypoint?.type === 'GPS' && firstWaypoint.latitude !== undefined && firstWaypoint.longitude !== undefined) {
      departureLLA = `${firstWaypoint.latitude},${firstWaypoint.longitude},0`;
    } else {
      const firstGps = waypoints.find(wp => wp.type === 'GPS' && wp.latitude !== undefined && wp.longitude !== undefined);
      if (firstGps && firstGps.latitude !== undefined && firstGps.longitude !== undefined) {
        departureLLA = `${firstGps.latitude},${firstGps.longitude},0`;
      }
    }
    
    // For destination: use last waypoint if it's GPS, otherwise look for previous GPS coordinate  
    if (lastWaypoint?.type === 'GPS' && lastWaypoint.latitude !== undefined && lastWaypoint.longitude !== undefined) {
      destinationLLA = `${lastWaypoint.latitude},${lastWaypoint.longitude},0`;
    } else {
      const gpsWaypoints = waypoints.filter(wp => wp.type === 'GPS' && wp.latitude !== undefined && wp.longitude !== undefined);
      const lastGps = gpsWaypoints[gpsWaypoints.length - 1];
      if (lastGps && lastGps.latitude !== undefined && lastGps.longitude !== undefined) {
        destinationLLA = `${lastGps.latitude},${lastGps.longitude},0`;
      }
    }
    
    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<SimBase.Document Type="AceXML" version="2,0">',
      '  <Descr>FlightPlan</Descr>',
      '  <FlightPlan.FlightPlan>',
      '    <AppVersion>',
      '      <AppVersionMajor>1</AppVersionMajor>',
      '      <AppVersionMinor>0</AppVersionMinor>',
      '    </AppVersion>',
      `    <Title>${this.escapeXml(departureId)} to ${this.escapeXml(arrivalId)}</Title>`,
      '    <FPType>VFR</FPType>',
      '    <RouteType>Direct</RouteType>',
      '    <CruisingAlt>3500</CruisingAlt>',
      `    <DepartureID>${this.escapeXml(departureId)}</DepartureID>`,
      `    <DepartureLLA>${departureLLA}</DepartureLLA>`,
      `    <DestinationID>${this.escapeXml(arrivalId)}</DestinationID>`,
      `    <DestinationLLA>${destinationLLA}</DestinationLLA>`,
      '    <ATCWaypointList>'
    ];
    
    waypoints.forEach((waypoint, index) => {
      if (waypoint.type === 'NAMED' && waypoint.name) {
        // Find coordinates for this airport waypoint
        let airportCoords = this.findCoordsForAirport(waypoints, index);
        
        lines.push(`      <ATCWaypoint id="${this.escapeXml(waypoint.name)}">`);
        lines.push('        <ATCWaypointType>Airport</ATCWaypointType>');
        lines.push(`        <WorldPosition>${airportCoords}</WorldPosition>`);
        lines.push('        <ICAO>');
        lines.push(`          <ICAOIdent>${this.escapeXml(waypoint.name)}</ICAOIdent>`);
        lines.push('        </ICAO>');
        lines.push('      </ATCWaypoint>');
      } else if (waypoint.type === 'GPS' && waypoint.latitude !== undefined && waypoint.longitude !== undefined) {
        lines.push(`      <ATCWaypoint id="WP${index + 1}">`);
        lines.push('        <ATCWaypointType>User</ATCWaypointType>');
        lines.push(`        <WorldPosition>${waypoint.latitude},${waypoint.longitude},0</WorldPosition>`);
        lines.push('      </ATCWaypoint>');
      }
    });
    
    lines.push('    </ATCWaypointList>');
    lines.push('  </FlightPlan.FlightPlan>');
    lines.push('</SimBase.Document>');
    
    return lines.join('\n');
  }

  private static findCoordsForAirport(waypoints: Waypoint[], airportIndex: number): string {
    // Strategy: Look for GPS coordinates near this airport waypoint
    // 1. Check immediately after this airport
    // 2. Check immediately before this airport  
    // 3. If first airport, use first GPS coordinate found
    // 4. If last airport, use last GPS coordinate found
    // 5. Default to 0,0,0 if no GPS coordinates available

    // Check next waypoint
    if (airportIndex + 1 < waypoints.length) {
      const nextWp = waypoints[airportIndex + 1];
      if (nextWp?.type === 'GPS' && nextWp.latitude !== undefined && nextWp.longitude !== undefined) {
        return `${nextWp.latitude},${nextWp.longitude},0`;
      }
    }

    // Check previous waypoint
    if (airportIndex > 0) {
      const prevWp = waypoints[airportIndex - 1];
      if (prevWp?.type === 'GPS' && prevWp.latitude !== undefined && prevWp.longitude !== undefined) {
        return `${prevWp.latitude},${prevWp.longitude},0`;
      }
    }

    // If this is the first waypoint, use first available GPS coordinate
    if (airportIndex === 0) {
      const firstGps = waypoints.find(wp => wp.type === 'GPS' && wp.latitude !== undefined && wp.longitude !== undefined);
      if (firstGps && firstGps.latitude !== undefined && firstGps.longitude !== undefined) {
        return `${firstGps.latitude},${firstGps.longitude},0`;
      }
    }

    // If this is the last waypoint, use last available GPS coordinate
    if (airportIndex === waypoints.length - 1) {
      const gpsWaypoints = waypoints.filter(wp => wp.type === 'GPS' && wp.latitude !== undefined && wp.longitude !== undefined);
      const lastGps = gpsWaypoints[gpsWaypoints.length - 1];
      if (lastGps && lastGps.latitude !== undefined && lastGps.longitude !== undefined) {
        return `${lastGps.latitude},${lastGps.longitude},0`;
      }
    }

    // Default fallback
    return '0,0,0';
  }
}