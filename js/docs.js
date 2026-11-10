// Documentation tab: sidebar list (like the Diagrams tab) + reader. Markdown rendered, .txt as plain text.
// ---------- Docs (from js/doc-data.js) ----------
const REPO_BLOB='https://github.com/Elvie-Abarth/marsvin-webshop/blob/master/';
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
  const plain=()=>{ // paragraphs are wrapped in spans so read-aloud can start from a clicked one
    c.innerHTML='';const p=document.createElement('pre');
    d.text.split(/(\n\s*\n)/).forEach((s,i)=>{
      if(i%2||!s.trim()){p.appendChild(document.createTextNode(s));return}
      const sp=document.createElement('span');sp.className='tp';sp.textContent=s;p.appendChild(sp);
    });
    c.appendChild(p);
  };
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
let ttsU=null,ttsT=0,ttsLen=0,ttsTry=0,ttsMarked=null; // ttsU keeps the utterance referenced (Chrome drops onend if it is garbage collected)
// The blocks that can be read (and clicked to start from): headings, paragraphs and list items of a Markdown doc (code blocks are skipped), or the paragraphs of a .txt doc.
function ttsBlocks(){
  const c=$('doccanvas'),tp=[...c.querySelectorAll('.tp')];
  if(tp.length)return tp;
  return [...c.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,td,th')]
    .filter(e=>!e.closest('pre')&&!e.querySelector('p,li,h1,h2,h3,h4,h5,h6,blockquote,pre'));
}
// Each queue item is {el, text}: short chunks (one sentence-ish each), because long utterances get cut off by some browsers.
function ttsText(){
  const out=[];
  ttsBlocks().forEach(el=>{
    let t=el.textContent;
    if(el.classList.contains('tp'))t=t.split('\n').filter(l=>!/^[\s=\-_*#~]{3,}$/.test(l)).join(' ');
    (t.replace(/\s+/g,' ').trim().match(/[^.!?:;]+[.!?:;]?\s*/g)||[])
      .map(s=>s.trim()).filter(s=>/[A-Za-z0-9]/.test(s)).forEach(s=>{
        while(s.length>220){let k=s.lastIndexOf(' ',220);if(k<80)k=220;out.push({el,text:s.slice(0,k)});s=s.slice(k).trim()}
        out.push({el,text:s});
      });
  });
  return out;
}
function ttsMark(el){
  if(ttsMarked)ttsMarked.classList.remove('tts-now');
  ttsMarked=el||null;
  if(el){el.classList.add('tts-now');el.scrollIntoView({block:'nearest',behavior:'smooth'})}
}
function ttsBegin(startEl){ // read from the start, or from the block that was clicked
  const q=ttsText();if(!q.length)return;
  ttsQueue=q;ttsIdx=0;
  if(startEl){const k=q.findIndex(x=>x.el===startEl);if(k>=0)ttsIdx=k}
  ttsRun++;TTS.cancel();ttsState='playing';ttsTry=0;ttsUi();ttsSpeak();
}
function ttsUi(){
  const b=$('ttsplay');
  b.textContent=ttsState==='playing'?'⏸ Pause':ttsState==='paused'?'▶ Resume':'🔊 Read aloud';
  $('ttsstop').disabled=ttsState==='idle';
}
function ttsVoice(){const n=$('ttsvoice').value;return TTS.getVoices().find(v=>v.name===n)||null}
function ttsSpeak(){
  const run=ttsRun;
  if(ttsIdx>=ttsQueue.length){ttsState='idle';ttsMark(null);ttsUi();return}
  const item=ttsQueue[ttsIdx];
  const u=new SpeechSynthesisUtterance(item.text);
  const rate=parseFloat($('ttsrate').value)||1;
  u.rate=rate;
  const v=ttsVoice();if(v){u.voice=v;u.lang=v.lang}else u.lang='en-US';
  u.onstart=u.onboundary=()=>{if(run===ttsRun)ttsT=Date.now()};
  u.onend=()=>{if(run!==ttsRun)return;ttsTry=0;ttsIdx++;ttsSpeak()};
  u.onerror=e=>{if(run!==ttsRun)return;if(e.error==='interrupted'||e.error==='canceled')return;ttsIdx++;ttsSpeak()};
  ttsU=u;ttsT=Date.now();ttsLen=item.text.length/rate;
  ttsMark(item.el);
  TTS.speak(u);
}
function stopSpeech(){
  if(!TTS)return;
  ttsRun++;TTS.cancel();ttsState='idle';ttsQueue=[];ttsIdx=0;ttsMark(null);ttsUi();
}
// Watchdog: Chrome sometimes stalls (stuck "paused", or an utterance that never ends). Resume it, retry the sentence, then skip it.
setInterval(()=>{
  if(!TTS||ttsState!=='playing')return;
  if(TTS.paused)TTS.resume();
  if(Date.now()-ttsT>ttsLen/14*1000+5000){
    ttsRun++;TTS.cancel();
    if(++ttsTry>=2){ttsTry=0;ttsIdx++}
    ttsSpeak();
  }
},1000);
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
    ttsBegin();
  };
  // click a heading / paragraph / list item to start reading from there (not when selecting text or clicking a link)
  $('doccanvas').classList.add('tts-on');
  $('doccanvas').addEventListener('click',e=>{
    if(e.target.closest('a')||String(getSelection()).trim())return;
    if($('doccanvas').querySelector('.msg'))return;
    const b=ttsBlocks().find(x=>x.contains(e.target));
    if(b)ttsBegin(b);
  });
  $('ttsstop').onclick=stopSpeech;
  $('ttsrate').onchange=restartSpeech;
  $('ttsvoice').onchange=()=>{try{localStorage.setItem('ttsVoice',$('ttsvoice').value)}catch(e){}restartSpeech()};
  addEventListener('beforeunload',()=>TTS.cancel());
}
initTts();
