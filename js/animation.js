// Animation engine: runs a scene step by step (route, highlights, timing, speed).
// ---------- Engine ----------
const $=id=>document.getElementById(id);
let sc=0,playing=true,token=0,speed=1;
const SPEEDS=[{n:'Slow',f:1.6},{n:'Normal',f:1},{n:'Fast',f:.6}];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function setStock(v){N.StockProducts.sub.textContent="StockQuantity: "+v}
function resetStock(){N.StockProducts.sub.textContent=PURPOSE.StockProducts}
function clearFx(){for(const k in nodeEl)nodeEl[k].setAttribute('class','node');pkt.classList.remove('w')}
function mark(ids,c){(ids||[]).forEach(i=>nodeEl[i].classList.add(c))}
function showCols(ids,cls){
  $('cols').innerHTML=ids.filter(i=>SCHEMA[i]).map(i=>`<div class="t ${cls}"><b>${i}</b><code>${SCHEMA[i].map(c=>c.replace(/ (PK\/FK|PK|FK)\b/,' <i>$1</i>')).join(', ')}</code></div>`).join('');
}
const BUSPOS={};TABLES.forEach(k=>BUSPOS['bus_'+k]={x:BUSX,y:N[k].y});
function place(id){const n=N[id]||BUSPOS[id];pkt.setAttribute('cx',n.x);pkt.setAttribute('cy',n.y)}

const ISTABLE=id=>TABLES.includes(id);
let at='customer';
const wait=async(ms,my)=>{let left=ms;while(left>0){await sleep(100);if(my!==token)return false;if(playing)left-=100}return true};
// Every trip to or from a table goes through the SQL Server box, and a
// finished SQL step brings the result back to the Stores.
function route(path){
  const seq=path.slice();
  if(seq.length&&ISTABLE(seq[0])&&(at==='back'||at==='db'||ISTABLE(at)))seq.shift();
  if(seq.length&&seq[0]===at)seq.shift();
  const out=[];let prev=at;
  for(const id of seq){
    if(ISTABLE(prev))out.push('bus_'+prev,'db');
    if(ISTABLE(id)){
      const last=out.length?out[out.length-1]:prev;
      if(last!=='db')out.push('db');
      out.push('bus_'+id);
    }
    out.push(id);prev=id;
  }
  return out;
}
async function runScene(i){
  const my=++token; sc=i;
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.scene===String(i)));
  const S=SCENES[i]; $('title').textContent=S.title;
  resetStock(); clearFx(); at=S.steps[0].path[0]; place(at);
  for(let k=0;k<S.steps.length;k++){
    if(my!==token)return;
    $('prog').firstChild.style.width=((k+1)/S.steps.length*100)+'%';
    const st=S.steps[k]; clearFx();
    $('cap').textContent=st.cap; $('sql').textContent=st.sql;
    const writes=st.write||[], reads=st.read||[];
    pkt.classList.toggle('w',writes.length>0);
    showCols([...new Set([...reads,...writes])],writes.length?'w':'');
    const trip=route(st.path);
    const endsInDb=trip.length>0&&ISTABLE(trip[trip.length-1]);
    for(const id of trip){
      place(id); at=id; await sleep(800); if(my!==token)return;
      if(id==='db'&&(reads.length||writes.length)) mark(['db'],writes.length?'write':'read');
    }
    mark(reads,'read'); mark(writes,'write'); mark(st.active,'active');
    if((reads.length||writes.length)&&!(st.active||[]).includes('back')) mark(['back'],'active');
    if(st.all)TABLES.forEach(t=>nodeEl[t].classList.add('read'));
    if(st.fx)st.fx();
    const total=(4500+60*st.cap.length)*SPEEDS[speed].f;
    if(endsInDb){
      if(!await wait(total*0.5,my))return;
      for(const id of ['bus_'+trip[trip.length-1],'db','back']){ place(id); at=id; await sleep(800); if(my!==token)return; }
      if(!await wait(total*0.5,my))return;
    }else if(!await wait(total,my))return;
  }
  if(my!==token)return;
  while(!playing && my===token) await sleep(200);
  if(my===token) runScene((i+1)%SCENES.length);
}
