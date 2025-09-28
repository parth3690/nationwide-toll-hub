import dotenv from 'dotenv';
import { EventProcessor } from './services/EventProcessor';
import { TollEventMatcher } from './services/TollEventMatcher';
import { StatementGenerator } from './services/StatementGenerator';

// Load environment variables
dotenv.config();

/**
 * Elite Event Processor Service
 * 
 * This is the main entry point for the Toll Hub Event Processor Service.
 * It provides comprehensive event processing functionality for the entire
 * Toll Hub platform using Kafka-based event streaming.
 * 
 * Key Features:
 * - Raw event ingestion and validation
 * - Event normalization and transformation
 * - User and vehicle matching
 * - Deduplication and conflict resolution
 * - Rate calculation and class mapping
 * - Statement draft updates
 * - Payment processing
 * - Dispute handling
 * 
 * Architecture Decisions:
 * - Kafka-based event streaming for scalability
 * - Event-driven architecture for loose coupling
 * - Comprehensive validation and error handling
 * - Redis for deduplication and caching
 * - PostgreSQL for persistence and consistency
 * - Structured logging for observability
 */

const eventProcessor = new EventProcessor();

async function start() {
  try {
    console.log('🚀 Starting Event Processor Service...');
    
    // Initialize event processor
    await eventProcessor.initialize();
    
    console.log('✅ Event Processor Service started successfully');
    console.log(`📊 Processing events from Kafka brokers: ${process.env.KAFKA_BROKERS || 'localhost:9092'}`);
    console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not connected'}`);
    console.log(`⚡ Redis: ${process.env.REDIS_URL ? 'Connected' : 'Not connected'}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    console.error('❌ Failed to start Event Processor Service:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
async function shutdown() {
  try {
    console.log('🛑 Shutting down Event Processor Service...');
    await eventProcessor.close();
    console.log('✅ Event Processor Service shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});

// Handle SIGTERM
process.on('SIGTERM', shutdown);

// Handle SIGINT
process.on('SIGINT', shutdown);

// Start the service
start();
