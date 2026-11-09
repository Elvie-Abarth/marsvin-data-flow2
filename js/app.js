// Startup: builds the tabs, wires the buttons and keys, and starts the first scene.
{const b=document.createElement('button');b.id='dgtab';b.className='dgtab';b.textContent='📐 Diagrams';b.onclick=showDiagrams;$('tabs').appendChild(b)}
SCENES.forEach((s,i)=>{const b=document.createElement('button');b.textContent=s.name;b.onclick=()=>{showAnimation();runScene(i)};$('tabs').appendChild(b)});
$('next').onclick=()=>runScene((sc+1)%SCENES.length);
$('prev').onclick=()=>runScene((sc-1+SCENES.length)%SCENES.length);
$('speed').onclick=()=>{speed=(speed+1)%SPEEDS.length;$('speed').textContent='Speed: '+SPEEDS[speed].n};
$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'⏸':'▶'};
addEventListener('keydown',e=>{
  if(document.body.classList.contains('dg'))return;
  if(e.key==='ArrowRight')$('next').click();
  if(e.key==='ArrowLeft')$('prev').click();
  if(e.key===' '){e.preventDefault();$('play').click()}
});
resetStock();
runScene(0);
