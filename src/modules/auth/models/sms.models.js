import knex from '../../../config/db.js';

export async function createSmsConfiguration(data) {
  const [config] = await knex('byt_sms_configurations').insert(data).returning('*');
  return config;
}

export async function getSmsConfiguration(provider) {
  return await knex('byt_sms_configurations').where({ provider }).first();
}

export async function getAllSmsConfigurations() {
  return await knex('byt_sms_configurations').select('*');
}

export async function updateSmsConfiguration(id, data) {
  const [config] = await knex('byt_sms_configurations').where({ id }).update(data).returning('*');
  return config;
}

export async function deleteSmsConfiguration(id) {
  return await knex('byt_sms_configurations').where({ id }).del();
}

export async function createOtpRecord(data) {
  const [otp] = await knex('byt_otp_records').insert(data).returning('*');
  return otp;
}

export async function getOtpRecord(phone, otp) {
  return await knex('byt_otp_records')
    .where({ phone, otp })
    .andWhere('expires_at', '>', knex.fn.now())
    .first();
}

export async function deleteOtpRecord(id) {
  return await knex('byt_otp_records').where({ id }).del();
}

export async function cleanupExpiredOtps() {
  return await knex('byt_otp_records').where('expires_at', '<', knex.fn.now()).del();
}

// OTP Send Attempts Tracking
export async function logOtpSendAttempt(phone, userId) {
  const [attempt] = await knex('byt_otp_send_attempts').insert({
    phone: phone,
    user_id: userId,
    attempt_date: knex.fn.now()
  }).returning('*');
  return attempt;
}

export async function countOtpSendsToday(phone, todayStart) {
  const result = await knex('byt_otp_send_attempts')
    .where('phone', phone)
    .andWhere('attempt_date', '>=', todayStart)
    .count('id as count')
    .first();
  return parseInt(result.count) || 0;
}

export async function getLastOtpSend(phone) {
  return await knex('byt_otp_send_attempts')
    .where('phone', phone)
    .orderBy('attempt_date', 'desc')
    .first();
}

// Cleanup old OTP send attempts (older than 30 days)
export async function cleanupOldOtpAttempts() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return await knex('byt_otp_send_attempts').where('attempt_date', '<', thirtyDaysAgo).del();
}
