import { body } from 'express-validator';

export const validateUser = [
    body('firstname').optional().isString().withMessage('First name must be a string'),
    body('lastname').optional().isString().withMessage('Last name must be a string'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone_no').optional().isString().withMessage('Phone number must be a string'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    // Add more validation rules as needed
];
