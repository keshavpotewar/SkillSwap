const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('location')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  
  body('availability')
    .optional()
    .isIn(['Available', 'Busy', 'Away', 'Not Available'])
    .withMessage('Invalid availability status'),
  
  body('skillsOffered')
    .optional()
    .isArray()
    .withMessage('Skills offered must be an array'),
  
  body('skillsOffered.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Skill name must be between 1 and 100 characters'),
  
  body('skillsWanted')
    .optional()
    .isArray()
    .withMessage('Skills wanted must be an array'),
  
  body('skillsWanted.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Skill name must be between 1 and 100 characters'),
  
  handleValidationErrors
];

// Swap request validation
const validateSwapRequest = [
  body('to')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('skillOffered')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Skill offered must be between 1 and 100 characters'),
  
  body('skillWanted')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Skill wanted must be between 1 and 100 characters'),
  
  body('message')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Message must be between 10 and 500 characters'),
  
  handleValidationErrors
];

// Feedback validation
const validateFeedback = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('message')
    .trim()
    .isLength({ min: 10, max: 300 })
    .withMessage('Feedback message must be between 10 and 300 characters'),
  
  handleValidationErrors
];

// Admin actions validation
const validateBanUser = [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('reason')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Ban reason must be between 10 and 200 characters'),
  
  handleValidationErrors
];

const validatePlatformMessage = [
  body('message')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Platform message must be between 10 and 500 characters'),
  
  body('type')
    .optional()
    .isIn(['info', 'warning', 'announcement'])
    .withMessage('Invalid message type'),
  
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateSwapRequest,
  validateFeedback,
  validateBanUser,
  validatePlatformMessage,
  handleValidationErrors
}; 