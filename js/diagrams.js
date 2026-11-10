// Diagrams tab: lists the project diagrams and renders them live with Mermaid.
// ---------- Diagrams tab (rendered live from the project's .mermaid sources) ----------
const DG=DG_DATA; // from js/diagram-data.js
const RAW='https://raw.githubusercontent.com/Elvie-Abarth/Esti-whent-creazy-whit-the-protject/master/diagrams/png/';
let dgInit=false,dgCur=null,dgZoom=100,merP=null;const dgCache={};
function getMermaid(){
  if(!merP)merP=import('https://cdn.jsdelivr.net/npm/mermaid@11.4.0/dist/mermaid.esm.min.mjs').then(m=>{
    m.default.initialize({startOnLoad:false,theme:'dark',securityLevel:'strict',maxTextSize:400000,maxEdges:4000,
      flowchart:{useMaxWidth:false,htmlLabels:true},sequence:{useMaxWidth:false},er:{useMaxWidth:false},
      class:{useMaxWidth:false},state:{useMaxWidth:false}});
    return m.default;});
  return merP;
}
function applyZoom(){const v=document.querySelector('#dgcanvas svg');if(v)v.style.width=dgZoom+'%';}
async function openDiagram(id){
  const d=DG.find(x=>x.id===id);dgCur=id;dgZoom=100;
  [...document.querySelectorAll('#dglist button')].forEach(b=>b.classList.toggle('on',b.dataset.id===id));
  $('dgtitle').textContent=d.title;$('dgdesc').textContent=d.desc;$('dgpng').href=RAW+id+'.png';
  const c=$('dgcanvas');c.innerHTML='<div class="msg">Rendering diagram…</div>';
  try{
    if(!dgCache[id]){const m=await getMermaid();const rid='dgsvg_'+id.replace(/\W/g,'_');
      let svg=(await m.render(rid,d.src)).svg;
      // the very first render after load can come out empty for some types (ER) - one retry fixes it
      if(!/viewBox="[^"]*[1-9]/.test(svg.slice(0,400)))svg=(await m.render(rid+'_b',d.src)).svg;
      dgCache[id]=svg;}
    if(dgCur!==id)return;
    c.innerHTML=dgCache[id];const v=c.querySelector('svg');
    if(!v.getAttribute('viewBox')){ // some diagram types (ER) come without one - measure it now that it is visible
      const bb=v.getBBox();if(bb.width&&bb.height)v.setAttribute('viewBox',(bb.x-20)+' '+(bb.y-20)+' '+(bb.width+40)+' '+(bb.height+40));
    }
    v.removeAttribute('height');v.style.maxWidth='none';applyZoom();c.scrollTop=0;c.scrollLeft=0;
  }catch(e){
    if(dgCur!==id)return;
    c.innerHTML='<div class="msg">Could not render this diagram live (needs internet for the renderer). Showing the exported PNG instead - it may be older than the source.</div><img alt="'+d.title+'" src="'+RAW+id+'.png" style="max-width:100%;margin-top:12px">';
  }
}
function initDiagrams(){
  dgInit=true;let last='';let html='';
  DG.forEach(d=>{if(d.group!==last){html+='<h3>'+d.group+'</h3>';last=d.group}html+='<button data-id="'+d.id+'">'+d.title+'</button>'});
  $('dglist').innerHTML=html;
  $('dglist').onclick=e=>{const b=e.target.closest('button');if(b)openDiagram(b.dataset.id)};
  $('dgin').onclick=()=>{dgZoom=Math.min(1000,Math.round(dgZoom*1.25));applyZoom()};
  $('dgout').onclick=()=>{dgZoom=Math.max(20,Math.round(dgZoom/1.25));applyZoom()};
  $('dgfit').onclick=()=>{dgZoom=100;applyZoom()};
  openDiagram(DG[0].id);
}
function showDiagrams(){
  token++;document.body.classList.remove('doc');document.body.classList.add('dg');
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b===$('dgtab')));
  if(!dgInit)initDiagrams();
}
function showAnimation(){document.body.classList.remove('dg','doc');$('doctab').classList.remove('on');$('dgtab').classList.remove('on')}
