// home.js - STUDENT DASHBOARD PROTECTION

const token = localStorage.getItem('authToken');
const role = localStorage.getItem('userRole');

// not logged in → go to login
if (!token) {
  window.location.href = 'index.html';
}

// logged in but NOT a student → go to teacher dashboard
if (role !== 'student') {
  window.location.href = 'teacher-home.html';
}

// 2) (Optional) show email if backend stored it – for now we just read from localStorage if you save it there later.
const emailLabel = document.getElementById('userEmailLabel');
if (emailLabel) {
  // if you ever store email in localStorage, you can show it here
  const storedEmail = localStorage.getItem('userEmail');
  if (storedEmail) {
    emailLabel.innerHTML = `<i class="fa-regular fa-user"></i> ${storedEmail}`;
  }
}

// 3) Logout button: clear token and go to login
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    // If you later store email: localStorage.removeItem('userEmail');
    window.location.href = 'index.html';
  });
}
