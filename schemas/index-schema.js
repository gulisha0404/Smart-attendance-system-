/**
 * LOGIN PAGE SCHEMA (index.html)
 * 
 * Form ID: loginForm
 * Submitted to: POST /api/login
 */

const indexHTMLSchema = {
  // Form Structure
  form: {
    id: 'loginForm',
    method: 'POST',
    endpoint: '/api/login',
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
        example: 'user@example.com'
      },
      {
        name: 'password',
        type: 'password',
        required: true,
        placeholder: 'Password',
        validation: {
          minLength: 1,
          errorMessage: 'Password is required'
        }
      },
      {
        name: 'captchaField',
        type: 'text',
        required: true,
        placeholder: 'Enter Captcha',
        validation: {
          pattern: 'numeric',
          errorMessage: 'Enter valid captcha'
        },
        note: 'User must enter the captcha displayed in #captchaBox'
      },
      {
        name: 'agree',
        type: 'checkbox',
        required: true,
        label: 'I Have Read the Instructions',
        validation: {
          mustBeChecked: true,
          errorMessage: 'You must agree to continue'
        }
      }
    ]
  },

  // Captcha System
  captcha: {
    displayElement: 'captchaBox',
    textElement: 'captchaText',
    refreshButton: 'refreshCaptcha',
    format: 'numeric-6-digits',
    note: 'Captcha is generated and stored in script.js'
  },

  // Request Payload
  requestPayload: {
    email: 'string (email format)',
    password: 'string (plain text, will be hashed on backend)',
    enteredCaptcha: 'string (what user entered)',
    shownCaptcha: 'string (what system displayed)'
  },

  // Expected Response (Success)
  successResponse: {
    ok: true,
    msg: 'Login successful',
    token: 'string (JWT token)',
    user: {
      id: 'string (MongoDB ObjectId)',
      email: 'string'
    }
  },

  // Expected Response (Error)
  errorResponse: {
    ok: false,
    error: 'string (error message)',
    possibleErrors: [
      'Invalid email',
      'Password is required',
      'Missing captcha values',
      'Captcha mismatch',
      'Invalid credentials',
      'Server error'
    ]
  },

  // UI Elements
  elements: {
    loginWrapper: '.login-wrapper',
    loginCard: '.login-card',
    cardHeader: '.card-header',
    cardBody: '.card-body',
    inputGroups: '.input-group',
    captchaRow: '.captcha-row',
    checkboxRow: '.checkbox-row',
    submitButton: '.btn-login',
    links: '.links'
  },

  // Navigation Links
  navigation: {
    signupLink: 'signup.html',
    manualLink: '#',
    forgotPasswordLink: '#'
  }
};

module.exports = indexHTMLSchema;
