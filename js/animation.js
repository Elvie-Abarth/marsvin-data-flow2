// Animation engine: runs a scene step by step (route, highlights, timing, speed).
// ---------- Engine ----------
const $=id=>document.getElementById(id);
let sc=0,playing=true,token=0,speed=1;
const SPEEDS=[{n:'Slow',f:1.6},{n:'Normal',f:1},{n:'Fast',f:.6}];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function setStock(v){N.StockProducts.sub.textContent="StockQuantity: "+v}
// Progress meter (same idea as the webshop's password meter): the guinea pig walks toward the carrot, eats it at the end.
const PROG_WALK_MS=1200;
function setProg(f,done){
  const w=$('prog').querySelector('.pwalker'),fill=$('prog').querySelector('.pfill'),c=$('prog').querySelector('.pcarrot');
  // while the guinea pig is on the move he waddles (body bob + alternating feet); it stops when he arrives
  clearTimeout(w._walk);clearTimeout(w._hop);
  const walk=()=>{w.classList.add('walking');w._walk=setTimeout(()=>w.classList.remove('walking'),PROG_WALK_MS)};
  if(done){
    w.style.left='calc(100% - 44px)';fill.style.width='100%';walk();
    // arrives, eats the carrot, hops
    w._hop=setTimeout(()=>{c.classList.add('eaten');w.classList.remove('hop');void w.offsetWidth;w.classList.add('hop')},PROG_WALK_MS);
    return;
  }
  c.classList.remove('eaten');w.classList.remove('hop');
  if(f>0)walk();else w.classList.remove('walking');
  w.style.left='calc('+f+' * (100% - 76px))';fill.style.width='calc('+f+' * (100% - 76px) + 22px)';
}
function resetStock(){N.StockProducts.sub.textContent=PURPOSE.StockProducts}
function clearFx(){for(const k in nodeEl)nodeEl[k].setAttribute('class','node');pkt.classList.remove('w')}
function mark(ids,c){(ids||[]).forEach(i=>nodeEl[i].classList.add(c))}
function showCols(ids,cls){
  $('cols').innerHTML=ids.filter(i=>SCHEMA[i]).map(i=>`<div class="t ${cls}"><b>${i}</b><code>${SCHEMA[i].map(c=>c.replace(/ (PK\/FK|PK|FK)\b/,' <i>$1</i>')).join(', ')}</code></div>`).join('');
}
const BUSPOS={};TABLES.forEach(k=>BUSPOS['bus_'+k]={x:BUSX,y:N[k].y});
// ---------- Pip: rests in the middle on top of a box; to move on he walks to the edge, jumps the gap, lands on the next box's edge and walks to its middle ----------
const HOP_MS=1100;
let pktX=N.customer.x,pktY=N.customer.y-N.customer.h/2-18,pktId='customer';
const isBox=id=>!!N[id]&&!ISTABLE(id);
function pipSpot(id,edge){          // edge: -1 left edge, +1 right edge, 0/undefined middle
  const n=N[id];
  if(!n)return BUSPOS[id];
  if(ISTABLE(id))return {x:n.x+n.w/2+30,y:n.y};
  return {x:n.x+(edge||0)*(n.w/2-22),y:n.y-n.h/2-18};
}
function place(id,instant){
  const from=pktId;pktId=id;
  const P0={x:pktX,y:pktY},B=pipSpot(id);
  const dist=Math.hypot(B.x-P0.x,B.y-P0.y);
  pktX=B.x;pktY=B.y;
  const to='translate('+B.x+'px,'+B.y+'px)';
  const dir=B.x>P0.x+1?1:B.x<P0.x-1?-1:0;
  if(dir>0)pktFlip.setAttribute('transform','scale(-1,1)');      // heading right: face right
  else if(dir<0)pktFlip.setAttribute('transform','scale(1,1)');  // heading left: face left
  const calm=instant||matchMedia('(prefers-reduced-motion: reduce)').matches||!pkt.animate;
  pkt.style.transition=(calm&&!instant)?'transform .8s ease-in-out':'none';
  pkt.style.transform=to;
  if(calm||dist<=6)return;
  const bob=(o,r)=>({transform:'translateY(-3px) rotate('+r+'deg)',offset:o});
  const flat=o=>({transform:'translateY(0) rotate(0deg)',offset:o});
  if(isBox(from)&&isBox(id)&&Math.abs(B.x-P0.x)>=40){
    // box -> box: walk to the edge, jump the gap, walk to the middle
    const A1=pipSpot(from,dir),B1=pipSpot(id,-dir);
    const gap=Math.hypot(B1.x-A1.x,B1.y-A1.y),h=Math.min(70,16+gap*0.35);
    const t=p=>'translate('+p.x+'px,'+p.y+'px)';
    pkt.animate([
      {transform:t(P0),offset:0,easing:'linear'},
      {transform:t(A1),offset:.28,easing:'linear'},
      {transform:t(B1),offset:.70,easing:'linear'},
      {transform:t(B),offset:1}
    ],{duration:HOP_MS});
    pktHop.animate([
      flat(0),bob(.07,-4),flat(.14),bob(.21,4),
      {transform:'translateY(0) scale(1.08,.9)',offset:.28,easing:'ease-out'},     // crouch
      {transform:'translateY('+(-h)+'px) scale(.95,1.06)',offset:.49,easing:'ease-in'},
      {transform:'translateY(0) scale(1,1)',offset:.66},
      {transform:'translateY(0) scale(1.1,.86)',offset:.70},                       // landing squash
      {transform:'translateY(0) scale(1,1)',offset:.73},
      bob(.80,-4),flat(.88),bob(.94,4),flat(1)
    ],{duration:HOP_MS});
  }else{
    // other moves (vertical, to the database, tables): a short walk, then a jump
    const W=.3,mx=P0.x+(B.x-P0.x)*W,my=P0.y+(B.y-P0.y)*W,h=Math.min(70,14+dist*0.22);
    pkt.animate([
      {transform:'translate('+P0.x+'px,'+P0.y+'px)',offset:0,easing:'linear'},
      {transform:'translate('+mx+'px,'+my+'px)',offset:W,easing:'ease-in-out'},
      {transform:to,offset:1}
    ],{duration:HOP_MS});
    pktHop.animate([
      flat(0),bob(.1,-4),flat(.2),
      {transform:'translateY(0) scale(1.08,.9)',offset:.3,easing:'ease-out'},
      {transform:'translateY('+(-h)+'px) scale(.95,1.06)',offset:.62,easing:'ease-in'},
      {transform:'translateY(0) scale(1,1)',offset:.92},
      {transform:'translateY(0) scale(1.1,.86)',offset:.96},
      {transform:'translateY(0) scale(1,1)',offset:1}
    ],{duration:HOP_MS});
  }
}

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
  resetStock(); clearFx(); setProg(0); at=S.steps[0].path[0]; place(at,true);
  for(let k=0;k<S.steps.length;k++){
    if(my!==token)return;
    setProg(k/S.steps.length+0.5/S.steps.length);
    const st=S.steps[k]; clearFx();
    $('cap').textContent=st.cap; $('sql').textContent=st.sql;
    const writes=st.write||[], reads=st.read||[];
    pkt.classList.toggle('w',writes.length>0);
    showCols([...new Set([...reads,...writes])],writes.length?'w':'');
    const trip=route(st.path);
    const endsInDb=trip.length>0&&ISTABLE(trip[trip.length-1]);
    for(const id of trip){
      place(id); at=id; await sleep(HOP_MS); if(my!==token)return;
      if(id==='db'&&(reads.length||writes.length)) mark(['db'],writes.length?'write':'read');
    }
    mark(reads,'read'); mark(writes,'write'); mark(st.active,'active');
    if((reads.length||writes.length)&&!(st.active||[]).includes('back')) mark(['back'],'active');
    if(st.all)TABLES.forEach(t=>nodeEl[t].classList.add('read'));
    if(st.fx)st.fx();
    const total=(4500+60*st.cap.length)*SPEEDS[speed].f;
    if(endsInDb){
      if(!await wait(total*0.5,my))return;
      for(const id of ['bus_'+trip[trip.length-1],'db','back']){ place(id); at=id; await sleep(HOP_MS); if(my!==token)return; }
      if(!await wait(total*0.5,my))return;
    }else if(!await wait(total,my))return;
  }
  if(my!==token)return;
  setProg(1,true); if(!await wait(PROG_WALK_MS+1200,my))return; // the guinea pig walks to the end, eats the carrot and hops
  while(!playing && my===token) await sleep(200);
  if(my===token) runScene((i+1)%SCENES.length);
}
