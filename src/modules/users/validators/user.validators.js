import { body } from 'express-validator';

export const validateUser = [
    body('firstname').optional().isString().withMessage('First name must be a string'),
    body('lastname').optional().isString().withMessage('Last name must be a string'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone_no').optional().isString().withMessage('Phone number must be a string'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    // Vehicle number is required for delivery person role
    body('vehicle_number')
        .if(body('role').equals('delivery_person'))
        .notEmpty()
        .withMessage('Vehicle number is required for delivery person role')
        .isString()
        .withMessage('Vehicle number must be a string'),
    // Add more validation rules as needed
];
