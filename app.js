
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; document.getElementById('installBtn').style.display = 'inline-block'; });
document.getElementById('installBtn').addEventListener('click', async () => {
  if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; }
  alert('If the prompt does not appear on iPhone, use Share → Add to Home Screen.');
});

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}

const PLAN = window.MEAL_PLAN;
const daysOrder = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function todayKey(d=new Date()){
  // local day key
  return daysOrder[d.getDay()];
}
function tomorrowKey(){
  const d=new Date(); d.setDate(d.getDate()+1); return daysOrder[d.getDay()];
}

function renderDay(key, targetId){
  const target = document.getElementById(targetId);
  target.innerHTML = '';
  const data = PLAN[key];
  const entries = [
    ['Breakfast', data.breakfast, 'bfast'],
    ['Lunch', data.lunch, 'lunch'],
    ['Snack', data.snack, 'snack'],
    ['Dinner', data.dinner, 'dinner'],
  ];
  entries.forEach(([title, text, cls])=>{
    const div = document.createElement('div');
    div.className = 'meal '+cls;
    div.innerHTML = `<h4>${title}</h4><p>${text}</p>`;
    target.appendChild(div);
  });
}

function hydrateUI(){
  const now = new Date();
  const today = todayKey(now);
  const tomorrow = tomorrowKey();
  document.getElementById('todayStr').textContent = now.toLocaleDateString(undefined, {weekday:'long', month:'short', day:'numeric'});
  renderDay(today, 'todayContent');
  renderDay(tomorrow, 'tomorrowContent');
  document.getElementById('prepNow').textContent = PLAN[today].prepNotes;
  document.getElementById('prepTonight').textContent = PLAN[tomorrow].tonightPrep || 'Set up basics for tomorrow.';
  buildChecklist(today);
  buildWater();
  updateStreak();
}

function buildChecklist(dayKey){
  const list = document.getElementById('checklist');
  list.innerHTML = '';
  const items = ['Breakfast','Lunch','Snack','Dinner'];
  items.forEach((name, idx)=>{
    const li = document.createElement('li');
    const box = document.createElement('div');
    box.className='checkbox';
    const key = `done:${dayKey}:${name}`;
    if(localStorage.getItem(key)==='1'){ box.classList.add('done'); }
    box.addEventListener('click', ()=>{
      const done = box.classList.toggle('done');
      localStorage.setItem(key, done ? '1' : '0');
      updateStreak();
    });
    const label = document.createElement('span'); label.textContent = name;
    li.appendChild(box); li.appendChild(label); list.appendChild(li);
  });
}

function buildWater(){
  const wrap = document.getElementById('waterTracker');
  wrap.innerHTML = '';
  for(let i=1;i<=8;i++){
    const p = document.createElement('span');
    p.className='pill'; p.textContent = '250 ml';
    const key = `water:${new Date().toDateString()}:${i}`;
    if(localStorage.getItem(key)==='1'){ p.classList.add('bfast'); } // color fill
    p.addEventListener('click', ()=>{
      const toggled = p.classList.toggle('bfast');
      localStorage.setItem(key, toggled ? '1':'0');
    });
    wrap.appendChild(p);
  }
}

function updateStreak(){
  // Streak increases when a day has >=3 meals checked.
  const today = todayKey();
  const keys = ['Breakfast','Lunch','Snack','Dinner'].map(k=>`done:${today}:${k}`);
  const doneCount = keys.reduce((acc,k)=> acc + (localStorage.getItem(k)==='1' ? 1:0), 0);
  const todayMarkKey = 'streak:mark:'+new Date().toDateString();
  if(doneCount>=3){ localStorage.setItem(todayMarkKey,'1'); }
  let streak=0; 
  for(let i=0;i<30;i++){
    const d=new Date(); d.setDate(d.getDate()-i);
    if(localStorage.getItem('streak:mark:'+d.toDateString())==='1'){ streak++; } else { break; }
  }
  document.getElementById('streakDays').textContent = streak;
}

window.addEventListener('DOMContentLoaded', hydrateUI);
