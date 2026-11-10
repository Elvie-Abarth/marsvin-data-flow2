// Startup: builds the tabs (grouped under small labels), wires the buttons and keys, and starts the first scene.
const TAB_GROUPS=[
  ["Shop",["Overview","Browse","Search","Cart","Checkout","Order history"]],
  ["Accounts",["Register","Login","Password","TOTP","GDPR"]],
  ["Admin",["Admin shop","Admin orders","Logbog","Staff","Contact & donations"]],
  ["Security",["Security log","JWT API","Security"]]
];
function tabGroup(label){const g=document.createElement('div');g.className='tg';g.innerHTML='<span>'+label+'</span><div></div>';$('tabs').appendChild(g);return g.lastChild}
{const g=tabGroup('Views');
 const a=document.createElement('button');a.id='dgtab';a.className='dgtab';a.textContent='📐 Diagrams';a.onclick=showDiagrams;g.appendChild(a);
 const d=document.createElement('button');d.id='doctab';d.className='dgtab doctab';d.textContent='📚 Documentation';d.onclick=()=>showDocs();g.appendChild(d)}
TAB_GROUPS.forEach(([label,names])=>{const g=tabGroup(label);
  names.forEach(n=>{const i=SCENES.findIndex(s=>s.name===n);if(i<0)return;
    const b=document.createElement('button');b.textContent=n;b.dataset.scene=i;b.onclick=()=>{showAnimation();runScene(i)};g.appendChild(b)})});
$('next').onclick=()=>runScene((sc+1)%SCENES.length);
$('prev').onclick=()=>runScene((sc-1+SCENES.length)%SCENES.length);
$('speed').onclick=()=>{speed=(speed+1)%SPEEDS.length;$('speed').textContent='Speed: '+SPEEDS[speed].n};
$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'⏸':'▶'};
addEventListener('keydown',e=>{
  if(document.body.classList.contains('dg')||document.body.classList.contains('doc'))return;
  if(e.key==='ArrowRight')$('next').click();
  if(e.key==='ArrowLeft')$('prev').click();
  if(e.key===' '){e.preventDefault();$('play').click()}
});
resetStock();
runScene(0);
