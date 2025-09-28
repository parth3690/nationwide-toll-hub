import { Kafka, Producer, Consumer, KafkaMessage, EachMessagePayload } from 'kafkajs';
import { 
  KAFKA_TOPICS, 
  ERROR_CODES, 
  createError,
  generateId,
  formatDate 
} from '@toll-hub/shared';
import { Logger } from './Logger';

/**
 * Elite Kafka Service
 * 
 * Provides comprehensive Kafka integration with:
 * - Producer and Consumer management
 * - Topic management
 * - Error handling and retry logic
 * - Message serialization/deserialization
 * - Dead letter queue handling
 * - Monitoring and metrics
 * 
 * Architecture Decisions:
 * - KafkaJS for modern Kafka integration
 * - Automatic topic creation and management
 * - Comprehensive error handling
 * - Message versioning and schema evolution
 * - Dead letter queue for failed messages
 * - Structured logging for all operations
 */

export interface KafkaMessageData {
  id: string;
  type: string;
  version: string;
  timestamp: Date;
  data: any;
  metadata?: {
    source?: string;
    correlationId?: string;
    userId?: string;
    [key: string]: any;
  };
}

export interface KafkaConsumerOptions {
  groupId: string;
  autoCommit?: boolean;
  autoCommitInterval?: number;
  sessionTimeout?: number;
  heartbeatInterval?: number;
  maxBytes?: number;
  maxWaitTimeInMs?: number;
  retry?: {
    initialRetryTime?: number;
    retries?: number;
  };
}

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger('KafkaService');
    
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'toll-hub-event-processor',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      connectionTimeout: 3000,
      requestTimeout: 25000,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
      logLevel: process.env.NODE_ENV === 'development' ? 2 : 1, // INFO level
    });
  }

  /**
   * Initialize Kafka service
   */
  async initialize(): Promise<void> {
    try {
      // Create producer
      this.producer = this.kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000,
      });

      await this.producer.connect();
      this.logger.info('Kafka producer connected successfully');

      // Create topics if they don't exist
      await this.createTopics();

      this.logger.info('Kafka service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Kafka service:', error);
      throw createError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'Failed to initialize Kafka service',
        500,
        error
      );
    }
  }

  /**
   * Create required topics
   */
  private async createTopics(): Promise<void> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const existingTopics = await admin.listTopics();
      const topicsToCreate = Object.values(KAFKA_TOPICS).filter(
        topic => !existingTopics.includes(topic)
      );

      if (topicsToCreate.length > 0) {
        await admin.createTopics({
          topics: topicsToCreate.map(topic => ({
            topic,
            numPartitions: 3,
            replicationFactor: 1,
            configEntries: [
              { name: 'retention.ms', value: '604800000' }, // 7 days
              { name: 'compression.type', value: 'snappy' },
              { name: 'cleanup.policy', value: 'delete' },
            ],
          })),
        });

        this.logger.info(`Created topics: ${topicsToCreate.join(', ')}`);
      }

      await admin.disconnect();
    } catch (error) {
      this.logger.error('Failed to create topics:', error);
      throw error;
    }
  }

  /**
   * Publish message to topic
   */
  async publishMessage(
    topic: string,
    messageData: any,
    options: {
      partition?: number;
      key?: string;
      headers?: Record<string, string>;
      correlationId?: string;
      userId?: string;
    } = {}
  ): Promise<void> {
    if (!this.producer) {
      throw createError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'Kafka producer not initialized',
        500
      );
    }

    try {
      const message: KafkaMessageData = {
        id: generateId(),
        type: this.getMessageType(topic),
        version: '1.0.0',
        timestamp: new Date(),
        data: messageData,
        metadata: {
          source: 'toll-hub-event-processor',
          correlationId: options.correlationId,
          userId: options.userId,
          ...options.headers,
        },
      };

      const kafkaMessage = {
        topic,
        partition: options.partition,
        key: options.key || message.id,
        value: JSON.stringify(message),
        headers: {
          'content-type': 'application/json',
          'message-id': message.id,
          'message-type': message.type,
          'message-version': message.version,
          'correlation-id': options.correlationId || message.id,
          ...options.headers,
        },
      };

      await this.producer.send(kafkaMessage);
      
      this.logger.info(`Message published to topic ${topic}`, {
        messageId: message.id,
        topic,
        partition: options.partition,
        key: options.key,
      });
    } catch (error) {
      this.logger.error(`Failed to publish message to topic ${topic}:`, error);
      throw createError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'Failed to publish message',
        500,
        error
      );
    }
  }

  /**
   * Subscribe to topic
   */
  async subscribeToTopic(
    topic: string,
    options: KafkaConsumerOptions,
    messageHandler: (payload: EachMessagePayload) => Promise<void>
  ): Promise<void> {
    try {
      const consumer = this.kafka.consumer({
        groupId: options.groupId,
        sessionTimeout: options.sessionTimeout || 30000,
        heartbeatInterval: options.heartbeatInterval || 3000,
        maxBytesPerPartition: options.maxBytes || 1048576,
        maxWaitTimeInMs: options.maxWaitTimeInMs || 5000,
        retry: {
          initialRetryTime: options.retry?.initialRetryTime || 100,
          retries: options.retry?.retries || 8,
        },
      });

      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });

      await consumer.run({
        autoCommit: options.autoCommit !== false,
        autoCommitInterval: options.autoCommitInterval || 5000,
        eachMessage: async (payload) => {
          try {
            await this.handleMessage(payload, messageHandler);
          } catch (error) {
            this.logger.error(`Error processing message from topic ${topic}:`, error);
            await this.handleMessageError(payload, error);
          }
        },
      });

      this.consumers.set(topic, consumer);
      this.logger.info(`Subscribed to topic ${topic} with group ${options.groupId}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic ${topic}:`, error);
      throw createError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'Failed to subscribe to topic',
        500,
        error
      );
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(
    payload: EachMessagePayload,
    messageHandler: (payload: EachMessagePayload) => Promise<void>
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Parse message
      const messageData = this.parseMessage(payload.message);
      
      this.logger.info('Processing message', {
        topic: payload.topic,
        partition: payload.partition,
        offset: payload.message.offset,
        messageId: messageData.id,
        messageType: messageData.type,
        timestamp: messageData.timestamp,
      });

      // Execute message handler
      await messageHandler(payload);

      const processingTime = Date.now() - startTime;
      this.logger.info('Message processed successfully', {
        topic: payload.topic,
        partition: payload.partition,
        offset: payload.message.offset,
        messageId: messageData.id,
        processingTime,
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error('Message processing failed', {
        topic: payload.topic,
        partition: payload.partition,
        offset: payload.message.offset,
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle message processing error
   */
  private async handleMessageError(
    payload: EachMessagePayload,
    error: any
  ): Promise<void> {
    try {
      // Send to dead letter queue
      await this.publishMessage('dead-letter-queue', {
        originalTopic: payload.topic,
        originalPartition: payload.partition,
        originalOffset: payload.message.offset,
        originalMessage: payload.message.value?.toString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });

      this.logger.error('Message sent to dead letter queue', {
        topic: payload.topic,
        partition: payload.partition,
        offset: payload.message.offset,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch (dlqError) {
      this.logger.error('Failed to send message to dead letter queue:', dlqError);
    }
  }

  /**
   * Parse Kafka message
   */
  private parseMessage(message: KafkaMessage): KafkaMessageData {
    try {
      if (!message.value) {
        throw new Error('Message value is null or undefined');
      }

      const messageData = JSON.parse(message.value.toString());
      
      // Validate message structure
      if (!messageData.id || !messageData.type || !messageData.data) {
        throw new Error('Invalid message structure');
      }

      return messageData;
    } catch (error) {
      throw createError(
        ERROR_CODES.VALIDATION_ERROR,
        'Failed to parse message',
        400,
        error
      );
    }
  }

  /**
   * Get message type from topic
   */
  private getMessageType(topic: string): string {
    const topicToTypeMap: Record<string, string> = {
      [KAFKA_TOPICS.TOLL_EVENTS_RAW]: 'toll_event_raw',
      [KAFKA_TOPICS.TOLL_EVENTS_NORMALIZED]: 'toll_event_normalized',
      [KAFKA_TOPICS.TOLL_EVENTS_MATCHED]: 'toll_event_matched',
      [KAFKA_TOPICS.STATEMENTS_GENERATE]: 'statement_generate',
      [KAFKA_TOPICS.STATEMENTS_CLOSED]: 'statement_closed',
      [KAFKA_TOPICS.DISPUTES_SUBMITTED]: 'dispute_submitted',
      [KAFKA_TOPICS.DISPUTES_UPDATES]: 'dispute_updated',
      [KAFKA_TOPICS.PAYMENTS_INITIATED]: 'payment_initiated',
      [KAFKA_TOPICS.PAYMENTS_COMPLETED]: 'payment_completed',
      [KAFKA_TOPICS.CONNECTOR_HEALTH]: 'connector_health',
    };

    return topicToTypeMap[topic] || 'unknown';
  }

  /**
   * Publish toll event raw
   */
  async publishTollEventRaw(eventData: any, metadata?: any): Promise<void> {
    await this.publishMessage(KAFKA_TOPICS.TOLL_EVENTS_RAW, eventData, {
      headers: metadata,
    });
  }

  /**
   * Publish toll event normalized
   */
  async publishTollEventNormalized(eventData: any, metadata?: any): Promise<void> {
    await this.publishMessage(KAFKA_TOPICS.TOLL_EVENTS_NORMALIZED, eventData, {
      headers: metadata,
    });
  }

  /**
   * Publish toll event matched
   */
  async publishTollEventMatched(eventData: any, metadata?: any): Promise<void> {
    await this.publishMessage(KAFKA_TOPICS.TOLL_EVENTS_MATCHED, eventData, {
      headers: metadata,
    });
  }

  /**
   * Publish statement generation trigger
   */
  async publishStatementGenerate(userId: string, periodStart: Date, periodEnd: Date): Promise<void> {
    await this.publishMessage(KAFKA_TOPICS.STATEMENTS_GENERATE, {
      userId,
      periodStart,
      periodEnd,
    }, {
      userId,
    });
  }

  /**
   * Publish statement closed
   */
  async publishStatementClosed(statementData: any, metadata?: any): Promise<void> {
    await this.publishMessage(KAFKA_TOPICS.STATEMENTS_CLOSED, statementData, {
      headers: metadata,
    });
  }

  /**
   * Publish dispute submitted
   */
  async publishDisputeSubmitted(disputeData: any, metadata?: any): Promise<void> {
    await this.publishMessage(KAFKA_TOPICS.DISPUTES_SUBMITTED, disputeData, {
      headers: metadata,
    });
  }

  /**
   * Publish dispute updates
   */
  async publishDisputeUpdated(disputeData: any, metadata?: any): Promise<void> {
    await this.publishMessage(KAFKA_TOPICS.DISPUTES_UPDATES, disputeData, {
      headers: metadata,
    });
  }

  /**
   * Publish payment initiated
   */
  async publishPaymentInitiated(paymentData: any, metadata?: any): Promise<void> {
    await this.publishMessage(KAFKA_TOPICS.PAYMENTS_INITIATED, paymentData, {
      headers: metadata,
    });
  }

  /**
   * Publish payment completed
   */
  async publishPaymentCompleted(paymentData: any, metadata?: any): Promise<void> {
    await this.publishMessage(KAFKA_TOPICS.PAYMENTS_COMPLETED, paymentData, {
      headers: metadata,
    });
  }

  /**
   * Publish connector health update
   */
  async publishConnectorHealth(connectorData: any, metadata?: any): Promise<void> {
    await this.publishMessage(KAFKA_TOPICS.CONNECTOR_HEALTH, connectorData, {
      headers: metadata,
    });
  }

  /**
   * Get consumer lag
   */
  async getConsumerLag(groupId: string): Promise<any> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const groupOffsets = await admin.fetchOffsets({ groupId });
      const topicMetadata = await admin.fetchTopicMetadata({ topics: [] });

      const lagInfo: any = {};

      for (const topic of groupOffsets) {
        const metadata = topicMetadata.topics.find(t => t.name === topic.topic);
        if (!metadata) continue;

        for (const partition of topic.partitions) {
          const partitionMetadata = metadata.partitions.find(p => p.partitionId === partition.partition);
          if (!partitionMetadata) continue;

          const highWaterMark = partitionMetadata.leaderHighWatermark;
          const currentOffset = parseInt(partition.offset);
          const lag = Math.max(0, highWaterMark - currentOffset);

          if (!lagInfo[topic.topic]) {
            lagInfo[topic.topic] = {};
          }

          lagInfo[topic.topic][partition.partition] = {
            currentOffset,
            highWaterMark,
            lag,
          };
        }
      }

      await admin.disconnect();
      return lagInfo;
    } catch (error) {
      this.logger.error('Failed to get consumer lag:', error);
      throw error;
    }
  }

  /**
   * Get topic metadata
   */
  async getTopicMetadata(topics?: string[]): Promise<any> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const metadata = await admin.fetchTopicMetadata({ topics });
      await admin.disconnect();

      return metadata;
    } catch (error) {
      this.logger.error('Failed to get topic metadata:', error);
      throw error;
    }
  }

  /**
   * Get consumer groups
   */
  async getConsumerGroups(): Promise<any> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const groups = await admin.listGroups();
      await admin.disconnect();

      return groups;
    } catch (error) {
      this.logger.error('Failed to get consumer groups:', error);
      throw error;
    }
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    try {
      // Close all consumers
      for (const [topic, consumer] of this.consumers) {
        await consumer.disconnect();
        this.logger.info(`Disconnected consumer for topic ${topic}`);
      }
      this.consumers.clear();

      // Close producer
      if (this.producer) {
        await this.producer.disconnect();
        this.producer = null;
        this.logger.info('Disconnected Kafka producer');
      }

      this.logger.info('Kafka service closed successfully');
    } catch (error) {
      this.logger.error('Error closing Kafka service:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();
      return true;
    } catch (error) {
      this.logger.error('Kafka health check failed:', error);
      return false;
    }
  }
}
