/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Drop the existing check constraint
  await knex.raw(`ALTER TABLE byt_email_configurations DROP CONSTRAINT IF EXISTS byt_email_configurations_config_type_check`);

  // Add the new check constraint with 'sendgrid' included
  await knex.raw(`ALTER TABLE byt_email_configurations ADD CONSTRAINT byt_email_configurations_config_type_check CHECK (config_type IN ('smtp', 'gmail_app_password', 'oauth2', 'sendgrid'))`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Drop the new check constraint
  await knex.raw(`ALTER TABLE byt_email_configurations DROP CONSTRAINT IF EXISTS byt_email_configurations_config_type_check`);

  // Add back the old check constraint without 'sendgrid'
  await knex.raw(`ALTER TABLE byt_email_configurations ADD CONSTRAINT byt_email_configurations_config_type_check CHECK (config_type IN ('smtp', 'gmail_app_password', 'oauth2'))`);
};
