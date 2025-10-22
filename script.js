
// script.js - site logic for Dolphin Guardião
const tabs = document.querySelectorAll('.tab-btn');
const screens = document.querySelectorAll('.screen');
const stories = [
  "Era uma vez um golfinho alegre chamado Dolphin. Ele adorava brincar com as ondas e dançar entre os corais coloridos.",
  "Mas um dia, Dolphin percebeu algo estranho: havia garrafas plásticas, sacolinhas e canudos perdidos pelo oceano!",
  "Então, ele decidiu se tornar o Guardião do Oceano. Dolphin começou a nadar rápido de um lado para o outro, recolhendo cada pedacinho de lixo que encontrava.",
  "E é aqui que você entra! Com nossos joguinhos interativos, ajude nosso amigo a salvar o Oceano!"
];
let storyIndex = 0;
const storyText = document.getElementById('storyText');
document.getElementById('nextStory').addEventListener('click', ()=>{ storyIndex = (storyIndex+1) % stories.length; storyText.innerText = stories[storyIndex]; });
document.getElementById('prevStory').addEventListener('click', ()=>{ storyIndex = (storyIndex-1+stories.length) % stories.length; storyText.innerText = stories[storyIndex]; });

tabs.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelector('.tab-btn.active').classList.remove('active');
    btn.classList.add('active');
    const t = btn.dataset.target;
    screens.forEach(s=> s.classList.remove('active'));
    document.getElementById(t).classList.add('active');
    // pause ambient when switching away from game maybe
    if(t==='game') document.getElementById('ambient').play().catch(()=>{});
  });
});

// Game logic: falling trash, draggable bin, score and timer
const field = document.getElementById('field');
const bin = document.getElementById('bin');
let running = false;
let score = 0;
let timeLeft = 30;
let spawnInterval, updateInterval, timerInterval;
const oceanBar = document.getElementById('oceanBar');
const oceanVal = document.getElementById('oceanVal');
const moodBar = document.getElementById('moodBar');
const moodVal = document.getElementById('moodVal');
const careDolphin = document.getElementById('careDolphin');

function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

function startGame(){
  if(running) return;
  running = true;
  score = 0; timeLeft = 30;
  document.getElementById('score').innerText = score;
  document.getElementById('time').innerText = timeLeft;
  spawnInterval = setInterval(spawnTrash, 800);
  updateInterval = setInterval(updatePositions, 1000/30);
  timerInterval = setInterval(()=>{ timeLeft--; document.getElementById('time').innerText = timeLeft; if(timeLeft<=0) endGame(); }, 1000);
}

function stopGame(){
  running = false;
  clearIntervals();
  clearTrash();
}

function clearIntervals(){
  clearInterval(spawnInterval); clearInterval(updateInterval); clearInterval(timerInterval);
}

function spawnTrash(){
  const img = document.createElement('img');
  img.src = Math.random()>0.5 ? 'assets/trash1.png' : 'assets/trash2.png';
  img.className = 'trash';
  img.style.width = '48px';
  img.style.position = 'absolute';
  img.style.left = rand(10, field.clientWidth-60) + 'px';
  img.style.top = '-60px';
  img.vy = rand(120,200) / 60; // px per frame (approx)
  field.appendChild(img);
}

function updatePositions(){
  const trashes = Array.from(field.querySelectorAll('.trash'));
  trashes.forEach(t => {
    const top = parseFloat(t.style.top);
    t.style.top = (top + t.vy) + 'px';
    // check collision with bin
    const bx = bin.offsetLeft + bin.clientWidth/2;
    const by = bin.offsetTop;
    const tx = t.offsetLeft + t.clientWidth/2;
    const ty = t.offsetTop + t.clientHeight/2;
    if( ty > by && tx > bin.offsetLeft && tx < bin.offsetLeft + bin.clientWidth ){
      // collected
      score += 1;
      document.getElementById('score').innerText = score;
      t.remove();
    }else if( top > field.clientHeight ){
      t.remove(); // missed
    }
  });
}

function endGame(){
  running = false;
  clearIntervals();
  // award ocean cleanliness based on score
  const added = Math.min(20, Math.floor(score/2));
  const current = parseInt(oceanBar.value || 0);
  const newVal = Math.min(100, current + added);
  oceanBar.value = newVal;
  oceanVal.innerText = newVal;
  // adjust mood
  const mood = Math.min(100, parseInt(moodBar.value) + Math.floor(added/1.5));
  moodBar.value = mood; moodVal.innerText = mood;
  // show finish message briefly
  alert('Fim! Score: '+score+'\n+'+added+'% limpeza do oceano');
}

function clearTrash(){
  Array.from(field.querySelectorAll('.trash')).forEach(t=>t.remove());
}

// Drag bin with mouse or touch
let dragging = false;
let dragOffsetX = 0;
bin.addEventListener('pointerdown', (e)=>{ dragging = true; dragOffsetX = e.clientX - bin.getBoundingClientRect().left; bin.setPointerCapture(e.pointerId); });
window.addEventListener('pointermove', (e)=>{ if(!dragging) return; let x = e.clientX - field.getBoundingClientRect().left - dragOffsetX; x = Math.max(0, Math.min(field.clientWidth - bin.clientWidth, x)); bin.style.left = x + 'px'; });
window.addEventListener('pointerup', (e)=>{ dragging = false; try{ e.target.releasePointerCapture && e.target.releasePointerCapture(e.pointerId); }catch(e){} });

// Buttons
document.getElementById('startGame').addEventListener('click', startGame);
document.getElementById('stopGame').addEventListener('click', stopGame);

// Care actions
document.querySelectorAll('.care-buttons button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const action = btn.dataset.action;
    let mood = parseInt(moodBar.value);
    if(action==='shower') mood = Math.min(100, mood + 12);
    if(action==='feed') mood = Math.min(100, mood + 10);
    if(action==='rest') mood = Math.min(100, mood + 8);
    // bonus for clean ocean
    if(parseInt(oceanBar.value) >= 80) mood = Math.min(100, mood + 8);
    moodBar.value = mood; moodVal.innerText = mood;
    // change dolphin expression slightly by CSS filter
    if(mood >= 80){
      careDolphin.style.filter = 'saturate(1.4)';
    }else if(mood < 40){
      careDolphin.style.filter = 'grayscale(0.6) brightness(0.9)';
    }else{
      careDolphin.style.filter = '';
    }
  });
});

// Initialize default story text
storyText.innerText = stories[storyIndex];

// Play ambient sound at low volume
const ambient = document.getElementById('ambient');
ambient.volume = 0.12;
ambient.play().catch(()=>{});

// Simple keyboard navigation (left/right for story)
document.addEventListener('keydown', (e)=>{
  if(document.querySelector('.screen.story.active')){
    if(e.key === 'ArrowRight') document.getElementById('nextStory').click();
    if(e.key === 'ArrowLeft') document.getElementById('prevStory').click();
  }
});
