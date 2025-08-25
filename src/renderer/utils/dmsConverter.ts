/**
 * Types for DMS conversion
 */
export interface DMSParts {
  deg: string;
  min?: string;
  sec?: string;
  dir: string;
}

export interface ConversionResult {
  decimal: number;
  direction: string;
}

export interface CoordinatePair {
  latitude: number;
  longitude: number;
}

/**
 * DMS (Degrees, Minutes, Seconds) to Decimal Degrees Converter
 */
export class DMSConverter {
  /**
   * Parse DMS parts and return decimal degrees and direction
   */
  private static parseDMS(parts: DMSParts): ConversionResult {
    const deg = parseFloat(parts.deg);
    const minutes = parts.min ? parseFloat(parts.min) : 0.0;
    const seconds = parts.sec ? parseFloat(parts.sec) : 0.0;
    const direction = parts.dir.toUpperCase();

    // Validate ranges
    if (!(0 <= deg && deg <= 180)) {
      throw new Error(`Degrees must be between 0 and 180, got ${deg}`);
    }
    if (!(0 <= minutes && minutes < 60)) {
      throw new Error(`Minutes must be between 0 and 59, got ${minutes}`);
    }
    if (!(0 <= seconds && seconds < 60)) {
      throw new Error(`Seconds must be between 0 and 59, got ${seconds}`);
    }

    let decimal = deg + minutes / 60 + seconds / 3600;
    if (direction === 'S' || direction === 'W') {
      decimal *= -1;
    }

    return { decimal, direction };
  }

  /**
   * Convert compact DMS format to decimal degrees
   * Format: N453015.5 or S1224030
   */
  static compactDMSToDecimal(dms: string): ConversionResult {
    const regex = /^([NSEW])(\d{2,3})(\d{2})(\d{2}(?:\.\d+)?)$/i;
    const match = dms.trim().match(regex);
    
    if (!match) {
      throw new Error(`Invalid compact DMS format: ${dms}`);
    }

    const parts: DMSParts = {
      dir: match[1].toUpperCase(),
      deg: match[2],
      min: match[3],
      sec: match[4],
    };

    return this.parseDMS(parts);
  }

  /**
   * Convert loose DMS format to decimal degrees
   * Supports various formats like: N45°30'15", 45°30'15"N, N45 30 15, etc.
   */
  static looseDMSToDecimal(dms: string): ConversionResult {
    const dmsClean = dms.trim().toUpperCase();
    
    // Check for direction at start
    const startMatch = dmsClean.match(
      /^\s*([NSEW])[\s°d]*(\d{1,3})[°d\s]*(\d{1,2})['m\s]*(\d{1,2}(?:\.\d+)?)?["s\s]*$/i
    );
    
    if (startMatch) {
      const parts: DMSParts = {
        dir: startMatch[1].toUpperCase(),
        deg: startMatch[2],
        min: startMatch[3],
        sec: startMatch[4] || '0',
      };
      return this.parseDMS(parts);
    }

    // Check for direction at end
    const endMatch = dmsClean.match(
      /^[\s°d]*(\d{1,3})[°d\s]*(\d{1,2})['m\s]*(\d{1,2}(?:\.\d+)?)?["s\s]*([NSEW])\s*$/i
    );
    
    if (endMatch) {
      const parts: DMSParts = {
        deg: endMatch[1],
        min: endMatch[2],
        sec: endMatch[3] || '0',
        dir: endMatch[4].toUpperCase(),
      };
      return this.parseDMS(parts);
    }

    throw new Error(`Invalid loose DMS format: ${dms}`);
  }

  /**
   * Automatically detect and convert DMS to decimal degrees
   */
  static dmsToDecimal(dms: string): ConversionResult {
    const trimmedDms = dms.trim();
    
    try {
      return this.compactDMSToDecimal(trimmedDms);
    } catch {
      try {
        return this.looseDMSToDecimal(trimmedDms);
      } catch {
        throw new Error(`Unrecognized DMS format: ${dms}`);
      }
    }
  }

  /**
   * Parse a string containing latitude and longitude in DMS format
   */
  static parseCoordinatePair(dmsInput: string): CoordinatePair {
    if (!dmsInput.trim()) {
      throw new Error('Input cannot be empty.');
    }

    // Split into potential latitude and longitude parts
    const parts = dmsInput.split(/[\s,]+/).filter(part => part.length > 0);
    
    if (parts.length < 2) {
      throw new Error('Input must include both latitude and longitude.');
    }

    // Try different splitting strategies
    const midPoint = Math.floor(parts.length / 2);
    const latParts = parts.slice(0, midPoint);
    const lonParts = parts.slice(midPoint);

    const latDms = latParts.join(' ');
    const lonDms = lonParts.join(' ');

    // Parse and validate directions
    const latResult = this.dmsToDecimal(latDms);
    const lonResult = this.dmsToDecimal(lonDms);

    if (!['N', 'S'].includes(latResult.direction)) {
      throw new Error(`Invalid latitude direction: ${latResult.direction}. Must be N or S.`);
    }
    if (!['E', 'W'].includes(lonResult.direction)) {
      throw new Error(`Invalid longitude direction: ${lonResult.direction}. Must be E or W.`);
    }

    // Validate ranges
    if (!(latResult.decimal >= -90 && latResult.decimal <= 90)) {
      throw new Error(`Latitude must be between -90 and 90 degrees, got ${latResult.decimal}`);
    }
    if (!(lonResult.decimal >= -180 && lonResult.decimal <= 180)) {
      throw new Error(`Longitude must be between -180 and 180 degrees, got ${lonResult.decimal}`);
    }

    return {
      latitude: latResult.decimal,
      longitude: lonResult.decimal,
    };
  }

  /**
   * Format decimal degrees to a readable string
   */
  static formatDecimalDegrees(lat: number, lon: number, precision: number = 9): string {
    return `${lat.toFixed(precision)} ${lon.toFixed(precision)}`;
  }
}
