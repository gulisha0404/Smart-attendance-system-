// profile.js - handles profile page (load + save + logout + back to home)

// 1) Protect page: require token
const token = localStorage.getItem('authToken');
if (!token) {
  window.location.href = 'index.html'; // not logged in
}

// DOM elements
const profileEmailLabel = document.getElementById('profileEmailLabel');
const backHomeBtn = document.getElementById('backHomeBtn');
const logoutBtn = document.getElementById('logoutBtn');

const profileForm = document.getElementById('profileForm');
const fullNameInput = document.getElementById('fullName');
const enrollmentInput = document.getElementById('enrollmentNo');
const semesterInput = document.getElementById('semester');
const departmentInput = document.getElementById('department');
const cgpaInput = document.getElementById('cgpa');
const skillsInput = document.getElementById('skills');
const githubInput = document.getElementById('github');
const linkedinInput = document.getElementById('linkedin');
const portfolioInput = document.getElementById('portfolio');
const profileMessage = document.getElementById('profileMessage');

// show email if stored
const storedEmail = localStorage.getItem('userEmail');
if (profileEmailLabel) {
  if (storedEmail) {
    profileEmailLabel.innerHTML = `<i class="fa-regular fa-user"></i> ${storedEmail}`;
  } else {
    profileEmailLabel.innerHTML = `<i class="fa-regular fa-user"></i> Logged in`;
  }
}

// back to home
if (backHomeBtn) {
  backHomeBtn.addEventListener('click', () => {
    window.location.href = 'home.html';
  });
}

// logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    window.location.href = 'index.html';
  });
}

function setProfileMessage(text, type = 'info') {
  if (!profileMessage) return;
  profileMessage.textContent = text || '';
  if (!text) return;
  profileMessage.style.color = type === 'error' ? '#fecaca' : '#bbf7d0';
}

// LOAD PROFILE FROM BACKEND
async function loadProfile() {
  try {
    setProfileMessage('Loading profile...', 'info');

    const resp = await fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await resp.json();

    if (!resp.ok) {
      setProfileMessage(data.error || 'Could not load profile.', 'error');
      return;
    }

    const p = data.profile || {};

    fullNameInput.value = p.fullName || '';
    document.getElementById("sscSchool").value = p.ssc?.school || "";
    document.getElementById("sscBoard").value = p.ssc?.board || "";
    document.getElementById("sscPercentage").value = p.ssc?.percentage || "";
    document.getElementById("sscYear").value = p.ssc?.year || "";

    document.getElementById("hscSchool").value = p.hsc?.school || "";
    document.getElementById("hscBoard").value = p.hsc?.board || "";
    document.getElementById("hscPercentage").value = p.hsc?.percentage || "";
    document.getElementById("hscYear").value = p.hsc?.year || "";

    enrollmentInput.value = p.enrollmentNo || '';
    semesterInput.value = p.semester || '';
    departmentInput.value = p.department || '';
    cgpaInput.value = p.cgpa != null ? p.cgpa : '';
    skillsInput.value = (p.skills && p.skills.length) ? p.skills.join(', ') : '';
    githubInput.value = p.github || '';
    linkedinInput.value = p.linkedin || '';
    portfolioInput.value = p.portfolio || '';

    setProfileMessage('Profile loaded.', 'info');
  } catch (err) {
    console.error('loadProfile error', err);
    setProfileMessage('Network error while loading profile.', 'error');
  }
}

// SAVE PROFILE TO BACKEND
if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const body = {
      fullName: fullNameInput.value.trim(),
      enrollmentNo: enrollmentInput.value.trim(),
      semester: semesterInput.value.trim(),
      department: departmentInput.value.trim(),
      cgpa: cgpaInput.value.trim(),
      skills: skillsInput.value.trim(), // backend splits by comma
      github: githubInput.value.trim(),
      linkedin: linkedinInput.value.trim(),
      portfolio: portfolioInput.value.trim(),
      ssc: {
        school: document.getElementById("sscSchool").value.trim(),
        board: document.getElementById("sscBoard").value.trim(),
        percentage: document.getElementById("sscPercentage").value.trim(),
        year: document.getElementById("sscYear").value.trim()
      },
      hsc: {
        school: document.getElementById("hscSchool").value.trim(),
        board: document.getElementById("hscBoard").value.trim(),
        percentage: document.getElementById("hscPercentage").value.trim(),
        year: document.getElementById("hscYear").value.trim()
      }
    };

    try {
      setProfileMessage('Saving profile...', 'info');

      const resp = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await resp.json();

      if (!resp.ok) {
        setProfileMessage(data.error || 'Failed to save profile.', 'error');
        return;
      }

      setProfileMessage('Profile saved successfully ✔', 'info');
    } catch (err) {
      console.error('saveProfile error', err);
      setProfileMessage('Network error while saving profile.', 'error');
    }
  });
}

// run on page load
loadProfile();
