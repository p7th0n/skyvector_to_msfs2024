import { Waypoint, FlightPlan, ConversionError, PlnResult } from './types.js';

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

  static formatMsfsWorldPosition(latitude: number, longitude: number, altitude: number = 0): string {
    // Convert decimal degrees to MSFS 2024 format: N40° 32' 9.9996",W77° 23' 9.9996",+000000.00
    
    // Latitude formatting
    const latAbs = Math.abs(latitude);
    const latDeg = Math.floor(latAbs);
    const latMinFloat = (latAbs - latDeg) * 60;
    const latMin = Math.floor(latMinFloat);
    const latSec = (latMinFloat - latMin) * 60;
    const latHemisphere = latitude >= 0 ? 'N' : 'S';
    
    // Longitude formatting  
    const lonAbs = Math.abs(longitude);
    const lonDeg = Math.floor(lonAbs);
    const lonMinFloat = (lonAbs - lonDeg) * 60;
    const lonMin = Math.floor(lonMinFloat);
    const lonSec = (lonMinFloat - lonMin) * 60;
    const lonHemisphere = longitude >= 0 ? 'E' : 'W';
    
    // Altitude formatting (always positive with + sign and 2 decimal places)
    const altFormatted = `+${Math.abs(altitude).toFixed(2).padStart(9, '0')}`;
    
    return `${latHemisphere}${latDeg}° ${latMin}' ${latSec.toFixed(4)}",${lonHemisphere}${lonDeg}° ${lonMin}' ${lonSec.toFixed(4)}",${altFormatted}`;
  }
  
  static generatePln(waypoints: Waypoint[]): PlnResult {
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
      '',
      '<SimBase.Document>',
      '    <FlightPlan.FlightPlan>',
      `        <DepartureID>${this.escapeXml(departureId)}</DepartureID>`,
      `        <DestinationID>${this.escapeXml(arrivalId)}</DestinationID>`,
      `        <Title>${this.escapeXml(departureId)} - ${this.escapeXml(arrivalId)}</Title>`,
      `        <Descr>Flight from ${this.escapeXml(departureId)} to ${this.escapeXml(arrivalId)}</Descr>`,
      '        <FPType>VFR</FPType>',
      '        <CruisingAlt>3500.000</CruisingAlt>',
      '        <AppVersion>',
      '            <AppVersionMajor>12</AppVersionMajor>',
      '            <AppVersionMinor>2</AppVersionMinor>',
      '            <AppVersionBuild>282174</AppVersionBuild>',
      '        </AppVersion>'
    ];
    
    // Generate GPS waypoints only (airports are handled via departure/destination)
    const gpsWaypoints = waypoints.filter(wp => wp.type === 'GPS' && wp.latitude !== undefined && wp.longitude !== undefined);
    
    gpsWaypoints.forEach((waypoint) => {
      if (waypoint.latitude !== undefined && waypoint.longitude !== undefined) {
        // Generate waypoint ID based on coordinates (similar to MSFS format)
        const latDeg = Math.floor(Math.abs(waypoint.latitude));
        const lonDeg = Math.floor(Math.abs(waypoint.longitude));
        const latHem = waypoint.latitude >= 0 ? 'N' : 'S';
        const lonHem = waypoint.longitude >= 0 ? 'E' : 'W';
        const waypointId = `${latDeg.toString().padStart(4, '0')}${latHem}${lonDeg.toString().padStart(3, '0')}${lonHem}`;
        
        const worldPosition = this.formatMsfsWorldPosition(waypoint.latitude, waypoint.longitude, 0);
        
        lines.push(`        <ATCWaypoint id="${waypointId}">`);
        lines.push('            <ATCWaypointType>User</ATCWaypointType>');
        lines.push(`            <WorldPosition>${worldPosition}</WorldPosition>`);
        lines.push('            <ICAO>');
        lines.push('                <ICAORegion>LL</ICAORegion>');
        lines.push(`                <ICAOIdent>${waypointId.substring(0, 7)}</ICAOIdent>`);
        lines.push('            </ICAO>');
        lines.push('        </ATCWaypoint>');
      }
    });
    
    lines.push('    </FlightPlan.FlightPlan>');
    lines.push('</SimBase.Document>');
    lines.push('');
    
    return {
      content: lines.join('\n'),
      departureId,
      arrivalId
    };
  }
}