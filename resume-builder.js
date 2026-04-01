const token = localStorage.getItem("authToken");

if(!token){
window.location.href="index.html";
}

const achievementsList = document.getElementById("achievementsList");

let userProfile = {};

async function loadProfile() {
  try {
    const resp = await fetch("/api/profile", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await resp.json();
    if (resp.ok) {
      userProfile = data.profile || {};
      userProfile.email = data.email || '';
    }
  } catch (err) {
    console.error("Error loading profile", err);
  }
}

async function loadAchievements(){

try{

await loadProfile();

const resp = await fetch("/api/achievements",{
headers:{
Authorization:`Bearer ${token}`
}
});

const data = await resp.json();

if(!resp.ok){
achievementsList.innerHTML="Error loading achievements";
return;
}

const list = data.achievements || [];

if(!list.length){
achievementsList.innerHTML="No achievements available";
return;
}

achievementsList.innerHTML="";

list.forEach(a=>{
  if (a.status !== 'approved') return;

  const div=document.createElement("div");
  div.className="ach-item";

  div.innerHTML=`
  <label>
  <input type="checkbox" value="${a.title} (${a.type})">
  ${a.title} (${a.type})
  </label>
  `;

  achievementsList.appendChild(div);

});

if (achievementsList.innerHTML === "") {
  achievementsList.innerHTML = "No approved achievements available";
}

}catch(err){

achievementsList.innerHTML="Server error";

}

}

loadAchievements();



document.getElementById("generateBtn").addEventListener("click",()=>{
  const fileInput = document.getElementById("photoUpload");
  if (!fileInput.files[0]) {
    alert("Please upload a photo.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const photoDataUrl = e.target.result;

    const selectedAchievements=[];

    document.querySelectorAll("#achievementsList input:checked")
    .forEach(cb=>{
      selectedAchievements.push(cb.value);
    });

    const data={
      careerObjective:document.getElementById("careerObjective").value,
      internship:{
        title:document.getElementById("internshipTitle").value,
        desc:document.getElementById("internshipDesc").value
      },
      majorProject:{
        title:document.getElementById("majorTitle").value,
        desc:document.getElementById("majorDesc").value
      },
      minorProject:{
        title:document.getElementById("minorTitle").value,
        desc:document.getElementById("minorDesc").value
      },
      strengths:[
        document.getElementById("strength1").value,
        document.getElementById("strength2").value
      ].filter(Boolean),
      improvements:[
        document.getElementById("improve1").value,
        document.getElementById("improve2").value
      ].filter(Boolean),
      hobbies:[
        document.getElementById("hobby1").value,
        document.getElementById("hobby2").value
      ].filter(Boolean),
      interests:[
        document.getElementById("interest1").value,
        document.getElementById("interest2").value
      ].filter(Boolean),
      achievements:selectedAchievements,
      photo: photoDataUrl
    };

    generateResumeHTML(data);
  };
  reader.readAsDataURL(fileInput.files[0]);
});

function generateResumeHTML(data) {
  const name = userProfile.fullName || 'Your Name';
  const email = userProfile.email || 'Email';
  const enrollment = userProfile.enrollmentNo || 'Enrollment No';
  const skills = (userProfile.skills || []).join(', ');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Resume - ${name}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 20px; background: #f4f4f4; }
        .resume-container { max-width: 800px; margin: auto; background: #fff; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { display: flex; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
        .photo { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-right: 20px; border: 2px solid #2563eb; }
        .header-info h1 { margin: 0; color: #2563eb; font-size: 32px; }
        .header-info p { margin: 5px 0 0; font-size: 16px; color: #666; }
        .section { margin-bottom: 20px; }
        .section h2 { font-size: 20px; color: #2563eb; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
        .section p, .section ul { margin: 0 0 10px 0; }
        .section ul { padding-left: 20px; }
        .project { margin-bottom: 10px; }
        .project strong { display: block; font-size: 16px; }
        @media print {
          body { background: #fff; padding: 0; }
          .resume-container { box-shadow: none; max-width: 100%; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="resume-container">
        <div class="header">
          <img src="${data.photo}" alt="Photo" class="photo">
          <div class="header-info">
            <h1>${name}</h1>
            <p>${email} | Enrollment: ${enrollment}</p>
          </div>
        </div>

        ${data.careerObjective ? `
        <div class="section">
          <h2>Career Objective</h2>
          <p>${data.careerObjective}</p>
        </div>` : ''}

        ${skills ? `
        <div class="section">
          <h2>Skills</h2>
          <p>${skills}</p>
        </div>` : ''}

        ${(data.internship.title || data.internship.desc) ? `
        <div class="section">
          <h2>Internship</h2>
          <div class="project">
            <strong>${data.internship.title}</strong>
            <p>${data.internship.desc}</p>
          </div>
        </div>` : ''}

        ${(data.majorProject.title || data.majorProject.desc) ? `
        <div class="section">
          <h2>Major Project</h2>
          <div class="project">
            <strong>${data.majorProject.title}</strong>
            <p>${data.majorProject.desc}</p>
          </div>
        </div>` : ''}

        ${(data.minorProject.title || data.minorProject.desc) ? `
        <div class="section">
          <h2>Minor Project</h2>
          <div class="project">
            <strong>${data.minorProject.title}</strong>
            <p>${data.minorProject.desc}</p>
          </div>
        </div>` : ''}

        ${data.achievements.length > 0 ? `
        <div class="section">
          <h2>Achievements</h2>
          <ul>
            ${data.achievements.map(ach => `<li>${ach}</li>`).join('')}
          </ul>
        </div>` : ''}

        <div style="display: flex; justify-content: space-between;">
          ${data.strengths.length > 0 ? `
          <div class="section" style="width: 48%;">
            <h2>Strengths</h2>
            <ul>
              ${data.strengths.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>` : ''}

          ${data.improvements.length > 0 ? `
          <div class="section" style="width: 48%;">
            <h2>Areas of Improvement</h2>
            <ul>
              ${data.improvements.map(i => `<li>${i}</li>`).join('')}
            </ul>
          </div>` : ''}
        </div>

        <div style="display: flex; justify-content: space-between;">
          ${data.hobbies.length > 0 ? `
          <div class="section" style="width: 48%;">
            <h2>Hobbies</h2>
            <ul>
              ${data.hobbies.map(h => `<li>${h}</li>`).join('')}
            </ul>
          </div>` : ''}

          ${data.interests.length > 0 ? `
          <div class="section" style="width: 48%;">
            <h2>Areas of Interest</h2>
            <ul>
              ${data.interests.map(i => `<li>${i}</li>`).join('')}
            </ul>
          </div>` : ''}
        </div>

      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const newWindow = window.open("", "_blank");
  newWindow.document.write(html);
  newWindow.document.close();
}
