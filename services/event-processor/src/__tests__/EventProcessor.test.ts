import { EventProcessor } from '../services/EventProcessor';
import { DatabaseService } from '../services/DatabaseService';
import { RedisService } from '../services/RedisService';
import { KafkaService } from '../services/KafkaService';
import { Logger } from '../services/Logger';
import { TollEvent } from '@nationwide-toll-hub/shared';

/**
 * Elite Event Processor Tests
 * 
 * Comprehensive test suite for the event processing service.
 * Tests event ingestion, processing, matching, and error handling.
 */

// Mock dependencies
jest.mock('../services/DatabaseService');
jest.mock('../services/RedisService');
jest.mock('../services/KafkaService');
jest.mock('../services/Logger');

describe('EventProcessor', () => {
  let eventProcessor: EventProcessor;
  let mockDb: jest.Mocked<DatabaseService>;
  let mockRedis: jest.Mocked<RedisService>;
  let mockKafka: jest.Mocked<KafkaService>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Create mocks
    mockDb = new DatabaseService() as jest.Mocked<DatabaseService>;
    mockRedis = new RedisService() as jest.Mocked<RedisService>;
    mockKafka = new KafkaService() as jest.Mocked<KafkaService>;
    mockLogger = new Logger('test') as jest.Mocked<Logger>;

    // Create processor instance
    eventProcessor = new EventProcessor(mockDb, mockRedis, mockKafka, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processRawEvent', () => {
    it('should successfully process a valid raw event', async () => {
      // Arrange
      const rawEvent = {
        id: 'event-123',
        agencyId: 'etoll',
        timestamp: new Date().toISOString(),
        data: {
          licensePlate: 'ABC123',
          amount: 2.50,
          location: 'Highway 101',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
      };

      mockRedis.get.mockResolvedValue(null); // No duplicate
      mockDb.createTollEvent.mockResolvedValue();
      mockKafka.produceNormalizedEvent.mockResolvedValue();

      // Act
      await eventProcessor.processRawEvent(rawEvent);

      // Assert
      expect(mockRedis.get).toHaveBeenCalledWith(`event:${rawEvent.id}`);
      expect(mockDb.createTollEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          id: rawEvent.id,
          agencyId: rawEvent.agencyId,
          amount: rawEvent.data.amount,
          vehicle: expect.objectContaining({
            licensePlate: rawEvent.data.licensePlate,
          }),
          location: expect.objectContaining({
            name: rawEvent.data.location,
            coordinates: rawEvent.data.coordinates,
          }),
        })
      );
      expect(mockKafka.produceNormalizedEvent).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Event processed successfully',
        expect.objectContaining({ eventId: rawEvent.id })
      );
    });

    it('should skip duplicate events', async () => {
      // Arrange
      const rawEvent = {
        id: 'duplicate-event-123',
        agencyId: 'etoll',
        timestamp: new Date().toISOString(),
        data: { licensePlate: 'ABC123', amount: 2.50 },
      };

      mockRedis.get.mockResolvedValue('processed'); // Duplicate exists

      // Act
      await eventProcessor.processRawEvent(rawEvent);

      // Assert
      expect(mockDb.createTollEvent).not.toHaveBeenCalled();
      expect(mockKafka.produceNormalizedEvent).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Duplicate event skipped',
        expect.objectContaining({ eventId: rawEvent.id })
      );
    });

    it('should handle invalid event data', async () => {
      // Arrange
      const invalidEvent = {
        id: 'invalid-event-123',
        agencyId: 'etoll',
        timestamp: new Date().toISOString(),
        data: {
          // Missing required fields
          amount: 2.50,
        },
      };

      mockRedis.get.mockResolvedValue(null);

      // Act & Assert
      await expect(eventProcessor.processRawEvent(invalidEvent)).rejects.toThrow();
      
      expect(mockDb.createTollEvent).not.toHaveBeenCalled();
      expect(mockKafka.produceNormalizedEvent).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to process event',
        expect.objectContaining({ eventId: invalidEvent.id })
      );
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const rawEvent = {
        id: 'db-error-event-123',
        agencyId: 'etoll',
        timestamp: new Date().toISOString(),
        data: {
          licensePlate: 'ABC123',
          amount: 2.50,
          location: 'Highway 101',
        },
      };

      mockRedis.get.mockResolvedValue(null);
      mockDb.createTollEvent.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(eventProcessor.processRawEvent(rawEvent)).rejects.toThrow();
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to process event',
        expect.objectContaining({ 
          eventId: rawEvent.id,
          error: 'Database connection failed'
        })
      );
    });
  });

  describe('matchTollEvent', () => {
    it('should match toll event to existing user and vehicle', async () => {
      // Arrange
      const tollEvent: TollEvent = {
        id: 'event-123',
        agencyId: 'etoll',
        amount: 2.50,
        currency: 'USD',
        timestamp: new Date(),
        location: {
          name: 'Highway 101',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
        vehicle: {
          licensePlate: 'ABC123',
          type: 'car',
        },
        status: 'pending',
        metadata: {},
      };

      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockVehicle = { id: 'vehicle-123', userId: 'user-123', licensePlate: 'ABC123' };

      mockDb.getVehicleByLicensePlate.mockResolvedValue(mockVehicle);
      mockDb.getUserById.mockResolvedValue(mockUser);
      mockDb.updateTollEvent.mockResolvedValue();

      // Act
      const result = await eventProcessor.matchTollEvent(tollEvent);

      // Assert
      expect(result.matched).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.vehicleId).toBe('vehicle-123');
      expect(result.confidence).toBe(1.0);
      expect(result.matchType).toBe('exact');
      
      expect(mockDb.updateTollEvent).toHaveBeenCalledWith(
        tollEvent.id,
        expect.objectContaining({
          userId: 'user-123',
          vehicleId: 'vehicle-123',
          status: 'matched',
        })
      );
    });

    it('should queue unmatched events for manual review', async () => {
      // Arrange
      const tollEvent: TollEvent = {
        id: 'unmatched-event-123',
        agencyId: 'etoll',
        amount: 2.50,
        currency: 'USD',
        timestamp: new Date(),
        location: {
          name: 'Highway 101',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
        vehicle: {
          licensePlate: 'UNKNOWN123',
          type: 'car',
        },
        status: 'pending',
        metadata: {},
      };

      mockDb.getVehicleByLicensePlate.mockResolvedValue(null);
      mockDb.createManualReviewQueue.mockResolvedValue();

      // Act
      const result = await eventProcessor.matchTollEvent(tollEvent);

      // Assert
      expect(result.matched).toBe(false);
      expect(result.matchType).toBe('manual_review');
      
      expect(mockDb.createManualReviewQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          tollEventId: tollEvent.id,
          reason: 'No vehicle match found',
        })
      );
    });

    it('should handle fuzzy license plate matching', async () => {
      // Arrange
      const tollEvent: TollEvent = {
        id: 'fuzzy-event-123',
        agencyId: 'etoll',
        amount: 2.50,
        currency: 'USD',
        timestamp: new Date(),
        location: {
          name: 'Highway 101',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
        vehicle: {
          licensePlate: 'ABC12Z', // Typo in license plate
          type: 'car',
        },
        status: 'pending',
        metadata: {},
      };

      const mockVehicle = { 
        id: 'vehicle-123', 
        userId: 'user-123', 
        licensePlate: 'ABC123' // Correct license plate
      };

      mockDb.getVehicleByLicensePlate.mockResolvedValue(null);
      mockDb.getVehiclesByFuzzyLicensePlate.mockResolvedValue([mockVehicle]);
      mockDb.getUserById.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
      mockDb.updateTollEvent.mockResolvedValue();

      // Act
      const result = await eventProcessor.matchTollEvent(tollEvent);

      // Assert
      expect(result.matched).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.vehicleId).toBe('vehicle-123');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.matchType).toBe('fuzzy');
    });
  });

  describe('calculateTollRate', () => {
    it('should calculate correct toll rate for standard vehicle', async () => {
      // Arrange
      const tollEvent: TollEvent = {
        id: 'rate-event-123',
        agencyId: 'etoll',
        amount: 0, // Will be calculated
        currency: 'USD',
        timestamp: new Date(),
        location: {
          name: 'Highway 101',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
        vehicle: {
          licensePlate: 'ABC123',
          type: 'car',
        },
        status: 'pending',
        metadata: {},
      };

      const mockRate = {
        baseRate: 2.50,
        vehicleClass: 'standard',
        timeMultiplier: 1.0,
        locationMultiplier: 1.0,
      };

      mockDb.getTollRate.mockResolvedValue(mockRate);

      // Act
      const rate = await eventProcessor.calculateTollRate(tollEvent);

      // Assert
      expect(rate).toBe(2.50);
      expect(mockDb.getTollRate).toHaveBeenCalledWith(
        'etoll',
        'Highway 101',
        'car'
      );
    });

    it('should apply time-based multipliers for peak hours', async () => {
      // Arrange
      const peakHour = new Date();
      peakHour.setHours(8, 0, 0, 0); // 8 AM

      const tollEvent: TollEvent = {
        id: 'peak-event-123',
        agencyId: 'etoll',
        amount: 0,
        currency: 'USD',
        timestamp: peakHour,
        location: {
          name: 'Highway 101',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
        vehicle: {
          licensePlate: 'ABC123',
          type: 'car',
        },
        status: 'pending',
        metadata: {},
      };

      const mockRate = {
        baseRate: 2.50,
        vehicleClass: 'standard',
        timeMultiplier: 1.5, // Peak hour multiplier
        locationMultiplier: 1.0,
      };

      mockDb.getTollRate.mockResolvedValue(mockRate);

      // Act
      const rate = await eventProcessor.calculateTollRate(tollEvent);

      // Assert
      expect(rate).toBe(3.75); // 2.50 * 1.5
    });

    it('should handle missing rate configuration', async () => {
      // Arrange
      const tollEvent: TollEvent = {
        id: 'no-rate-event-123',
        agencyId: 'unknown-agency',
        amount: 0,
        currency: 'USD',
        timestamp: new Date(),
        location: {
          name: 'Unknown Highway',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
        vehicle: {
          licensePlate: 'ABC123',
          type: 'car',
        },
        status: 'pending',
        metadata: {},
      };

      mockDb.getTollRate.mockResolvedValue(null);

      // Act
      const rate = await eventProcessor.calculateTollRate(tollEvent);

      // Assert
      expect(rate).toBe(0); // Default rate when no configuration found
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No toll rate configuration found',
        expect.objectContaining({
          agencyId: 'unknown-agency',
          location: 'Unknown Highway',
        })
      );
    });
  });

  describe('deduplicateEvent', () => {
    it('should identify and skip duplicate events', async () => {
      // Arrange
      const eventId = 'duplicate-event-123';
      const eventHash = 'event-hash-123';

      mockRedis.get.mockResolvedValue('processed');

      // Act
      const isDuplicate = await eventProcessor.deduplicateEvent(eventId, eventHash);

      // Assert
      expect(isDuplicate).toBe(true);
      expect(mockRedis.get).toHaveBeenCalledWith(`event:${eventId}`);
    });

    it('should mark new events as processed', async () => {
      // Arrange
      const eventId = 'new-event-123';
      const eventHash = 'new-event-hash-123';

      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      const isDuplicate = await eventProcessor.deduplicateEvent(eventId, eventHash);

      // Assert
      expect(isDuplicate).toBe(false);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `event:${eventId}`,
        3600, // 1 hour TTL
        'processed'
      );
    });

    it('should handle Redis errors gracefully', async () => {
      // Arrange
      const eventId = 'redis-error-event-123';
      const eventHash = 'redis-error-hash-123';

      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      // Act & Assert
      await expect(eventProcessor.deduplicateEvent(eventId, eventHash)).rejects.toThrow();
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Redis error during deduplication',
        expect.objectContaining({
          eventId,
          error: 'Redis connection failed',
        })
      );
    });
  });

  describe('validateEvent', () => {
    it('should validate correct event structure', async () => {
      // Arrange
      const validEvent = {
        id: 'valid-event-123',
        agencyId: 'etoll',
        timestamp: new Date().toISOString(),
        data: {
          licensePlate: 'ABC123',
          amount: 2.50,
          location: 'Highway 101',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
      };

      // Act
      const isValid = await eventProcessor.validateEvent(validEvent);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject events with missing required fields', async () => {
      // Arrange
      const invalidEvent = {
        id: 'invalid-event-123',
        agencyId: 'etoll',
        timestamp: new Date().toISOString(),
        data: {
          // Missing licensePlate and amount
          location: 'Highway 101',
        },
      };

      // Act
      const isValid = await eventProcessor.validateEvent(invalidEvent);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject events with invalid data types', async () => {
      // Arrange
      const invalidEvent = {
        id: 'invalid-type-event-123',
        agencyId: 'etoll',
        timestamp: new Date().toISOString(),
        data: {
          licensePlate: 'ABC123',
          amount: 'invalid-amount', // Should be number
          location: 'Highway 101',
        },
      };

      // Act
      const isValid = await eventProcessor.validateEvent(invalidEvent);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject events with invalid coordinates', async () => {
      // Arrange
      const invalidEvent = {
        id: 'invalid-coords-event-123',
        agencyId: 'etoll',
        timestamp: new Date().toISOString(),
        data: {
          licensePlate: 'ABC123',
          amount: 2.50,
          location: 'Highway 101',
          coordinates: { latitude: 999, longitude: 999 }, // Invalid coordinates
        },
      };

      // Act
      const isValid = await eventProcessor.validateEvent(invalidEvent);

      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('start and stop', () => {
    it('should start event processing successfully', async () => {
      // Arrange
      mockKafka.connect.mockResolvedValue();
      mockKafka.subscribeToRawEvents.mockResolvedValue();

      // Act
      await eventProcessor.start();

      // Assert
      expect(mockKafka.connect).toHaveBeenCalled();
      expect(mockKafka.subscribeToRawEvents).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Event processor started');
    });

    it('should stop event processing gracefully', async () => {
      // Arrange
      mockKafka.disconnect.mockResolvedValue();

      // Act
      await eventProcessor.stop();

      // Assert
      expect(mockKafka.disconnect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Event processor stopped');
    });

    it('should handle startup errors gracefully', async () => {
      // Arrange
      mockKafka.connect.mockRejectedValue(new Error('Kafka connection failed'));

      // Act & Assert
      await expect(eventProcessor.start()).rejects.toThrow();
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to start event processor',
        expect.objectContaining({
          error: 'Kafka connection failed',
        })
      );
    });
  });
});
