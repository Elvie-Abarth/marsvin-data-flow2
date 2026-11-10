// Documentation tab: sidebar list (like the Diagrams tab) + reader. Markdown rendered, .txt as plain text.
// ---------- Docs (from js/doc-data.js) ----------
const REPO_BLOB='https://github.com/Elvie-Abarth/Esti-whent-creazy-whit-the-protject/blob/master/';
let libP=null,docCur=null,docInit=false;
function loadMarkdownLibs(){
  if(!libP){
    const add=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
    libP=Promise.all([add('https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js'),add('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js')]);
  }
  return libP;
}
async function openDoc(id){
  const d=DOC_DATA.find(x=>x.id===id);if(!d)return;docCur=id;
  [...document.querySelectorAll('#doclist button')].forEach(b=>b.classList.toggle('on',b.dataset.id===id));
  $('doctitle').textContent=d.title;
  $('docsrc').href=REPO_BLOB+d.path;$('docsrc').textContent=d.path;
  const c=$('doccanvas');c.scrollTop=0;
  const plain=()=>{c.innerHTML='';const p=document.createElement('pre');p.textContent=d.text;c.appendChild(p)};
  if(!d.md){plain();return}
  c.innerHTML='<div class="msg">Rendering…</div>';
  try{
    await loadMarkdownLibs();
    if(docCur!==id)return;
    c.innerHTML=DOMPurify.sanitize(marked.parse(d.text));
    c.querySelectorAll('a').forEach(a=>{a.target='_blank';a.rel='noopener'});
  }catch(e){if(docCur===id)plain()} // offline: show the raw text instead
}
function initDocs(){
  docInit=true;let last='',html='';
  DOC_DATA.forEach(d=>{if(d.group!==last){html+='<h3>'+d.group+'</h3>';last=d.group}html+='<button data-id="'+d.id+'">'+d.title+'</button>'});
  $('doclist').innerHTML=html;
  $('doclist').onclick=e=>{const b=e.target.closest('button');if(b)openDoc(b.dataset.id)};
  openDoc(DOC_DATA[0].id);
}
function showDocs(){
  token++;document.body.classList.remove('dg');document.body.classList.add('doc');
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b===$('doctab')));
  if(!docInit)initDocs();
}
