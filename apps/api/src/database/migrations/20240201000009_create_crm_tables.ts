import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // CRM Contacts table
  await knex.schema.createTable('crm_contacts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('customer_id').nullable().references('id').inTable('customers').onDelete('SET NULL');
    table.string('name').notNullable();
    table.string('title').nullable();
    table.string('email').nullable();
    table.string('phone').nullable();
    table.string('mobile').nullable();
    table.enum('status', ['lead', 'prospect', 'customer', 'inactive']).defaultTo('lead');
    table.enum('source', ['website', 'referral', 'social', 'cold_call', 'event', 'other']).nullable();
    table.text('notes').nullable();
    table.jsonb('custom_fields').defaultTo('{}');
    table.uuid('assigned_to').nullable();
    table.date('last_contact_date').nullable();
    table.date('next_follow_up').nullable();
    table.timestamps(true, true);
  });

  // CRM Activities table
  await knex.schema.createTable('crm_activities', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('contact_id').notNullable().references('id').inTable('crm_contacts').onDelete('CASCADE');
    table.enum('type', ['call', 'email', 'meeting', 'note', 'task']).notNullable();
    table.string('subject').notNullable();
    table.text('description').nullable();
    table.enum('status', ['planned', 'completed', 'cancelled']).defaultTo('planned');
    table.timestamp('scheduled_at').nullable();
    table.timestamp('completed_at').nullable();
    table.integer('duration_minutes').nullable();
    table.jsonb('outcome').defaultTo('{}');
    table.uuid('created_by').nullable();
    table.timestamps(true, true);
  });

  // Field Team Routes table
  await knex.schema.createTable('field_team_routes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.date('route_date').notNullable();
    table.uuid('assigned_to').nullable();
    table.enum('status', ['planned', 'in_progress', 'completed', 'cancelled']).defaultTo('planned');
    table.text('notes').nullable();
    table.integer('estimated_duration_minutes').nullable();
    table.integer('actual_duration_minutes').nullable();
    table.timestamps(true, true);
  });

  // Field Team Visits table
  await knex.schema.createTable('field_team_visits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('route_id').notNullable().references('id').inTable('field_team_routes').onDelete('CASCADE');
    table.uuid('customer_id').nullable().references('id').inTable('customers').onDelete('SET NULL');
    table.uuid('contact_id').nullable().references('id').inTable('crm_contacts').onDelete('SET NULL');
    table.integer('visit_order').notNullable().defaultTo(1);
    table.enum('status', ['pending', 'in_progress', 'completed', 'skipped', 'rescheduled']).defaultTo('pending');
    table.enum('visit_type', ['sales', 'support', 'collection', 'delivery', 'meeting', 'other']).defaultTo('sales');
    table.text('address').nullable();
    table.decimal('latitude', 10, 8).nullable();
    table.decimal('longitude', 11, 8).nullable();
    table.timestamp('scheduled_time').nullable();
    table.timestamp('check_in_time').nullable();
    table.timestamp('check_out_time').nullable();
    table.text('notes').nullable();
    table.text('outcome').nullable();
    table.jsonb('photos').defaultTo('[]');
    table.timestamps(true, true);
  });

  // Indexes
  await knex.schema.raw('CREATE INDEX idx_crm_contacts_customer ON crm_contacts(customer_id)');
  await knex.schema.raw('CREATE INDEX idx_crm_contacts_status ON crm_contacts(status)');
  await knex.schema.raw('CREATE INDEX idx_crm_activities_contact ON crm_activities(contact_id)');
  await knex.schema.raw('CREATE INDEX idx_field_routes_date ON field_team_routes(route_date)');
  await knex.schema.raw('CREATE INDEX idx_field_visits_route ON field_team_visits(route_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('field_team_visits');
  await knex.schema.dropTableIfExists('field_team_routes');
  await knex.schema.dropTableIfExists('crm_activities');
  await knex.schema.dropTableIfExists('crm_contacts');
}
