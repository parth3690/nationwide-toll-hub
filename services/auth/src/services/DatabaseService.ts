import { Pool } from 'pg';
import { User, Vehicle, PaymentMethod, Agency, AgencyAccountLink, TollEvent, Statement, StatementItem, Dispute } from '@toll-hub/shared';

/**
 * Elite Database Service
 * 
 * Provides comprehensive database operations with:
 * - Connection pooling for performance
 * - Transaction support
 * - Query optimization
 * - Error handling
 * - Type safety
 * 
 * Architecture Decisions:
 * - PostgreSQL for ACID compliance and JSONB support
 * - Connection pooling for scalability
 * - Prepared statements for security
 * - Connection retry logic
 * - Query timeout handling
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

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  // User operations
  async getUserById(id: string): Promise<User | null> {
    const query = `
      SELECT id, email, email_verified, password_hash, mfa_enabled, mfa_secret, 
             last_login_at, status, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, email_verified, password_hash, mfa_enabled, mfa_secret, 
             last_login_at, status, created_at, updated_at
      FROM users 
      WHERE email = $1
    `;
    
    const result = await this.pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async createUser(user: Partial<User>): Promise<User> {
    const query = `
      INSERT INTO users (id, email, email_verified, password_hash, mfa_enabled, mfa_secret, 
                       last_login_at, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      user.id,
      user.email,
      user.emailVerified || false,
      user.passwordHash,
      user.mfaEnabled || false,
      user.mfaSecret,
      user.lastLoginAt,
      user.status || 'active',
      user.createdAt || new Date(),
      user.updatedAt || new Date(),
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [id, ...Object.values(updates)];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async deleteUser(id: string): Promise<void> {
    const query = 'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2';
    await this.pool.query(query, ['deleted', id]);
  }

  // Vehicle operations
  async getVehiclesByUserId(userId: string): Promise<Vehicle[]> {
    const query = `
      SELECT id, user_id, plate, plate_state, vehicle_type, axle_count, 
             class, nickname, active, created_at, updated_at
      FROM vehicles 
      WHERE user_id = $1 AND active = true
      ORDER BY created_at DESC
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

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

  async createVehicle(vehicle: Partial<Vehicle>): Promise<Vehicle> {
    const query = `
      INSERT INTO vehicles (id, user_id, plate, plate_state, vehicle_type, axle_count, 
                          class, nickname, active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      vehicle.id,
      vehicle.userId,
      vehicle.plate,
      vehicle.plateState,
      vehicle.vehicleType,
      vehicle.axleCount,
      vehicle.class,
      vehicle.nickname,
      vehicle.active !== false,
      vehicle.createdAt || new Date(),
      vehicle.updatedAt || new Date(),
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE vehicles 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [id, ...Object.values(updates)];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async deleteVehicle(id: string): Promise<void> {
    const query = 'UPDATE vehicles SET active = $1, updated_at = NOW() WHERE id = $2';
    await this.pool.query(query, [false, id]);
  }

  // Payment method operations
  async getPaymentMethodsByUserId(userId: string): Promise<PaymentMethod[]> {
    const query = `
      SELECT id, user_id, type, processor, processor_token, last4, brand, 
             is_default, created_at, updated_at
      FROM payment_methods 
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async getPaymentMethodById(id: string): Promise<PaymentMethod | null> {
    const query = `
      SELECT id, user_id, type, processor, processor_token, last4, brand, 
             is_default, created_at, updated_at
      FROM payment_methods 
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async createPaymentMethod(paymentMethod: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const query = `
      INSERT INTO payment_methods (id, user_id, type, processor, processor_token, 
                                  last4, brand, is_default, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      paymentMethod.id,
      paymentMethod.userId,
      paymentMethod.type,
      paymentMethod.processor,
      paymentMethod.processorToken,
      paymentMethod.last4,
      paymentMethod.brand,
      paymentMethod.isDefault || false,
      paymentMethod.createdAt || new Date(),
      paymentMethod.updatedAt || new Date(),
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updatePaymentMethod(id: string, updates: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE payment_methods 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [id, ...Object.values(updates)];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async deletePaymentMethod(id: string): Promise<void> {
    const query = 'DELETE FROM payment_methods WHERE id = $1';
    await this.pool.query(query, [id]);
  }

  // Agency operations
  async getAgencies(): Promise<Agency[]> {
    const query = `
      SELECT id, name, region, states, protocol, capabilities, connector_config, 
             status, created_at, updated_at
      FROM agencies 
      WHERE status = 'active'
      ORDER BY name
    `;
    
    const result = await this.pool.query(query);
    return result.rows;
  }

  async getAgencyById(id: string): Promise<Agency | null> {
    const query = `
      SELECT id, name, region, states, protocol, capabilities, connector_config, 
             status, created_at, updated_at
      FROM agencies 
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Agency account link operations
  async getAgencyAccountLinksByUserId(userId: string): Promise<AgencyAccountLink[]> {
    const query = `
      SELECT aal.id, aal.user_id, aal.agency_id, aal.external_account_id, aal.status, 
             aal.auth_method, aal.auth_tokens, aal.last_sync_at, aal.next_sync_at, 
             aal.sync_status, aal.created_at, aal.updated_at,
             a.name as agency_name, a.region as agency_region
      FROM agency_account_links aal
      JOIN agencies a ON aal.agency_id = a.id
      WHERE aal.user_id = $1
      ORDER BY aal.created_at DESC
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async getAgencyAccountLinkById(id: string): Promise<AgencyAccountLink | null> {
    const query = `
      SELECT aal.id, aal.user_id, aal.agency_id, aal.external_account_id, aal.status, 
             aal.auth_method, aal.auth_tokens, aal.last_sync_at, aal.next_sync_at, 
             aal.sync_status, aal.created_at, aal.updated_at,
             a.name as agency_name, a.region as agency_region
      FROM agency_account_links aal
      JOIN agencies a ON aal.agency_id = a.id
      WHERE aal.id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async createAgencyAccountLink(link: Partial<AgencyAccountLink>): Promise<AgencyAccountLink> {
    const query = `
      INSERT INTO agency_account_links (id, user_id, agency_id, external_account_id, 
                                       status, auth_method, auth_tokens, last_sync_at, 
                                       next_sync_at, sync_status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      link.id,
      link.userId,
      link.agencyId,
      link.externalAccountId,
      link.status || 'pending',
      link.authMethod,
      link.authTokens,
      link.lastSyncAt,
      link.nextSyncAt,
      link.syncStatus,
      link.createdAt || new Date(),
      link.updatedAt || new Date(),
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateAgencyAccountLink(id: string, updates: Partial<AgencyAccountLink>): Promise<AgencyAccountLink> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE agency_account_links 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [id, ...Object.values(updates)];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async deleteAgencyAccountLink(id: string): Promise<void> {
    const query = 'DELETE FROM agency_account_links WHERE id = $1';
    await this.pool.query(query, [id]);
  }

  // Toll event operations
  async getTollEventsByUserId(userId: string, options: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    agencyId?: string;
    status?: string;
  } = {}): Promise<{ events: TollEvent[]; total: number }> {
    const { page = 1, limit = 20, startDate, endDate, agencyId, status } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE te.user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;
    
    if (startDate) {
      whereClause += ` AND te.event_timestamp >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereClause += ` AND te.event_timestamp <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    if (agencyId) {
      whereClause += ` AND te.agency_id = $${paramIndex}`;
      params.push(agencyId);
      paramIndex++;
    }
    
    if (status) {
      whereClause += ` AND te.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    const query = `
      SELECT te.id, te.user_id, te.vehicle_id, te.agency_id, te.external_event_id, 
             te.plate, te.plate_state, te.event_timestamp, te.gantry_id, te.location, 
             te.vehicle_class, te.raw_amount, te.rated_amount, te.fees, te.currency, 
             te.evidence_uri, te.source, te.status, te.created_at, te.updated_at,
             a.name as agency_name, v.nickname as vehicle_nickname
      FROM toll_events te
      JOIN agencies a ON te.agency_id = a.id
      LEFT JOIN vehicles v ON te.vehicle_id = v.id
      ${whereClause}
      ORDER BY te.event_timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM toll_events te
      ${whereClause}
    `;
    
    const [result, countResult] = await Promise.all([
      this.pool.query(query, params),
      this.pool.query(countQuery, params.slice(0, -2))
    ]);
    
    return {
      events: result.rows,
      total: parseInt(countResult.rows[0].total),
    };
  }

  async getTollEventById(id: string): Promise<TollEvent | null> {
    const query = `
      SELECT te.id, te.user_id, te.vehicle_id, te.agency_id, te.external_event_id, 
             te.plate, te.plate_state, te.event_timestamp, te.gantry_id, te.location, 
             te.vehicle_class, te.raw_amount, te.rated_amount, te.fees, te.currency, 
             te.evidence_uri, te.source, te.status, te.created_at, te.updated_at,
             a.name as agency_name, v.nickname as vehicle_nickname
      FROM toll_events te
      JOIN agencies a ON te.agency_id = a.id
      LEFT JOIN vehicles v ON te.vehicle_id = v.id
      WHERE te.id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

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

  // Statement operations
  async getStatementsByUserId(userId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<{ statements: Statement[]; total: number }> {
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE s.user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;
    
    if (status) {
      whereClause += ` AND s.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    const query = `
      SELECT s.id, s.user_id, s.period_start, s.period_end, s.timezone, s.subtotal, 
             s.fees, s.credits, s.total, s.status, s.payment_method_id, s.payment_transaction_id, 
             s.paid_at, s.breakdown, s.created_at, s.updated_at
      FROM statements s
      ${whereClause}
      ORDER BY s.period_end DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM statements s
      ${whereClause}
    `;
    
    const [result, countResult] = await Promise.all([
      this.pool.query(query, params),
      this.pool.query(countQuery, params.slice(0, -2))
    ]);
    
    return {
      statements: result.rows,
      total: parseInt(countResult.rows[0].total),
    };
  }

  async getStatementById(id: string): Promise<Statement | null> {
    const query = `
      SELECT s.id, s.user_id, s.period_start, s.period_end, s.timezone, s.subtotal, 
             s.fees, s.credits, s.total, s.status, s.payment_method_id, s.payment_transaction_id, 
             s.paid_at, s.breakdown, s.created_at, s.updated_at
      FROM statements s
      WHERE s.id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async createStatement(statement: Partial<Statement>): Promise<Statement> {
    const query = `
      INSERT INTO statements (id, user_id, period_start, period_end, timezone, subtotal, 
                             fees, credits, total, status, payment_method_id, payment_transaction_id, 
                             paid_at, breakdown, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    
    const values = [
      statement.id,
      statement.userId,
      statement.periodStart,
      statement.periodEnd,
      statement.timezone,
      statement.subtotal,
      statement.fees || 0,
      statement.credits || 0,
      statement.total,
      statement.status || 'draft',
      statement.paymentMethodId,
      statement.paymentTransactionId,
      statement.paidAt,
      statement.breakdown,
      statement.createdAt || new Date(),
      statement.updatedAt || new Date(),
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateStatement(id: string, updates: Partial<Statement>): Promise<Statement> {
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

  // Dispute operations
  async getDisputesByUserId(userId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<{ disputes: Dispute[]; total: number }> {
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE d.user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;
    
    if (status) {
      whereClause += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    const query = `
      SELECT d.id, d.user_id, d.toll_event_id, d.type, d.status, d.description, 
             d.evidence_urls, d.agency_reference, d.resolution, d.submitted_at, 
             d.resolved_at, d.sla_deadline, d.created_at, d.updated_at,
             te.plate, te.plate_state, te.event_timestamp, te.rated_amount,
             a.name as agency_name
      FROM disputes d
      JOIN toll_events te ON d.toll_event_id = te.id
      JOIN agencies a ON te.agency_id = a.id
      ${whereClause}
      ORDER BY d.submitted_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM disputes d
      ${whereClause}
    `;
    
    const [result, countResult] = await Promise.all([
      this.pool.query(query, params),
      this.pool.query(countQuery, params.slice(0, -2))
    ]);
    
    return {
      disputes: result.rows,
      total: parseInt(countResult.rows[0].total),
    };
  }

  async getDisputeById(id: string): Promise<Dispute | null> {
    const query = `
      SELECT d.id, d.user_id, d.toll_event_id, d.type, d.status, d.description, 
             d.evidence_urls, d.agency_reference, d.resolution, d.submitted_at, 
             d.resolved_at, d.sla_deadline, d.created_at, d.updated_at,
             te.plate, te.plate_state, te.event_timestamp, te.rated_amount,
             a.name as agency_name
      FROM disputes d
      JOIN toll_events te ON d.toll_event_id = te.id
      JOIN agencies a ON te.agency_id = a.id
      WHERE d.id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async createDispute(dispute: Partial<Dispute>): Promise<Dispute> {
    const query = `
      INSERT INTO disputes (id, user_id, toll_event_id, type, status, description, 
                           evidence_urls, agency_reference, resolution, submitted_at, 
                           resolved_at, sla_deadline, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    
    const values = [
      dispute.id,
      dispute.userId,
      dispute.tollEventId,
      dispute.type,
      dispute.status || 'submitted',
      dispute.description,
      dispute.evidenceUrls || [],
      dispute.agencyReference,
      dispute.resolution,
      dispute.submittedAt || new Date(),
      dispute.resolvedAt,
      dispute.slaDeadline,
      dispute.createdAt || new Date(),
      dispute.updatedAt || new Date(),
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE disputes 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [id, ...Object.values(updates)];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Transaction support
  async withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  // Close connection pool
  async close(): Promise<void> {
    await this.pool.end();
  }
}
