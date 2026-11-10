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
  const d=DOC_DATA.find(x=>x.id===id);if(!d)return;docCur=id;stopSpeech();
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

// ---------- Read aloud (browser speech synthesis; no internet or API needed) ----------
const TTS=('speechSynthesis' in window)?window.speechSynthesis:null;
let ttsQueue=[],ttsIdx=0,ttsState='idle',ttsRun=0;
// What gets read: headings, paragraphs and list items of a Markdown doc (code blocks are skipped), or the paragraphs of a .txt doc.
function ttsText(){
  const d=DOC_DATA.find(x=>x.id===docCur);if(!d)return[];
  let parts;
  if(d.md){
    const c=$('doccanvas');
    parts=[...c.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,td,th')]
      .filter(e=>!e.closest('pre')&&!e.querySelector('p,li,h1,h2,h3,h4,h5,h6,blockquote,pre'))
      .map(e=>e.textContent);
  }else{
    parts=d.text.split(/\n\s*\n/).map(p=>p.split('\n').filter(l=>!/^[\s=\-_*#~]{3,}$/.test(l)).join(' '));
  }
  // short chunks (one sentence-ish each): long utterances get cut off by some browsers
  return parts.flatMap(p=>(p.replace(/\s+/g,' ').trim().match(/[^.!?:;]+[.!?:;]?\s*/g)||[]))
    .map(s=>s.trim()).filter(s=>/[A-Za-z0-9]/.test(s)).flatMap(s=>{
      const out=[];while(s.length>220){let k=s.lastIndexOf(' ',220);if(k<80)k=220;out.push(s.slice(0,k));s=s.slice(k).trim()}
      out.push(s);return out;
    });
}
function ttsUi(){
  const b=$('ttsplay');
  b.textContent=ttsState==='playing'?'⏸ Pause':ttsState==='paused'?'▶ Resume':'🔊 Read aloud';
  $('ttsstop').disabled=ttsState==='idle';
}
function ttsVoice(){const n=$('ttsvoice').value;return TTS.getVoices().find(v=>v.name===n)||null}
function ttsSpeak(){
  const run=ttsRun;
  if(ttsIdx>=ttsQueue.length){ttsState='idle';ttsUi();return}
  const u=new SpeechSynthesisUtterance(ttsQueue[ttsIdx]);
  u.rate=parseFloat($('ttsrate').value)||1;
  const v=ttsVoice();if(v){u.voice=v;u.lang=v.lang}else u.lang='en-US';
  u.onend=()=>{if(run!==ttsRun)return;ttsIdx++;ttsSpeak()};
  u.onerror=e=>{if(run!==ttsRun)return;if(e.error==='interrupted'||e.error==='canceled')return;ttsIdx++;ttsSpeak()};
  TTS.speak(u);
}
function stopSpeech(){
  if(!TTS)return;
  ttsRun++;TTS.cancel();ttsState='idle';ttsQueue=[];ttsIdx=0;ttsUi();
}
function restartSpeech(){ // speed / voice changed while reading: carry on from the current sentence
  if(ttsState==='idle')return;
  ttsRun++;TTS.cancel();ttsState='playing';ttsUi();ttsSpeak();
}
function initTts(){
  if(!TTS){return}
  $('tts').hidden=false;
  const fill=()=>{
    const vs=TTS.getVoices();if(!vs.length)return;
    const sel=$('ttsvoice'),prev=sel.value;
    const rank=v=>(/^en/i.test(v.lang)?0:1)+(v.localService?0:0.5);
    const list=[...vs].sort((a,b)=>rank(a)-rank(b)||a.name.localeCompare(b.name));
    sel.innerHTML=list.map(v=>'<option value="'+v.name.replace(/"/g,'&quot;')+'">'+v.name.replace(/</g,'&lt;')+' ('+v.lang+')</option>').join('');
    let saved='';try{saved=localStorage.getItem('ttsVoice')||''}catch(e){}
    const want=prev||saved;if(want&&list.some(v=>v.name===want))sel.value=want;
  };
  fill();TTS.onvoiceschanged=fill;
  $('ttsplay').onclick=()=>{
    if(ttsState==='playing'){TTS.pause();ttsState='paused';ttsUi();return}
    if(ttsState==='paused'){TTS.resume();ttsState='playing';ttsUi();return}
    if($('doccanvas').querySelector('.msg'))return; // still rendering
    ttsQueue=ttsText();ttsIdx=0;if(!ttsQueue.length)return;
    ttsRun++;TTS.cancel();ttsState='playing';ttsUi();ttsSpeak();
  };
  $('ttsstop').onclick=stopSpeech;
  $('ttsrate').onchange=restartSpeech;
  $('ttsvoice').onchange=()=>{try{localStorage.setItem('ttsVoice',$('ttsvoice').value)}catch(e){}restartSpeech()};
  addEventListener('beforeunload',()=>TTS.cancel());
}
initTts();
