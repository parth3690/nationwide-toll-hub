import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  
  // Enable JSONB operators
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "btree_gin"');

  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email', 255).unique().notNullable();
    table.boolean('email_verified').defaultTo(false);
    table.string('password_hash', 255);
    table.boolean('mfa_enabled').defaultTo(false);
    table.string('mfa_secret', 255);
    table.timestamp('last_login_at');
    table.enum('status', ['active', 'suspended', 'deleted']).defaultTo('active');
    table.timestamps(true, true);
    
    table.index(['email']);
    table.index(['status']);
    table.index(['created_at']);
  });

  // Vehicles table
  await knex.schema.createTable('vehicles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('plate', 20).notNullable();
    table.string('plate_state', 2).notNullable();
    table.string('vehicle_type', 50);
    table.integer('axle_count');
    table.string('class', 50);
    table.string('nickname', 100);
    table.boolean('active').defaultTo(true);
    table.timestamps(true, true);
    
    table.unique(['user_id', 'plate', 'plate_state']);
    table.index(['user_id']);
    table.index(['plate', 'plate_state']);
    table.index(['active']);
  });

  // Payment methods table
  await knex.schema.createTable('payment_methods', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.enum('type', ['card', 'ach']).notNullable();
    table.string('processor', 50).notNullable();
    table.string('processor_token', 255).notNullable();
    table.string('last4', 4);
    table.string('brand', 50);
    table.boolean('is_default').defaultTo(false);
    table.timestamps(true, true);
    
    table.index(['user_id']);
    table.index(['type']);
    table.index(['is_default']);
  });

  // Agencies table
  await knex.schema.createTable('agencies', (table) => {
    table.string('id', 50).primary();
    table.string('name', 255).notNullable();
    table.string('region', 100);
    table.specificType('states', 'text[]');
    table.enum('protocol', ['ezpass', 'sunpass', 'fastrak', 'txtag', 'mta', 'proprietary']).notNullable();
    table.jsonb('capabilities').notNullable();
    table.jsonb('connector_config');
    table.enum('status', ['active', 'inactive', 'maintenance']).defaultTo('active');
    table.timestamps(true, true);
    
    table.index(['status']);
    table.index(['protocol']);
    table.index(['states'], 'gin');
  });

  // Agency account links table
  await knex.schema.createTable('agency_account_links', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('agency_id', 50).references('id').inTable('agencies').onDelete('CASCADE');
    table.string('external_account_id', 255).notNullable();
    table.enum('status', ['pending', 'active', 'failed', 'revoked']).defaultTo('pending');
    table.enum('auth_method', ['oauth', 'credentials']).notNullable();
    table.jsonb('auth_tokens');
    table.timestamp('last_sync_at');
    table.timestamp('next_sync_at');
    table.enum('sync_status', ['success', 'failed', 'pending']);
    table.timestamps(true, true);
    
    table.unique(['user_id', 'agency_id']);
    table.index(['user_id']);
    table.index(['agency_id']);
    table.index(['status']);
    table.index(['sync_status']);
  });

  // Toll events table (will be partitioned)
  await knex.schema.createTable('toll_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('vehicle_id').references('id').inTable('vehicles').onDelete('CASCADE');
    table.string('agency_id', 50).references('id').inTable('agencies').onDelete('CASCADE');
    table.string('external_event_id', 255).notNullable();
    table.string('plate', 20).notNullable();
    table.string('plate_state', 2).notNullable();
    table.timestamp('event_timestamp').notNullable();
    table.string('gantry_id', 255);
    table.jsonb('location');
    table.string('vehicle_class', 50);
    table.decimal('raw_amount', 10, 2).notNullable();
    table.decimal('rated_amount', 10, 2).notNullable();
    table.decimal('fees', 10, 2).defaultTo(0);
    table.string('currency', 3).defaultTo('USD');
    table.text('evidence_uri');
    table.enum('source', ['agency_feed', 'plate_pay', 'manual']).notNullable();
    table.enum('status', ['pending', 'posted', 'disputed', 'voided']).defaultTo('pending');
    table.timestamps(true, true);
    
    table.unique(['agency_id', 'external_event_id']);
    table.index(['user_id', 'event_timestamp']);
    table.index(['vehicle_id', 'event_timestamp']);
    table.index(['agency_id', 'external_event_id']);
    table.index(['event_timestamp']);
    table.index(['status']);
    table.index(['source']);
  });

  // Statements table
  await knex.schema.createTable('statements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('period_start').notNullable();
    table.timestamp('period_end').notNullable();
    table.string('timezone', 50).notNullable();
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('fees', 10, 2).notNullable();
    table.decimal('credits', 10, 2).defaultTo(0);
    table.decimal('total', 10, 2).notNullable();
    table.enum('status', ['draft', 'open', 'closed', 'paid', 'overdue']).defaultTo('draft');
    table.uuid('payment_method_id').references('id').inTable('payment_methods');
    table.string('payment_transaction_id', 255);
    table.timestamp('paid_at');
    table.jsonb('breakdown');
    table.timestamps(true, true);
    
    table.index(['user_id', 'period_end']);
    table.index(['status']);
    table.index(['period_start', 'period_end']);
  });

  // Statement items table
  await knex.schema.createTable('statement_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('statement_id').references('id').inTable('statements').onDelete('CASCADE');
    table.uuid('toll_event_id').references('id').inTable('toll_events').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.timestamps(true, true);
    
    table.index(['statement_id']);
    table.index(['toll_event_id']);
  });

  // Disputes table
  await knex.schema.createTable('disputes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('toll_event_id').references('id').inTable('toll_events').onDelete('CASCADE');
    table.enum('type', ['wrong_plate', 'wrong_class', 'duplicate', 'other']).notNullable();
    table.enum('status', ['submitted', 'in_review', 'resolved', 'rejected']).defaultTo('submitted');
    table.text('description').notNullable();
    table.specificType('evidence_urls', 'text[]');
    table.string('agency_reference', 255);
    table.text('resolution');
    table.timestamp('submitted_at').notNullable();
    table.timestamp('resolved_at');
    table.timestamp('sla_deadline');
    table.timestamps(true, true);
    
    table.index(['user_id']);
    table.index(['toll_event_id']);
    table.index(['status']);
    table.index(['type']);
    table.index(['submitted_at']);
  });

  // Audit logs table
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id');
    table.string('entity_type', 50).notNullable();
    table.uuid('entity_id');
    table.string('action', 50).notNullable();
    table.jsonb('changes');
    table.inet('ip_address');
    table.text('user_agent');
    table.timestamps(true, true);
    
    table.index(['user_id']);
    table.index(['entity_type', 'entity_id']);
    table.index(['action']);
    table.index(['created_at']);
  });

  // Create partitions for toll_events table
  await knex.raw(`
    CREATE TABLE toll_events_2025_01 PARTITION OF toll_events
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01')
  `);
  
  await knex.raw(`
    CREATE TABLE toll_events_2025_02 PARTITION OF toll_events
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01')
  `);
  
  await knex.raw(`
    CREATE TABLE toll_events_2025_03 PARTITION OF toll_events
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01')
  `);

  // Create materialized views for common queries
  await knex.raw(`
    CREATE MATERIALIZED VIEW user_toll_summary AS
    SELECT 
      user_id,
      DATE_TRUNC('month', event_timestamp) as month,
      COUNT(*) as event_count,
      SUM(rated_amount) as total_amount,
      SUM(fees) as total_fees
    FROM toll_events
    WHERE status = 'posted'
    GROUP BY user_id, DATE_TRUNC('month', event_timestamp)
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX ON user_toll_summary (user_id, month)
  `);

  // Create indexes for performance
  await knex.raw(`
    CREATE INDEX CONCURRENTLY idx_toll_events_user_date_status 
    ON toll_events (user_id, event_timestamp DESC, status)
  `);

  await knex.raw(`
    CREATE INDEX CONCURRENTLY idx_toll_events_agency_external 
    ON toll_events (agency_id, external_event_id)
  `);

  await knex.raw(`
    CREATE INDEX CONCURRENTLY idx_statements_user_period 
    ON statements (user_id, period_end DESC)
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop materialized views
  await knex.raw('DROP MATERIALIZED VIEW IF EXISTS user_toll_summary');
  
  // Drop partitions
  await knex.raw('DROP TABLE IF EXISTS toll_events_2025_01');
  await knex.raw('DROP TABLE IF EXISTS toll_events_2025_02');
  await knex.raw('DROP TABLE IF EXISTS toll_events_2025_03');
  
  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('disputes');
  await knex.schema.dropTableIfExists('statement_items');
  await knex.schema.dropTableIfExists('statements');
  await knex.schema.dropTableIfExists('toll_events');
  await knex.schema.dropTableIfExists('agency_account_links');
  await knex.schema.dropTableIfExists('agencies');
  await knex.schema.dropTableIfExists('payment_methods');
  await knex.schema.dropTableIfExists('vehicles');
  await knex.schema.dropTableIfExists('users');
}
