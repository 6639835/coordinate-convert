/**
 * Advanced Coordinate Utilities
 * Supports DMS, Decimal Degrees, UTM, MGRS, and calculations
 */

export interface Coordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface UTMCoordinate {
  zone: number;
  hemisphere: 'N' | 'S';
  easting: number;
  northing: number;
  zoneLetter?: string;
}

export interface MGRSCoordinate {
  zone: number;
  band: string;
  square: string;
  easting: number;
  northing: number;
  precision: number;
}

export interface ConversionResult {
  success: boolean;
  data?: any;
  error?: string;
  format?: CoordinateFormat;
}

export interface DistanceResult {
  distance: number; // in meters
  bearing: number;  // in degrees
  reverseBearing: number; // in degrees
}

export enum CoordinateFormat {
  DMS = 'dms',
  DD = 'decimal',
  UTM = 'utm',
  MGRS = 'mgrs',
  UNKNOWN = 'unknown'
}

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  KML = 'kml',
  GEOJSON = 'geojson',
  TXT = 'txt'
}

export class CoordinateUtils {
  private static readonly EARTH_RADIUS = 6378137; // WGS84 equatorial radius in meters
  private static readonly FLATTENING = 1 / 298.257223563; // WGS84 flattening
  private static readonly UTM_SCALE_FACTOR = 0.9996;

  /**
   * Auto-detect coordinate format from input string
   */
  static detectFormat(input: string): CoordinateFormat {
    const cleaned = input.trim().toUpperCase();
    
    // DMS patterns
    const dmsPatterns = [
      /[NSEW].*[°'"]/,
      /\d+[°]\d+[']\d+["]/,
      /[NSEW]\d+\s+\d+\s+\d+/
    ];
    
    // UTM patterns
    const utmPattern = /^\d{1,2}[CDEFGHJKLMNPQRSTUVWX]\s+\d+\.?\d*\s+\d+\.?\d*$/;
    
    // MGRS patterns  
    const mgrsPattern = /^\d{1,2}[CDEFGHJKLMNPQRSTUVWX][ABCDEFGHJKLMNPQRSTUVWXYZ]{2}\d{2,10}$/;
    
    // Decimal degrees patterns
    const ddPattern = /^-?\d+\.?\d*\s*,?\s*-?\d+\.?\d*$/;

    if (dmsPatterns.some(pattern => pattern.test(cleaned))) {
      return CoordinateFormat.DMS;
    }
    
    if (utmPattern.test(cleaned)) {
      return CoordinateFormat.UTM;
    }
    
    if (mgrsPattern.test(cleaned)) {
      return CoordinateFormat.MGRS;
    }
    
    if (ddPattern.test(cleaned)) {
      return CoordinateFormat.DD;
    }

    return CoordinateFormat.UNKNOWN;
  }

  /**
   * Convert decimal degrees to DMS format
   */
  static decimalToDMS(latitude: number, longitude: number, precision: number = 2): string {
    const formatDMS = (coord: number, isLatitude: boolean): string => {
      const absCoord = Math.abs(coord);
      const degrees = Math.floor(absCoord);
      const minutesFloat = (absCoord - degrees) * 60;
      const minutes = Math.floor(minutesFloat);
      const seconds = parseFloat(((minutesFloat - minutes) * 60).toFixed(precision));
      
      const direction = coord >= 0 
        ? (isLatitude ? 'N' : 'E')
        : (isLatitude ? 'S' : 'W');
      
      return `${direction}${degrees}°${minutes}'${seconds}"`;
    };

    return `${formatDMS(latitude, true)} ${formatDMS(longitude, false)}`;
  }

  /**
   * Convert coordinates to UTM
   */
  static toUTM(latitude: number, longitude: number): UTMCoordinate {
    const zone = Math.floor((longitude + 180) / 6) + 1;
    const hemisphere = latitude >= 0 ? 'N' : 'S';
    
    // Simplified UTM conversion (for demonstration)
    // In a production app, you'd use a proper projection library
    const latRad = (latitude * Math.PI) / 180;
    const lonRad = (longitude * Math.PI) / 180;
    const lonOriginRad = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;
    
    const eccPrimeSquared = (this.FLATTENING * (2 - this.FLATTENING));
    const N = this.EARTH_RADIUS / Math.sqrt(1 - eccPrimeSquared * Math.sin(latRad) * Math.sin(latRad));
    const T = Math.tan(latRad) * Math.tan(latRad);
    const C = eccPrimeSquared * Math.cos(latRad) * Math.cos(latRad);
    const A = Math.cos(latRad) * (lonRad - lonOriginRad);
    
    const M = this.EARTH_RADIUS * (
      (1 - eccPrimeSquared / 4 - 3 * eccPrimeSquared * eccPrimeSquared / 64) * latRad -
      (3 * eccPrimeSquared / 8 + 3 * eccPrimeSquared * eccPrimeSquared / 32) * Math.sin(2 * latRad) +
      (15 * eccPrimeSquared * eccPrimeSquared / 256) * Math.sin(4 * latRad)
    );
    
    const easting = this.UTM_SCALE_FACTOR * N * (
      A + (1 - T + C) * A * A * A / 6 +
      (5 - 18 * T + T * T + 72 * C - 58 * eccPrimeSquared) * A * A * A * A * A / 120
    ) + 500000.0;
    
    let northing = this.UTM_SCALE_FACTOR * (
      M + N * Math.tan(latRad) * (
        A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24 +
        (61 - 58 * T + T * T + 600 * C - 330 * eccPrimeSquared) * A * A * A * A * A * A / 720
      )
    );
    
    if (latitude < 0) {
      northing += 10000000.0; // Add false northing for southern hemisphere
    }

    return {
      zone,
      hemisphere,
      easting: Math.round(easting),
      northing: Math.round(northing)
    };
  }

  /**
   * Calculate distance and bearing between two coordinates
   */
  static calculateDistance(coord1: Coordinate, coord2: Coordinate): DistanceResult {
    const lat1Rad = (coord1.latitude * Math.PI) / 180;
    const lat2Rad = (coord2.latitude * Math.PI) / 180;
    const deltaLatRad = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const deltaLonRad = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    // Haversine formula for distance
    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = this.EARTH_RADIUS * c;

    // Forward bearing
    const y = Math.sin(deltaLonRad) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLonRad);
    const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

    // Reverse bearing
    const reverseBearing = (bearing + 180) % 360;

    return {
      distance: Math.round(distance * 100) / 100,
      bearing: Math.round(bearing * 100) / 100,
      reverseBearing: Math.round(reverseBearing * 100) / 100
    };
  }

  /**
   * Validate coordinate bounds
   */
  static validateCoordinate(latitude: number, longitude: number): boolean {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  }

  /**
   * Batch process coordinates
   */
  static async batchProcess(
    inputs: string[], 
    operation: 'validate' | 'convert' | 'toUTM' | 'toDMS',
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];
    const total = inputs.length;

    for (let i = 0; i < inputs.length; i++) {
      try {
        const input = inputs[i].trim();
        if (!input) {
          results.push({ success: false, error: 'Empty input' });
          continue;
        }

        const format = this.detectFormat(input);
        let result: ConversionResult;

        switch (operation) {
          case 'validate':
            result = this.validateInput(input);
            break;
          case 'convert':
            result = await this.convertCoordinate(input);
            break;
          case 'toUTM':
            result = await this.convertToUTM(input);
            break;
          case 'toDMS':
            result = await this.convertToDMS(input);
            break;
          default:
            result = { success: false, error: 'Unknown operation' };
        }

        results.push(result);

        // Report progress
        if (onProgress) {
          onProgress(((i + 1) / total) * 100);
        }

        // Yield control to prevent blocking
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }

      } catch (error) {
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return results;
  }

  /**
   * Validate input format
   */
  private static validateInput(input: string): ConversionResult {
    const format = this.detectFormat(input);
    if (format === CoordinateFormat.UNKNOWN) {
      return { success: false, error: 'Unknown coordinate format' };
    }
    return { success: true, data: { valid: true, format } };
  }

  /**
   * Convert coordinate to decimal degrees
   */
  private static async convertCoordinate(input: string): Promise<ConversionResult> {
    try {
      const format = this.detectFormat(input);
      
      switch (format) {
        case CoordinateFormat.DMS:
          // Use existing DMS converter
          const { DMSConverter } = await import('./dmsConverter');
          const result = DMSConverter.parseCoordinatePair(input);
          return { 
            success: true, 
            data: result, 
            format: CoordinateFormat.DMS 
          };
          
        case CoordinateFormat.DD:
          const coords = input.split(/[,\s]+/).map(s => parseFloat(s.trim()));
          if (coords.length !== 2 || coords.some(isNaN)) {
            throw new Error('Invalid decimal degree format');
          }
          return { 
            success: true, 
            data: { latitude: coords[0], longitude: coords[1] }, 
            format: CoordinateFormat.DD 
          };
          
        default:
          throw new Error(`Conversion from ${format} not yet implemented`);
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Conversion failed' 
      };
    }
  }

  /**
   * Convert to UTM format
   */
  private static async convertToUTM(input: string): Promise<ConversionResult> {
    try {
      const coordResult = await this.convertCoordinate(input);
      if (!coordResult.success || !coordResult.data) {
        return coordResult;
      }

      const { latitude, longitude } = coordResult.data;
      const utm = this.toUTM(latitude, longitude);
      
      return {
        success: true,
        data: utm,
        format: CoordinateFormat.UTM
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'UTM conversion failed' 
      };
    }
  }

  /**
   * Convert to DMS format
   */
  private static async convertToDMS(input: string): Promise<ConversionResult> {
    try {
      const coordResult = await this.convertCoordinate(input);
      if (!coordResult.success || !coordResult.data) {
        return coordResult;
      }

      const { latitude, longitude } = coordResult.data;
      const dms = this.decimalToDMS(latitude, longitude, 2);
      
      return {
        success: true,
        data: dms,
        format: CoordinateFormat.DMS
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'DMS conversion failed' 
      };
    }
  }

  /**
   * Export data in various formats
   */
  static exportData(
    data: any[], 
    format: ExportFormat, 
    filename: string = 'coordinates'
  ): string {
    switch (format) {
      case ExportFormat.CSV:
        return this.toCsv(data);
      case ExportFormat.JSON:
        return JSON.stringify(data, null, 2);
      case ExportFormat.KML:
        return this.toKml(data, filename);
      case ExportFormat.GEOJSON:
        return this.toGeoJson(data);
      case ExportFormat.TXT:
        return this.toText(data);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private static toCsv(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  }

  private static toKml(data: any[], name: string): string {
    const placemarks = data.map((coord, index) => {
      if (coord.latitude && coord.longitude) {
        return `
    <Placemark>
      <name>Point ${index + 1}</name>
      <Point>
        <coordinates>${coord.longitude},${coord.latitude},0</coordinates>
      </Point>
    </Placemark>`;
      }
      return '';
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${name}</name>${placemarks}
  </Document>
</kml>`;
  }

  private static toGeoJson(data: any[]): string {
    const features = data.filter(coord => coord.latitude && coord.longitude)
      .map((coord, index) => ({
        type: 'Feature',
        properties: {
          name: `Point ${index + 1}`,
          ...coord
        },
        geometry: {
          type: 'Point',
          coordinates: [coord.longitude, coord.latitude]
        }
      }));

    return JSON.stringify({
      type: 'FeatureCollection',
      features
    }, null, 2);
  }

  private static toText(data: any[]): string {
    return data.map(item => {
      if (typeof item === 'object') {
        return Object.entries(item)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
      }
      return String(item);
    }).join('\n');
  }

  /**
   * Memory-efficient chunk processor for large datasets
   */
  static async processInChunks<T, R>(
    data: T[],
    processor: (chunk: T[]) => Promise<R[]>,
    chunkSize: number = 100,
    onProgress?: (progress: number) => void
  ): Promise<R[]> {
    const results: R[] = [];
    const totalChunks = Math.ceil(data.length / chunkSize);

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const chunkResults = await processor(chunk);
      results.push(...chunkResults);

      if (onProgress) {
        const currentChunk = Math.floor(i / chunkSize) + 1;
        onProgress((currentChunk / totalChunks) * 100);
      }

      // Yield control to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    return results;
  }
}
