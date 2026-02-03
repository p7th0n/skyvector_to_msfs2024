import { ConversionError } from './types.js';

export class ValidationError extends Error {
  constructor(
    message: string,
    public position?: number,
    public input?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class InputValidator {
  static validateRouteInput(input: string): ConversionError[] {
    const errors: ConversionError[] = [];
    const trimmedInput = input.trim();

    if (!trimmedInput) {
      errors.push({
        message: 'Input cannot be empty. Please provide a SkyVector route.',
      });
      return errors;
    }

    const tokens = trimmedInput.split(/\s+/);
    
    if (tokens.length < 2) {
      errors.push({
        message: 'Route must contain at least 2 waypoints (departure and arrival).',
      });
    }

    tokens.forEach((token, index) => {
      const tokenErrors = this.validateToken(token, index);
      errors.push(...tokenErrors);
    });

    return errors;
  }

  private static validateToken(token: string, position: number): ConversionError[] {
    const errors: ConversionError[] = [];
    
    if (!token || token.trim().length === 0) {
      return errors;
    }

    const cleanToken = token.trim();
    
    const latRegex = /^(\d{2})(\d{2})(\d{2})([NS])$/;
    const lonRegex = /^(\d{3})(\d{2})(\d{2})([EW])$/;
    const comboRegex = /^(\d{6}[NS]\d{7}[EW])$/;
    
    if (comboRegex.test(cleanToken)) {
      const lat = cleanToken.substring(0, 7);
      const lon = cleanToken.substring(7);
      
      const latErrors = this.validateCoordinate(lat, position, 'latitude');
      const lonErrors = this.validateCoordinate(lon, position, 'longitude');
      
      errors.push(...latErrors, ...lonErrors);
      return errors;
    }
    
    if (latRegex.test(cleanToken) || lonRegex.test(cleanToken)) {
      const coordinateType = latRegex.test(cleanToken) ? 'latitude' : 'longitude';
      const coordErrors = this.validateCoordinate(cleanToken, position, coordinateType);
      errors.push(...coordErrors);
      return errors;
    }
    
    if (this.looksLikeCoordinate(cleanToken)) {
      errors.push({
        message: `Invalid coordinate format at position ${position + 1}: "${cleanToken}". Expected formats: DDMMSSN/S for latitude, DDDMMSSE/W for longitude.`,
        position,
        input: cleanToken
      });
      return errors;
    }
    
    const waypointErrors = this.validateWaypointName(cleanToken, position);
    errors.push(...waypointErrors);
    
    return errors;
  }

  private static validateCoordinate(coord: string, position: number, type: 'latitude' | 'longitude'): ConversionError[] {
    const errors: ConversionError[] = [];
    
    const latRegex = /^(\d{2})(\d{2})(\d{2})([NS])$/;
    const lonRegex = /^(\d{3})(\d{2})(\d{2})([EW])$/;
    
    const match = type === 'latitude' ? coord.match(latRegex) : coord.match(lonRegex);
    
    if (!match) {
      const expectedFormat = type === 'latitude' ? 'DDMMSSN/S' : 'DDDMMSSE/W';
      errors.push({
        message: `Invalid ${type} format at position ${position + 1}: "${coord}". Expected format: ${expectedFormat}.`,
        position,
        input: coord
      });
      return errors;
    }

    const [, degStr, minStr, secStr, hemisphere] = match;
    if (!degStr || !minStr || !secStr || !hemisphere) {
      errors.push({
        message: `Invalid coordinate format at position ${position + 1}: "${coord}". Malformed coordinate data.`,
        position,
        input: coord
      });
      return errors;
    }
    const deg = parseInt(degStr, 10);
    const minutes = parseInt(minStr, 10);
    const seconds = parseInt(secStr, 10);

    if (minutes >= 60) {
      errors.push({
        message: `Invalid minutes in ${type} at position ${position + 1}: "${coord}". Minutes must be 00-59.`,
        position,
        input: coord
      });
    }

    if (seconds >= 60) {
      errors.push({
        message: `Invalid seconds in ${type} at position ${position + 1}: "${coord}". Seconds must be 00-59.`,
        position,
        input: coord
      });
    }

    if (type === 'latitude' && deg > 90) {
      errors.push({
        message: `Invalid latitude degrees at position ${position + 1}: "${coord}". Latitude degrees must be 00-90.`,
        position,
        input: coord
      });
    }

    if (type === 'longitude' && deg > 180) {
      errors.push({
        message: `Invalid longitude degrees at position ${position + 1}: "${coord}". Longitude degrees must be 000-180.`,
        position,
        input: coord
      });
    }

    if (type === 'latitude' && !['N', 'S'].includes(hemisphere)) {
      errors.push({
        message: `Invalid latitude hemisphere at position ${position + 1}: "${coord}". Must end with N or S.`,
        position,
        input: coord
      });
    }

    if (type === 'longitude' && !['E', 'W'].includes(hemisphere)) {
      errors.push({
        message: `Invalid longitude hemisphere at position ${position + 1}: "${coord}". Must end with E or W.`,
        position,
        input: coord
      });
    }

    return errors;
  }

  private static validateWaypointName(name: string, position: number): ConversionError[] {
    const errors: ConversionError[] = [];
    
    if (name.length < 2) {
      errors.push({
        message: `Waypoint name too short at position ${position + 1}: "${name}". Waypoint names should be at least 2 characters.`,
        position,
        input: name
      });
    }

    if (name.length > 12) {
      errors.push({
        message: `Waypoint name too long at position ${position + 1}: "${name}". Waypoint names should be 12 characters or less.`,
        position,
        input: name
      });
    }

    if (!/^[A-Za-z0-9]+$/.test(name)) {
      errors.push({
        message: `Invalid characters in waypoint name at position ${position + 1}: "${name}". Use only letters and numbers.`,
        position,
        input: name
      });
    }

    return errors;
  }

  private static looksLikeCoordinate(token: string): boolean {
    return /^\d+[NSEW]?$/.test(token) || 
           /^[NSEW]?\d+$/.test(token) ||
           /^\d{5,}[NSEW]$/.test(token) ||
           /^\d{6,}$/.test(token);
  }

  static generateHelpfulErrorMessage(errors: ConversionError[]): string {
    if (errors.length === 0) return '';

    let message = 'Found ' + (errors.length === 1 ? '1 error' : `${errors.length} errors`) + ':\n\n';
    
    errors.forEach((error, index) => {
      message += `${index + 1}. ${error.message}\n`;
    });

    message += '\n📝 Format Examples:\n';
    message += '• Airport codes: P34, KLAX, N68\n';
    message += '• Latitude: 403210N (40°32\'10"N)\n';
    message += '• Longitude: 0772310W (77°23\'10"W)\n';
    message += '• Combined: 403210N0772310W\n';
    message += '• Complete route: P34 403210N0772310W N68';

    return message;
  }
}