import knex from '../../../config/db.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

export const findUserByEmail = (email) =>
  knex('byt_users').where({ email }).first();

export const findUserByPhone = (phone_no) =>
  knex('byt_users').where({ phone_no }).first();

export const findUserById = (id) =>
  knex('byt_users').where({ id }).first();

export const findUserByIdentity = (identity) =>
  knex('byt_users')
    .where(function () {
      this.where('email', identity).orWhere('phone_no', identity);
    })
    .first();

export const createUser = (userData) =>
  knex('byt_users').insert(userData).returning('*');

export const findApiCredential = (client_id) =>
  knex('byt_api_credentials').where({ client_id, status: true }).first();

export const insertFailedAttempt = (user_id, identity) =>
  knex('byt_failed_attempts')
    .insert({
      user_id,
      identity,
      attempt_count: 1,
      last_attempt_at: knex.fn.now()
    })
    .onConflict('user_id')
    .merge({
      attempt_count: knex.raw('"byt_failed_attempts"."attempt_count" + 1'),
      last_attempt_at: knex.fn.now()
    });

export const getFailedAttempt = (user_id) =>
  knex('byt_failed_attempts').where({ user_id }).first();

export const resetFailedAttempts = (user_id) =>
  knex('byt_failed_attempts').where({ user_id }).del();

export const insertUserSession = (sessionData) =>
  knex('byt_user_sessions').insert(sessionData);

export const findSessionByToken = (refresh_token, user_id) =>
  knex('byt_user_sessions')
    .where({ refresh_token, user_id })
    .andWhere('expires_at', '>', knex.fn.now())
    .first();

export const deleteSessionById = (id) =>
  knex('byt_user_sessions').where({ id }).del();

export const getActiveSessionsByUserId = (user_id) =>
  knex('byt_user_sessions')
    .where({ user_id })
    .andWhere('expires_at', '>', knex.fn.now())
    .orderBy('created_at', 'desc');

export const deleteAllSessionsByUserId = (user_id) =>
  knex('byt_user_sessions').where({ user_id }).del();

export const deleteSessionByUserIdAndSessionId = (user_id, session_id) =>
  knex('byt_user_sessions')
    .where({ user_id, id: session_id })
    .del();

export const updateSessionLastActivity = (session_id) =>
  knex('byt_user_sessions')
    .where({ id: session_id })
    .update({ last_activity: knex.fn.now() });

export const markAllSessionsNotCurrent = (user_id) =>
  knex('byt_user_sessions')
    .where({ user_id })
    .update({ is_current_session: false });

export const insertPasswordReset = (resetData) =>
  knex('byt_password_resets').insert(resetData);

export const findPasswordResetByToken = (token) =>
  knex('byt_password_resets')
    .where({ token })
    .andWhere('expires_at', '>', knex.fn.now())
    .first();

export const deletePasswordResetByUserId = (user_id) =>
  knex('byt_password_resets').where({ user_id }).del();

export const updateUserPassword = (userId, hashedPassword) =>
  knex('byt_users').where({ id: userId }).update({ password: hashedPassword });

export const updateUserProfile = (userId, updateData) =>
  knex('byt_users').where({ id: userId }).update(updateData);
