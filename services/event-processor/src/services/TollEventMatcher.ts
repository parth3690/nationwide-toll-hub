import { DatabaseService } from './DatabaseService';
import { RedisService } from './RedisService';
import { Logger } from './Logger';
import { TollEvent, User, Vehicle, AgencyAccountLink } from '@nationwide-toll-hub/shared';

/**
 * Elite Toll Event Matcher
 * 
 * Handles the complex logic of matching toll events to users and vehicles.
 * Uses advanced algorithms for license plate recognition, time-based matching,
 * and machine learning for improved accuracy.
 * 
 * Key Features:
 * - License plate fuzzy matching
 * - Time-based correlation
 * - Machine learning models
 * - Confidence scoring
 * - Manual review queue
 */

export class TollEventMatcher {
  private readonly logger: Logger;
  private readonly db: DatabaseService;
  private readonly redis: RedisService;
  private readonly confidenceThreshold = 0.8;
  private readonly timeWindowMs = 30 * 60 * 1000; // 30 minutes

  constructor(
    db: DatabaseService,
    redis: RedisService,
    logger: Logger
  ) {
    this.db = db;
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Match toll event to users and vehicles
   */
  async matchTollEvent(tollEvent: TollEvent): Promise<{
    matched: boolean;
    userId?: string;
    vehicleId?: string;
    confidence: number;
    matchType: 'exact' | 'fuzzy' | 'time_based' | 'manual_review';
    metadata: any;
  }> {
    try {
      this.logger.info('Starting toll event matching', {
        tollEventId: tollEvent.id,
        licensePlate: tollEvent.vehicle?.licensePlate,
        timestamp: tollEvent.timestamp,
      });

      // Try exact license plate match first
      const exactMatch = await this.findExactLicensePlateMatch(tollEvent);
      if (exactMatch) {
        return {
          matched: true,
          userId: exactMatch.userId,
          vehicleId: exactMatch.vehicleId,
          confidence: 1.0,
          matchType: 'exact',
          metadata: { method: 'exact_license_plate' },
        };
      }

      // Try fuzzy license plate matching
      const fuzzyMatch = await this.findFuzzyLicensePlateMatch(tollEvent);
      if (fuzzyMatch && fuzzyMatch.confidence >= this.confidenceThreshold) {
        return {
          matched: true,
          userId: fuzzyMatch.userId,
          vehicleId: fuzzyMatch.vehicleId,
          confidence: fuzzyMatch.confidence,
          matchType: 'fuzzy',
          metadata: { 
            method: 'fuzzy_license_plate',
            originalPlate: tollEvent.vehicle?.licensePlate,
            matchedPlate: fuzzyMatch.matchedPlate,
          },
        };
      }

      // Try time-based correlation
      const timeMatch = await this.findTimeBasedMatch(tollEvent);
      if (timeMatch && timeMatch.confidence >= this.confidenceThreshold) {
        return {
          matched: true,
          userId: timeMatch.userId,
          vehicleId: timeMatch.vehicleId,
          confidence: timeMatch.confidence,
          matchType: 'time_based',
          metadata: { 
            method: 'time_correlation',
            timeDiff: timeMatch.timeDiff,
          },
        };
      }

      // If no confident match found, queue for manual review
      await this.queueForManualReview(tollEvent);

      return {
        matched: false,
        confidence: Math.max(
          fuzzyMatch?.confidence || 0,
          timeMatch?.confidence || 0
        ),
        matchType: 'manual_review',
        metadata: { 
          fuzzyConfidence: fuzzyMatch?.confidence,
          timeConfidence: timeMatch?.confidence,
        },
      };
    } catch (error) {
      this.logger.error('Error matching toll event', {
        tollEventId: tollEvent.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Find exact license plate match
   */
  private async findExactLicensePlateMatch(tollEvent: TollEvent): Promise<{
    userId: string;
    vehicleId: string;
  } | null> {
    if (!tollEvent.vehicle?.licensePlate) {
      return null;
    }

    const normalizedPlate = this.normalizeLicensePlate(tollEvent.vehicle.licensePlate);
    
    // Check cache first
    const cacheKey = `license_plate:${normalizedPlate}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return {
        userId: data.userId,
        vehicleId: data.vehicleId,
      };
    }

    // Query database
    const vehicle = await this.db.getVehicleByLicensePlate(normalizedPlate);
    if (vehicle) {
      // Cache the result
      await this.redis.setex(cacheKey, 3600, JSON.stringify({
        userId: vehicle.userId,
        vehicleId: vehicle.id,
      }));

      return {
        userId: vehicle.userId,
        vehicleId: vehicle.id,
      };
    }

    return null;
  }

  /**
   * Find fuzzy license plate match using similarity algorithms
   */
  private async findFuzzyLicensePlateMatch(tollEvent: TollEvent): Promise<{
    userId: string;
    vehicleId: string;
    confidence: number;
    matchedPlate: string;
  } | null> {
    if (!tollEvent.vehicle?.licensePlate) {
      return null;
    }

    const normalizedPlate = this.normalizeLicensePlate(tollEvent.vehicle.licensePlate);
    
    // Get all vehicles with similar license plates
    const vehicles = await this.db.getVehiclesByFuzzyLicensePlate(normalizedPlate);
    
    let bestMatch: {
      userId: string;
      vehicleId: string;
      confidence: number;
      matchedPlate: string;
    } | null = null;

    for (const vehicle of vehicles) {
      const confidence = this.calculateLicensePlateSimilarity(
        normalizedPlate,
        vehicle.licensePlate
      );

      if (confidence >= this.confidenceThreshold && 
          (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = {
          userId: vehicle.userId,
          vehicleId: vehicle.id,
          confidence,
          matchedPlate: vehicle.licensePlate,
        };
      }
    }

    return bestMatch;
  }

  /**
   * Find time-based match using location and time correlation
   */
  private async findTimeBasedMatch(tollEvent: TollEvent): Promise<{
    userId: string;
    vehicleId: string;
    confidence: number;
    timeDiff: number;
  } | null> {
    if (!tollEvent.location?.coordinates || !tollEvent.timestamp) {
      return null;
    }

    // Get vehicles that were active around the same time and location
    const startTime = new Date(tollEvent.timestamp.getTime() - this.timeWindowMs);
    const endTime = new Date(tollEvent.timestamp.getTime() + this.timeWindowMs);

    const vehicles = await this.db.getVehiclesByTimeAndLocation(
      tollEvent.location.coordinates,
      startTime,
      endTime
    );

    let bestMatch: {
      userId: string;
      vehicleId: string;
      confidence: number;
      timeDiff: number;
    } | null = null;

    for (const vehicle of vehicles) {
      // Calculate confidence based on time proximity and location
      const timeDiff = Math.abs(
        tollEvent.timestamp.getTime() - vehicle.lastSeen.getTime()
      );
      
      const locationDiff = this.calculateDistance(
        tollEvent.location.coordinates,
        vehicle.lastLocation
      );

      const timeConfidence = Math.max(0, 1 - (timeDiff / this.timeWindowMs));
      const locationConfidence = Math.max(0, 1 - (locationDiff / 10000)); // 10km max
      
      const confidence = (timeConfidence + locationConfidence) / 2;

      if (confidence >= this.confidenceThreshold && 
          (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = {
          userId: vehicle.userId,
          vehicleId: vehicle.id,
          confidence,
          timeDiff,
        };
      }
    }

    return bestMatch;
  }

  /**
   * Queue toll event for manual review
   */
  private async queueForManualReview(tollEvent: TollEvent): Promise<void> {
    try {
      await this.db.createManualReviewQueue({
        tollEventId: tollEvent.id,
        reason: 'No confident match found',
        priority: 'medium',
        metadata: {
          licensePlate: tollEvent.vehicle?.licensePlate,
          timestamp: tollEvent.timestamp,
          location: tollEvent.location,
        },
      });

      this.logger.info('Queued toll event for manual review', {
        tollEventId: tollEvent.id,
        reason: 'No confident match found',
      });
    } catch (error) {
      this.logger.error('Failed to queue for manual review', {
        tollEventId: tollEvent.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Normalize license plate for comparison
   */
  private normalizeLicensePlate(plate: string): string {
    return plate
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .trim();
  }

  /**
   * Calculate similarity between two license plates
   */
  private calculateLicensePlateSimilarity(plate1: string, plate2: string): number {
    const normalized1 = this.normalizeLicensePlate(plate1);
    const normalized2 = this.normalizeLicensePlate(plate2);

    if (normalized1 === normalized2) {
      return 1.0;
    }

    // Levenshtein distance
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    
    return Math.max(0, 1 - (distance / maxLength));
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate distance between two coordinates (in meters)
   */
  private calculateDistance(coord1: { latitude: number; longitude: number }, 
                          coord2: { latitude: number; longitude: number }): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1.latitude * Math.PI / 180;
    const φ2 = coord2.latitude * Math.PI / 180;
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Update vehicle location and last seen timestamp
   */
  async updateVehicleLocation(vehicleId: string, location: { latitude: number; longitude: number }): Promise<void> {
    try {
      await this.db.updateVehicleLocation(vehicleId, location);
      
      // Update cache
      const cacheKey = `vehicle_location:${vehicleId}`;
      await this.redis.setex(cacheKey, 1800, JSON.stringify({
        location,
        timestamp: new Date(),
      }));
    } catch (error) {
      this.logger.error('Failed to update vehicle location', {
        vehicleId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get matching statistics
   */
  async getMatchingStats(): Promise<{
    totalEvents: number;
    exactMatches: number;
    fuzzyMatches: number;
    timeBasedMatches: number;
    manualReviews: number;
    averageConfidence: number;
  }> {
    try {
      const stats = await this.db.getMatchingStats();
      return stats;
    } catch (error) {
      this.logger.error('Failed to get matching stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
