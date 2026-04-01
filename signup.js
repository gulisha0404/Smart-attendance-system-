// signup.js - SIGNUP PAGE LOGIC

const signupForm = document.getElementById('signupForm');
const emailInputS = signupForm ? signupForm.querySelector('input[name="email"]') : null;
const passwordInputS = signupForm ? signupForm.querySelector('input[name="password"]') : null;
const confirmInputS = document.getElementById('confirmPassword');

function showSignupMessage(text, type = 'info') {
  let area = document.getElementById('signupMessageArea');
  if (!area && signupForm) {
    area = document.createElement('div');
    area.id = 'signupMessageArea';
    area.style.marginTop = '12px';
    area.style.fontWeight = '600';
    signupForm.appendChild(area);
  }
  if (!area) return;

  area.textContent = text;
  area.style.color = (type === 'error') ? '#ffdddd' : '#dff0d8';
  area.style.background = (type === 'error') ? 'rgba(200,20,20,0.12)' : 'rgba(20,120,20,0.08)';
  area.style.padding = '8px 12px';
  area.style.borderRadius = '6px';
}

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInputS?.value.trim() || '';
    const password = passwordInputS?.value.trim() || '';
    const confirm = confirmInputS?.value.trim() || '';

    const roleRadio = signupForm.querySelector('input[name="role"]:checked');
    const role = roleRadio ? roleRadio.value : 'student';

    if (!email || !email.includes('@')) {
      showSignupMessage('Please enter a valid email address.', 'error');
      return;
    }
    if (!password || password.length < 6) {
      showSignupMessage('Password must be at least 6 characters.', 'error');
      return;
    }
    if (password !== confirm) {
      showSignupMessage('Password and Confirm Password do not match.', 'error');
      return;
    }

    try {
      showSignupMessage('Creating your account…', 'info');

      const resp = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      const data = await resp.json();

      if (!resp.ok) {
        showSignupMessage(data.error || 'Signup failed', 'error');
        return;
      }

      showSignupMessage(data.msg || 'Account created successfully!', 'info');

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1200);
    } catch (err) {
      console.error('Signup error', err);
      showSignupMessage('Network or server error.', 'error');
    }
  });
}
