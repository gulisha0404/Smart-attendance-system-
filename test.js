const assert = require('assert');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
  try {
    const ts = Date.now();
    const studentEmail = `student_${ts}@test.com`;
    const teacherEmail = `teacher_${ts}@test.com`;
    const password = 'password123';

    console.log('--- Registering student & teacher ---');
    await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password, role: 'student' })
    });
    await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: teacherEmail, password, role: 'teacher' })
    });

    console.log('--- Logging in student ---');
    const studentLoginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password, role: 'student', enteredCaptcha: '123456', shownCaptcha: '123456' })
    });
    const studentLoginData = await studentLoginRes.json();
    const studentToken = studentLoginData.token;
    assert(studentToken, 'Student login failed');

    console.log('--- Adding achievement for student ---');
    const achFormData = new FormData();
    // Use json manually
    const achRes = await fetch(`${BASE_URL}/achievements`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${studentToken}`
        },
        body: JSON.stringify({
            title: 'Test Achievement',
            type: 'Academic'
        })
    });
    const achData = await achRes.json();
    assert(achData.ok, 'Failed to add achievement');
    const achId = achData.achievement._id;

    console.log('--- Verifying achievement is pending for student ---');
    const listRes1 = await fetch(`${BASE_URL}/achievements`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const listData1 = await listRes1.json();
    assert(listData1.achievements[0].status === 'pending', 'Achievement should be pending');

    console.log('--- Logging in teacher ---');
    const teacherLoginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: teacherEmail, password, role: 'teacher', enteredCaptcha: '123456', shownCaptcha: '123456' })
    });
    const teacherLoginData = await teacherLoginRes.json();
    const teacherToken = teacherLoginData.token;
    assert(teacherToken, 'Teacher login failed');

    console.log('--- Fetching all teacher achievements ---');
    const tAchRes = await fetch(`${BASE_URL}/teacher/achievements`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    const tAchData = await tAchRes.json();
    assert(tAchData.ok, 'Failed to fetch teacher achievements');
    const tAch = tAchData.achievements.find(a => a.studentEmail === studentEmail && a.title === 'Test Achievement');
    assert(tAch, 'Teacher could not find the student achievement');

    console.log('--- Approving achievement ---');
    const approveRes = await fetch(`${BASE_URL}/teacher/achievements/${tAch.userId}/${tAch.achievementId}`, {
      method: 'PATCH',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    const approveData = await approveRes.json();
    assert(approveData.ok, 'Failed to approve achievement');
    assert(approveData.achievement.status === 'approved', 'Achievement status not updated to approved');

    console.log('--- Verifying achievement is approved for student ---');
    const listRes2 = await fetch(`${BASE_URL}/achievements`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const listData2 = await listRes2.json();
    assert(listData2.achievements.find(a => a._id === achId).status === 'approved', 'Student achievement should be approved');

    console.log('All tests passed successfully!');

  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

runTest();
