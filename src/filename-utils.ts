export class FilenameUtils {
  /**
   * Generates a flight plan filename based on departure and arrival airports
   * Format: {origin}_{destination}_sv2msfs2024.pln
   */
  static generateFlightPlanFilename(departure: string, arrival: string): string {
    const cleanDeparture = this.sanitizeAirportCode(departure);
    const cleanArrival = this.sanitizeAirportCode(arrival);
    
    return `${cleanDeparture}_${cleanArrival}_sv2msfs2024.pln`;
  }

  /**
   * Sanitizes airport codes for use in filenames
   */
  private static sanitizeAirportCode(airportCode: string): string {
    // Convert to uppercase and remove invalid characters
    return airportCode
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 8); // Limit length for very long codes
  }

  /**
   * Validates and sanitizes a user-provided filename
   */
  static validateAndSanitizeFilename(filename: string): { isValid: boolean; sanitized: string; errors: string[] } {
    const errors: string[] = [];
    let sanitized = filename.trim();

    // Ensure .pln extension
    if (!sanitized.toLowerCase().endsWith('.pln')) {
      if (sanitized.includes('.')) {
        // Replace existing extension
        sanitized = sanitized.substring(0, sanitized.lastIndexOf('.')) + '.pln';
      } else {
        // Add .pln extension
        sanitized = sanitized + '.pln';
      }
    }

    // Remove path separators and invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
    if (invalidChars.test(sanitized)) {
      errors.push('Filename contains invalid characters');
      sanitized = sanitized.replace(invalidChars, '_');
    }

    // Check length (Windows has 260 char path limit, leave room for path)
    const nameWithoutExtension = sanitized.substring(0, sanitized.length - 4);
    if (nameWithoutExtension.length > 200) {
      errors.push('Filename is too long');
      sanitized = nameWithoutExtension.substring(0, 200) + '.pln';
    }

    // Check for empty filename
    if (nameWithoutExtension.length === 0) {
      errors.push('Filename cannot be empty');
      sanitized = 'flightplan.pln';
    }

    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    if (reservedNames.includes(nameWithoutExtension.toUpperCase())) {
      errors.push('Filename uses a reserved name');
      sanitized = nameWithoutExtension + '_flight.pln';
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  }

  /**
   * Gets the filename without extension for display purposes
   */
  static getFilenameWithoutExtension(filename: string): string {
    return filename.endsWith('.pln') ? filename.substring(0, filename.length - 4) : filename;
  }
}