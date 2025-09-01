import Joi from 'joi';

export const createOrderSchema = Joi.object({
  user_id: Joi.number().integer().positive().required(),
  total_amount: Joi.number().positive().precision(2).required(),
  status: Joi.string().valid('awaiting_confirmation', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').default('awaiting_confirmation'),
  payment_status: Joi.string().valid('pending', 'paid', 'failed', 'refunded').default('pending'),
  delivery_vehicle: Joi.string().optional(),
  delivery_driver: Joi.string().optional(),
  delivery_address: Joi.string().optional(),
  delivery_phone: Joi.string().optional(),
  notes: Joi.string().optional(),
  order_date: Joi.date().optional(),
  delivery_date: Joi.date().optional()
});

export const updateOrderSchema = Joi.object({
  user_id: Joi.number().integer().positive().optional(),
  total_amount: Joi.number().positive().precision(2).optional(),
  status: Joi.string().valid('awaiting_confirmation', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
  payment_status: Joi.string().valid('pending', 'paid', 'failed', 'refunded').optional(),
  delivery_vehicle: Joi.string().optional(),
  delivery_driver: Joi.string().optional(),
  delivery_address: Joi.string().optional(),
  delivery_phone: Joi.string().optional(),
  notes: Joi.string().optional(),
  order_date: Joi.date().optional(),
  delivery_date: Joi.date().optional()
});

export const orderIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const statusSchema = Joi.object({
  status: Joi.string().valid('awaiting_confirmation', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').required()
});

export const userIdSchema = Joi.object({
  userId: Joi.number().integer().positive().required()
});
