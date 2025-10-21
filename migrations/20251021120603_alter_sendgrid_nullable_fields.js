/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Make SMTP fields nullable for sendgrid configurations
  await knex.schema.alterTable('byt_email_configurations', function(table) {
    table.string('smtp_host').nullable().alter();
    table.integer('smtp_port').nullable().alter();
    table.string('smtp_user').nullable().alter();
    table.string('smtp_password').nullable().alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Make SMTP fields not nullable again (assuming they were originally not nullable)
  await knex.schema.alterTable('byt_email_configurations', function(table) {
    table.string('smtp_host').notNullable().alter();
    table.integer('smtp_port').notNullable().alter();
    table.string('smtp_user').notNullable().alter();
    table.string('smtp_password').notNullable().alter();
  });
};
