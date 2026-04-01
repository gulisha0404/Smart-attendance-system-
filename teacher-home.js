// teacher-home.js - TEACHER DASHBOARD LOGIC

const token = localStorage.getItem('authToken');
const role = localStorage.getItem('userRole');
const email = localStorage.getItem('userEmail');

// not logged in → login page
if (!token) {
  window.location.href = 'index.html';
}

// logged in but NOT teacher → student home
if (role !== 'teacher') {
  window.location.href = 'home.html';
}

// show teacher email
const teacherEmailEl = document.getElementById('teacherEmail');
if (teacherEmailEl && email) {
  teacherEmailEl.innerHTML = `<i class="fa-regular fa-user"></i> ${email}`;
}

// buttons
const logoutBtn = document.getElementById('logoutBtn');
const viewStudentsBtn = document.getElementById('viewStudentsBtn');
const viewAchievementsBtn = document.getElementById('viewAchievementsBtn');

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    window.location.href = 'index.html';
  });
}

if (viewStudentsBtn) {
  viewStudentsBtn.addEventListener('click', () => {
    alert('Next step: student list page (we will build this)');
  });
}

if (viewAchievementsBtn) {
  viewAchievementsBtn.addEventListener('click', () => {
  window.location.href = 'teacher-achievements.html';
});
}
