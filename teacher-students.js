// teacher-students.js

const token = localStorage.getItem('authToken');
const role = localStorage.getItem('userRole');

if (!token || role !== 'teacher') {
  window.location.href = 'index.html';
}

let allStudents = [];

async function loadStudents() {
  const list = document.getElementById('studentList');

  try {
    const resp = await fetch('/api/teacher/students', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await resp.json();

    if (!resp.ok) {
      list.innerHTML = '<p>Access denied</p>';
      return;
    }

    allStudents = data.students || [];
    renderList(allStudents);

  } catch (err) {
    list.innerHTML = '<p>Server error</p>';
  }
}

function renderList(dataArray) {
  const list = document.getElementById('studentList');
  list.innerHTML = '';

  if (!dataArray.length) {
    list.innerHTML = '<p>No students found</p>';
    return;
  }

  dataArray.forEach(s => {
    const div = document.createElement('div');
    div.className = 'card';

    const name = s.profile?.fullName || 'Unnamed Student';
    const enrollment = s.profile?.enrollmentNo || 'N/A';
    const dept = s.profile?.department || 'N/A';

    div.innerHTML = `
      <div class="student">${name}</div>
      <div class="meta">Email: ${s.email}</div>
      <div class="meta">Enrollment No: ${enrollment}</div>
      <div class="meta">Department: ${dept}</div>
    `;

    list.appendChild(div);
  });
}

const searchInput = document.getElementById('searchInput');

function applyFilters() {
  let filtered = [...allStudents];
  const searchVal = searchInput ? searchInput.value.toLowerCase() : '';

  if (searchVal) {
    filtered = filtered.filter(s =>
      (s.profile?.fullName || '').toLowerCase().includes(searchVal) ||
      (s.email || '').toLowerCase().includes(searchVal)
    );
  }

  renderList(filtered);
}

if (searchInput) {
  searchInput.addEventListener('input', applyFilters);
}

loadStudents();
