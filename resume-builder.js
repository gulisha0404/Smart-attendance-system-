const token = localStorage.getItem("authToken");

if(!token){
window.location.href="index.html";
}

const achievementsList = document.getElementById("achievementsList");

async function loadAchievements(){

try{

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

const div=document.createElement("div");
div.className="ach-item";

div.innerHTML=`
<label>
<input type="checkbox" value="${a._id}">
${a.title} (${a.type})
</label>
`;

achievementsList.appendChild(div);

});

}catch(err){

achievementsList.innerHTML="Server error";

}

}

loadAchievements();



document.getElementById("generateBtn").addEventListener("click",()=>{

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
],

improvements:[
document.getElementById("improve1").value,
document.getElementById("improve2").value
],

hobbies:[
document.getElementById("hobby1").value,
document.getElementById("hobby2").value
],

interests:[
document.getElementById("interest1").value,
document.getElementById("interest2").value
],

achievements:selectedAchievements

};

console.log("Resume Data:",data);

alert("Resume data captured. Next step: generate PDF.");

});
