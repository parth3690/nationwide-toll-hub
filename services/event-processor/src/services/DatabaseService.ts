import { Pool } from 'pg';
import { Vehicle, TollEvent } from '@toll-hub/shared';

/**
 * Database Service for Event Processor
 * 
 * Provides database operations specific to event processing:
 * - Vehicle lookup for event matching
 * - Toll event creation and updates
 * - Statement draft management
 * - Performance optimization
 */

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.DATABASE_POOL_MAX || '20'),
      min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      query_timeout: 30000,
    });
  }

  /**
   * Get vehicles by plate and state
   */
  async getVehiclesByPlate(plate: string, plateState: string): Promise<Vehicle[]> {
    const query = `
      SELECT id, user_id, plate, plate_state, vehicle_type, axle_count, 
             class, nickname, active, created_at, updated_at
      FROM vehicles 
      WHERE plate = $1 AND plate_state = $2 AND active = true
      ORDER BY created_at DESC
    `;
    
    const result = await this.pool.query(query, [plate.toUpperCase(), plateState.toUpperCase()]);
    return result.rows;
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(id: string): Promise<Vehicle | null> {
    const query = `
      SELECT id, user_id, plate, plate_state, vehicle_type, axle_count, 
             class, nickname, active, created_at, updated_at
      FROM vehicles 
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create toll event
   */
  async createTollEvent(event: Partial<TollEvent>): Promise<TollEvent> {
    const query = `
      INSERT INTO toll_events (id, user_id, vehicle_id, agency_id, external_event_id, 
                              plate, plate_state, event_timestamp, gantry_id, location, 
                              vehicle_class, raw_amount, rated_amount, fees, currency, 
                              evidence_uri, source, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `;
    
    const values = [
      event.id,
      event.userId,
      event.vehicleId,
      event.agencyId,
      event.externalEventId,
      event.plate,
      event.plateState,
      event.eventTimestamp,
      event.gantryId,
      event.location,
      event.vehicleClass,
      event.rawAmount,
      event.ratedAmount,
      event.fees || 0,
      event.currency || 'USD',
      event.evidenceUri,
      event.source,
      event.status || 'pending',
      event.createdAt || new Date(),
      event.updatedAt || new Date(),
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update toll event
   */
  async updateTollEvent(id: string, updates: Partial<TollEvent>): Promise<TollEvent> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE toll_events 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [id, ...Object.values(updates)];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get toll events by user and date range
   */
  async getTollEventsByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TollEvent[]> {
    const query = `
      SELECT id, user_id, vehicle_id, agency_id, external_event_id, 
             plate, plate_state, event_timestamp, gantry_id, location, 
             vehicle_class, raw_amount, rated_amount, fees, currency, 
             evidence_uri, source, status, created_at, updated_at
      FROM toll_events 
      WHERE user_id = $1 
        AND event_timestamp >= $2 
        AND event_timestamp <= $3 
        AND status = 'posted'
      ORDER BY event_timestamp DESC
    `;
    
    const result = await this.pool.query(query, [userId, startDate, endDate]);
    return result.rows;
  }

  /**
   * Get statement draft for user
   */
  async getStatementDraft(userId: string, periodStart: Date, periodEnd: Date): Promise<any> {
    const query = `
      SELECT id, user_id, period_start, period_end, timezone, subtotal, 
             fees, credits, total, status, created_at, updated_at
      FROM statements 
      WHERE user_id = $1 
        AND period_start = $2 
        AND period_end = $3 
        AND status = 'draft'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = await this.pool.query(query, [userId, periodStart, periodEnd]);
    return result.rows[0] || null;
  }

  /**
   * Create statement draft
   */
  async createStatementDraft(draft: any): Promise<any> {
    const query = `
      INSERT INTO statements (id, user_id, period_start, period_end, timezone, subtotal, 
                             fees, credits, total, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      draft.id,
      draft.userId,
      draft.periodStart,
      draft.periodEnd,
      draft.timezone,
      draft.subtotal,
      draft.fees || 0,
      draft.credits || 0,
      draft.total,
      draft.status || 'draft',
      draft.createdAt || new Date(),
      draft.updatedAt || new Date(),
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update statement draft
   */
  async updateStatementDraft(id: string, updates: any): Promise<any> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE statements 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [id, ...Object.values(updates)];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<any> {
    const query = `
      SELECT id, email, email_verified, status, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Close connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
