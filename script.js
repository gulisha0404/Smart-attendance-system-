// script.js - LOGIN PAGE LOGIC (with role support)

// helper: generate a 6-digit captcha string
function randomCaptcha() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// DOM elements
const loginForm = document.getElementById('loginForm');
const captchaText = document.getElementById('captchaText');
const refreshBtn = document.getElementById('refreshCaptcha');
const captchaField = document.getElementById('captchaField');

// try to find email + password inputs in the form
const emailInput = loginForm ? loginForm.querySelector('input[name="email"]') : null;
const passwordInput = loginForm ? loginForm.querySelector('input[name="password"]') : null;

// show initial captcha
if (captchaText) captchaText.textContent = randomCaptcha();

// refresh captcha when user clicks refresh
if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    if (captchaText) captchaText.textContent = randomCaptcha();
  });
}

// helper to show a message to the user (under the form)
function showMessage(text, type = 'info') {
  if (!loginForm) return;

  let area = document.getElementById('messageArea');
  if (!area) {
    area = document.createElement('div');
    area.id = 'messageArea';
    area.style.marginTop = '12px';
    area.style.fontWeight = '600';
    loginForm.appendChild(area);
  }

  area.textContent = text;

  if (type === 'error') {
    area.style.color = '#ffdddd';
    area.style.background = 'rgba(200,20,20,0.12)';
  } else {
    area.style.color = '#dff0d8';
    area.style.background = 'rgba(20,120,20,0.08)';
  }

  area.style.padding = '8px 12px';
  area.style.borderRadius = '6px';
}

// FORM SUBMIT: send login request to backend
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput && emailInput.value ? emailInput.value.trim() : '';
    const password = passwordInput && passwordInput.value ? passwordInput.value.trim() : '';
    const enteredCaptcha = captchaField && captchaField.value ? captchaField.value.trim() : '';
    const roleRadio = loginForm.querySelector('input[name="loginRole"]:checked');
    const selectedRole = roleRadio ? roleRadio.value : 'student';

    const shownCaptcha = captchaText && captchaText.textContent ? captchaText.textContent.trim() : '';

    // basic validations
    if (!email || !email.includes('@')) {
      showMessage('Please enter a valid email address.', 'error');
      return;
    }
    if (!password) {
      showMessage('Please enter your password.', 'error');
      return;
    }
    if (!enteredCaptcha) {
      showMessage('Please enter the captcha shown in the black box.', 'error');
      return;
    }

    // send to backend (POST /api/login)
    try {
      showMessage('Checking credentials…', 'info');

      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          enteredCaptcha,
          shownCaptcha,
          role: selectedRole
        })
      });

      // Read JSON
      const data = await resp.json();

      if (!resp.ok) {
        showMessage(data.error || 'Login failed.', 'error');
        // refresh captcha & clear field
        if (captchaText) captchaText.textContent = randomCaptcha();
        if (captchaField) captchaField.value = '';
        return;
      }

      // success: store token, email, and role
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      localStorage.setItem('userEmail', data.email || email);
      if (data.role) {
        localStorage.setItem('userRole', data.role);
      }

      showMessage('Login successful! Redirecting…', 'info');

      // simple redirect for now: both roles go to home.html
      if (data.role === 'teacher') {
      window.location.href = 'teacher-home.html';
      } else {
        window.location.href = 'home.html';
      }
      
      /*
      // When you create a separate teacher dashboard, use this instead:
      if (data.role === 'teacher') {
        window.location.href = 'teacher-home.html';
      } else {
        window.location.href = 'home.html';
      }
      */
    } catch (err) {
      console.error('Login error', err);
      showMessage('Network or server error. Please try again.', 'error');
    }
  });
}

