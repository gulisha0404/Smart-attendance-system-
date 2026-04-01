// achievements.js - add, edit, delete achievements with optional PDF

// 1) auth check
const token = localStorage.getItem('authToken');
if (!token) {
  window.location.href = 'index.html';
}

// DOM references
const achEmailLabel = document.getElementById('achEmailLabel');
const backHomeBtn = document.getElementById('backHomeBtn');
const logoutBtn = document.getElementById('logoutBtn');

const achForm = document.getElementById('achForm');
const achTitleInput = document.getElementById('achTitle');
const achTypeSelect = document.getElementById('achType');
const achDateInput = document.getElementById('achDate');
const achFileInput = document.getElementById('achFile');
const achRemoveWrapper = document.getElementById('achRemoveWrapper');
const achRemoveCheckbox = document.getElementById('achRemoveCert');
const achMessage = document.getElementById('achMessage');
const achList = document.getElementById('achList');
const achSaveBtn = document.querySelector('.ach-save-btn');
const achSaveLabel = achSaveBtn ? achSaveBtn.querySelector('span') : null;

let editingId = null; // null = creating new, otherwise editing

// show email
const storedEmail = localStorage.getItem('userEmail');
if (achEmailLabel) {
  if (storedEmail) {
    achEmailLabel.innerHTML = `<i class="fa-regular fa-user"></i> ${storedEmail}`;
  } else {
    achEmailLabel.innerHTML = `<i class="fa-regular fa-user"></i> Logged in`;
  }
}

// back + logout
if (backHomeBtn) {
  backHomeBtn.addEventListener('click', () => {
    window.location.href = 'home.html';
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    window.location.href = 'index.html';
  });
}

function setAchMessage(text, type = 'info') {
  if (!achMessage) return;
  achMessage.textContent = text || '';
  if (!text) return;
  achMessage.style.color = type === 'error' ? '#b91c1c' : '#15803d';
}

// reset form back to "add new" mode
function resetFormToCreate() {
  editingId = null;
  if (achTitleInput) achTitleInput.value = '';
  if (achTypeSelect) achTypeSelect.value = 'Academic';
  if (achDateInput) achDateInput.value = '';
  if (achFileInput) achFileInput.value = '';
  if (achRemoveCheckbox) achRemoveCheckbox.checked = false;
  if (achRemoveWrapper) achRemoveWrapper.style.display = 'none';
  if (achSaveLabel) achSaveLabel.textContent = 'Save Achievement';
  setAchMessage('', 'info');
}

// start editing an achievement
function startEditAchievement(ach) {
  editingId = ach._id;

  achTitleInput.value = ach.title || '';
  achTypeSelect.value = ach.type || 'Academic';

  if (ach.dateCompleted) {
    const d = new Date(ach.dateCompleted);
    achDateInput.value = d.toISOString().slice(0, 10); // YYYY-MM-DD
  } else {
    achDateInput.value = '';
  }

  if (achFileInput) achFileInput.value = '';

  if (achRemoveWrapper) {
    if (ach.certificatePath) {
      achRemoveWrapper.style.display = 'block';
      achRemoveCheckbox.checked = false;
    } else {
      achRemoveWrapper.style.display = 'none';
    }
  }

  if (achSaveLabel) achSaveLabel.textContent = 'Update Achievement';
  setAchMessage('Editing existing achievement. Update fields and click "Update Achievement".', 'info');
}

// delete an achievement
async function deleteAchievement(id) {
  if (!id) return;
  const sure = window.confirm('Are you sure you want to delete this achievement?');
  if (!sure) return;

  try {
    setAchMessage('Deleting achievement...', 'info');
    const resp = await fetch('/api/achievements/' + id, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await resp.json();

    if (!resp.ok) {
      setAchMessage(data.error || 'Failed to delete achievement.', 'error');
      return;
    }

    // if we were editing this one, reset form
    if (editingId === id) {
      resetFormToCreate();
    }

    setAchMessage('Achievement deleted.', 'info');
    loadAchievements();
  } catch (err) {
    console.error('deleteAchievement error', err);
    setAchMessage('Network error while deleting achievement.', 'error');
  }
}

// render achievements list
function renderAchievements(list) {
  if (!achList) return;
  achList.innerHTML = '';

  if (!list || list.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'No achievements yet. Add your first one on the left.';
    empty.style.fontSize = '13px';
    empty.style.opacity = '0.8';
    achList.appendChild(empty);
    return;
  }

  list.forEach(ach => {
    const item = document.createElement('div');
    item.className = 'ach-item';

    const header = document.createElement('div');
    header.className = 'ach-item-header';

    const titleEl = document.createElement('div');
    titleEl.className = 'ach-item-title';
    titleEl.textContent = ach.title;

    const typeEl = document.createElement('div');
    typeEl.className = 'ach-item-type';
    typeEl.textContent = ach.type || 'Academic';

    header.appendChild(titleEl);
    header.appendChild(typeEl);

    const dateEl = document.createElement('div');
    dateEl.className = 'ach-item-date';

    if (ach.dateCompleted) {
      const d = new Date(ach.dateCompleted);
      const formatted = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      dateEl.textContent = `Completed: ${formatted}`;
    } else {
      dateEl.textContent = 'Completed: N/A';
    }

    const statusEl = document.createElement('div');
    statusEl.className = 'ach-item-status';
    const st = ach.status || 'pending';
    statusEl.innerHTML = `Status: <strong style="color: ${
        st === 'approved' ? '#22c55e' :
        st === 'rejected' ? '#ef4444' : '#facc15'
    }">${st}</strong>`;
    statusEl.style.fontSize = '11px';
    statusEl.style.marginTop = '2px';

    item.appendChild(header);
    item.appendChild(dateEl);
    item.appendChild(statusEl);

    // certificate link (if pdf attached)
    if (ach.certificatePath) {
      const linkEl = document.createElement('a');
      linkEl.href = ach.certificatePath;
      linkEl.target = '_blank';
      linkEl.rel = 'noopener noreferrer';
      linkEl.textContent = 'View Certificate (PDF)';
      linkEl.style.fontSize = '11px';
      linkEl.style.marginTop = '4px';
      linkEl.style.textDecoration = 'underline';
      item.appendChild(linkEl);
    }

    // actions: edit + delete
    const actions = document.createElement('div');
    actions.style.marginTop = '6px';
    actions.style.display = 'flex';
    actions.style.gap = '8px';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';
    editBtn.style.fontSize = '11px';
    editBtn.style.padding = '4px 8px';
    editBtn.style.borderRadius = '999px';
    editBtn.style.border = '1px solid rgba(59,130,246,0.7)';
    editBtn.style.background = 'rgba(59,130,246,0.15)';
    editBtn.style.color = '#bfdbfe';

    editBtn.addEventListener('click', () => startEditAchievement(ach));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = 'Delete';
    delBtn.style.fontSize = '11px';
    delBtn.style.padding = '4px 8px';
    delBtn.style.borderRadius = '999px';
    delBtn.style.border = '1px solid rgba(239,68,68,0.8)';
    delBtn.style.background = 'rgba(248,113,113,0.12)';
    delBtn.style.color = '#fecaca';

    delBtn.addEventListener('click', () => deleteAchievement(ach._id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    item.appendChild(actions);

    achList.appendChild(item);
  });
}

// load achievements from backend
async function loadAchievements() {
  try {
    setAchMessage('Loading achievements...', 'info');
    const resp = await fetch('/api/achievements', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await resp.json();
    if (!resp.ok) {
      setAchMessage(data.error || 'Could not load achievements.', 'error');
      return;
    }

    renderAchievements(data.achievements || []);
    setAchMessage('');
  } catch (err) {
    console.error('loadAchievements error', err);
    setAchMessage('Network error while loading achievements.', 'error');
  }
}

// handle form submit (create or update)
if (achForm) {
  achForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = achTitleInput.value.trim();
    const type = achTypeSelect.value;
    const dateCompleted = achDateInput.value; // YYYY-MM-DD or empty
    const file = achFileInput.files[0];

    if (!title) {
      setAchMessage('Please enter an achievement title.', 'error');
      return;
    }

    try {
      const isEditing = !!editingId;
      setAchMessage(isEditing ? 'Updating achievement...' : 'Saving achievement...', 'info');

      const formData = new FormData();
      formData.append('title', title);
      formData.append('type', type);
      formData.append('dateCompleted', dateCompleted);

      if (file) {
        formData.append('certificate', file);
      }

      if (isEditing && achRemoveCheckbox && achRemoveCheckbox.checked) {
        formData.append('removeCertificate', 'true');
      }

      const url = isEditing
        ? '/api/achievements/' + editingId
        : '/api/achievements';

      const method = isEditing ? 'PATCH' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await resp.json();

      if (!resp.ok) {
        setAchMessage(data.error || 'Failed to save achievement.', 'error');
        return;
      }

      resetFormToCreate();
      setAchMessage(isEditing ? 'Achievement updated successfully ✔' : 'Achievement saved successfully ✔', 'info');
      loadAchievements();
    } catch (err) {
      console.error('saveAchievement error', err);
      setAchMessage('Network error while saving achievement.', 'error');
    }
  });
}

// initial load
resetFormToCreate();
loadAchievements();
