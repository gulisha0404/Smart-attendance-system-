/**
 * SIGNUP PAGE SCHEMA (signup.html)
 * 
 * Form ID: signupForm
 * Submitted to: POST /api/signup
 */

const signupHTMLSchema = {
  // Form Structure
  form: {
    id: 'signupForm',
    method: 'POST',
    endpoint: '/api/signup',
    fields: [
      {
        name: 'email',
        type: 'email',
        required: true,
        placeholder: 'Email ID',
        validation: {
          minLength: 5,
          pattern: 'email',
          errorMessage: 'Please enter a valid email'
        },
        example: 'newuser@example.com',
        backendValidation: 'Must be unique in MongoDB'
      },
      {
        name: 'password',
        type: 'password',
        required: true,
        placeholder: 'Password (min 6 characters)',
        validation: {
          minLength: 6,
          errorMessage: 'Password must be at least 6 characters'
        },
        note: 'Will be hashed with bcryptjs before storage'
      },
      {
        name: 'confirmPassword',
        type: 'password',
        required: true,
        placeholder: 'Confirm Password',
        validation: {
          minLength: 6,
          mustMatchField: 'password',
          errorMessage: 'Passwords do not match'
        }
      },
      {
        name: 'agree-signup',
        type: 'checkbox',
        required: true,
        label: 'I Agree to the Terms & Conditions',
        validation: {
          mustBeChecked: true,
          errorMessage: 'You must agree to terms to sign up'
        }
      }
    ]
  },

  // Request Payload
  requestPayload: {
    email: 'string (email format, must be unique)',
    password: 'string (plain text, min 6 characters)',
    confirmPassword: 'string (must match password)'
  },

  // Expected Response (Success)
  successResponse: {
    statusCode: 201,
    ok: true,
    msg: 'Signup successful',
    token: 'string (JWT token for immediate login)',
    user: {
      id: 'string (MongoDB ObjectId)',
      email: 'string'
    }
  },

  // Expected Response (Error)
  errorResponse: {
    ok: false,
    error: 'string (error message)',
    statusCode: '400 or 409',
    possibleErrors: [
      'Invalid email',
      'Password must be at least 6 characters',
      'Passwords do not match',
      'Email already registered (409 Conflict)',
      'Server error'
    ]
  },

  // Database Schema (MongoDB User Model)
  databaseSchema: {
    email: {
      type: 'String',
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: 'String',
      required: true,
      note: 'Stored as bcryptjs hash'
    },
    createdAt: {
      type: 'Date',
      default: 'Date.now'
    }
  },

  // UI Elements
  elements: {
    loginWrapper: '.login-wrapper',
    loginCard: '.login-card',
    cardHeader: '.card-header',
    cardBody: '.card-body',
    inputGroups: '.input-group',
    checkboxRow: '.checkbox-row',
    submitButton: '.btn-login',
    links: '.links'
  },

  // Navigation Links
  navigation: {
    loginLink: 'index.html'
  }
};

module.exports = signupHTMLSchema;
