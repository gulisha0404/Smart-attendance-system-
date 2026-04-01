// teacher-achievements.js

// ===============================
// ROLE PROTECTION
// ===============================

const token = localStorage.getItem('authToken');
const role = localStorage.getItem('userRole');

if (!token || role !== 'teacher') {
  window.location.href = 'index.html';
}

// ===============================
// DATA STORAGE
// ===============================

let allData = [];

// ===============================
// LOAD ACHIEVEMENTS FROM BACKEND
// ===============================

async function loadAchievements() {
  const list = document.getElementById('achievementList');

  try {
    const resp = await fetch('/api/teacher/achievements', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await resp.json();

    if (!resp.ok) {
      list.innerHTML = '<p>Access denied</p>';
      return;
    }

    allData = data.achievements || [];
    updateStats(allData);
    renderList(allData);

  } catch (err) {
    list.innerHTML = '<p>Server error</p>';
  }
}

// ===============================
// RENDER FUNCTION
// ===============================

function renderList(dataArray) {
  const list = document.getElementById('achievementList');
  list.innerHTML = '';

  if (!dataArray.length) {
    list.innerHTML = '<p>No achievements found</p>';
    return;
  }

  dataArray.forEach(a => {
    const div = document.createElement('div');
    div.className = 'card';

    div.innerHTML = `
      <div class="student">${a.studentName} (${a.studentEmail})</div>
      <div class="title">${a.title}</div>
      <div class="type">${a.type || 'General'}</div>
      <div class="meta">
        Completed: ${
          a.dateCompleted
            ? new Date(a.dateCompleted).toLocaleDateString()
            : 'N/A'
        }
      </div>
      <div class="meta">Status: <strong style="color: ${
        a.status === 'approved' ? '#22c55e' :
        a.status === 'rejected' ? '#ef4444' : '#facc15'
      }">${a.status || 'pending'}</strong></div>
      ${
        a.certificatePath
          ? `<a class="cert" href="${a.certificatePath}" target="_blank">
              📄 View Certificate
             </a>`
          : ''
      }
      ${
        (!a.status || a.status === 'pending') ? `
          <div style="margin-top: 10px; display: flex; gap: 8px;">
            <button onclick="updateStatus('${a.userId}', '${a.achievementId}', 'approved')" style="background: #22c55e; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Approve</button>
            <button onclick="updateStatus('${a.userId}', '${a.achievementId}', 'rejected')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Reject</button>
          </div>
        ` : ''
      }
    `;

    list.appendChild(div);
  });
}

async function updateStatus(userId, achId, status) {
  try {
    const resp = await fetch(`/api/teacher/achievements/${userId}/${achId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    if (resp.ok) {
      loadAchievements(); // Reload to show updated status
    } else {
      const data = await resp.json();
      alert('Error: ' + data.error);
    }
  } catch (err) {
    alert('Server error while updating status');
  }
}

// ===============================
// FILTER LOGIC
// ===============================

const filter = document.getElementById('typeFilter');
const searchInput = document.getElementById('searchInput');

function applyFilters() {
  let filtered = [...allData];

  const typeVal = filter ? filter.value : 'all';
  const searchVal = searchInput ? searchInput.value.toLowerCase() : '';

  // type filter
  if (typeVal !== 'all') {
    filtered = filtered.filter(a =>
      (a.type || '').toLowerCase() === typeVal.toLowerCase()
    );
  }

  // search filter
  if (searchVal) {
    filtered = filtered.filter(a =>
      (a.studentName || '').toLowerCase().includes(searchVal) ||
      (a.studentEmail || '').toLowerCase().includes(searchVal)
    );
  }

  renderList(filtered);
}

if (filter) {
  filter.addEventListener('change', applyFilters);
}

if (searchInput) {
  searchInput.addEventListener('input', applyFilters);
}

// ===============================
// INITIAL LOAD
// ===============================

loadAchievements();
function updateStats(data){

  const total = data.length;

  const pending = data.filter(a => !a.status || a.status === 'pending').length;
  const approved = data.filter(a => a.status === 'approved').length;
  const rejected = data.filter(a => a.status === 'rejected').length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statApproved').textContent = approved;
  document.getElementById('statRejected').textContent = rejected;
}
