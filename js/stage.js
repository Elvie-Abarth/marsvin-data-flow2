// The drawing: nodes (customer, Razor Pages, Stores, SQL Server, tables), wires and the packet.
// ---------- Layout ----------
const N={
  customer:{x:80,y:385,w:130,h:76,t:"👤 Customer"},
  web:{x:265,y:385,w:170,h:92,t:"🌐 Razor Pages",s:"PageModels (.cshtml.cs)"},
  back:{x:495,y:385,w:170,h:92,t:"⚙️ Stores",s:"IXxxStore → SqlXxxStore"},
  captcha:{x:495,y:150,w:170,h:70,t:"🛡️ reCAPTCHA",s:"bot check"},
  mail:{x:495,y:620,w:170,h:70,t:"✉️ Email",s:"MailKit / logging"}
};
N.db={x:705,y:385,w:150,h:92,t:"🗄️ SQL Server",s:"the database"};
TABLES.forEach((k,i)=>N[k]={x:960,y:36+i*49,w:210,h:42,t:"🗄️ "+k,s:PURPOSE[k]});

const svg=document.getElementById('svg');
const NS="http://www.w3.org/2000/svg";
function el(n,a,p=svg){const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);p.appendChild(e);return e}

[["customer","web"],["web","back"]].forEach(([a,b])=>el('line',{class:'link',x1:N[a].x+N[a].w/2,y1:N[a].y,x2:N[b].x-N[b].w/2,y2:N[b].y}));
["captcha","mail"].forEach(k=>el('line',{class:'link',x1:N.back.x,y1:N.back.y+(k==="captcha"?-1:1)*N.back.h/2,x2:N[k].x,y2:N[k].y+(k==="captcha"?1:-1)*N[k].h/2}));
const BUSX=832, FIRST=N[TABLES[0]].y, LAST=N[TABLES[TABLES.length-1]].y;
el('rect',{x:812,y:2,width:276,height:758,rx:16,fill:'none',stroke:'#475569','stroke-width':2,'stroke-dasharray':'8 6'});
el('line',{class:'wire',x1:N.back.x+N.back.w/2,y1:N.back.y,x2:N.db.x-N.db.w/2,y2:N.db.y});
el('line',{class:'wire',x1:N.db.x+N.db.w/2,y1:N.db.y,x2:BUSX,y2:N.db.y});
el('line',{class:'wire',x1:BUSX,y1:FIRST,x2:BUSX,y2:LAST});
TABLES.forEach(k=>el('line',{class:'wire',x1:BUSX,y1:N[k].y,x2:N[k].x-105,y2:N[k].y}));


const nodeEl={};
for(const id in N){
  const n=N[id],g=el('g',{class:'node',transform:`translate(${n.x-n.w/2},${n.y-n.h/2})`});if(!TABLES.includes(id))g.setAttribute('data-big','');
  el('rect',{width:n.w,height:n.h,rx:12},g);
  const big=!TABLES.includes(id),t=el('text',{x:n.w/2,y:n.s?n.h/2-(big?11:8):n.h/2},g);t.textContent=n.t;
  if(n.s){const s=el('text',{class:'sub',x:n.w/2,y:n.h/2+(big?14:11)},g);s.textContent=n.s;n.sub=s}
  [['r','READ'],['w','WRITE'],['a','PROCESSING']].forEach(([c,t])=>{
    const b=el('text',{class:'badge '+c,x:n.w-6,y:big?n.h+15:-5},g);b.textContent=t;
  });
  nodeEl[id]=g;
}
// The packet is Pip the guinea pig (the webshop's chat mascot). #pkt moves, #pktflip mirrors him to face the way he walks.
const pkt=el('g',{id:'pkt'});pkt.style.transform='translate('+N.customer.x+'px,'+N.customer.y+'px)';
const pktHop=el('g',{id:'pkthop'},pkt);   // #pkthop does the jump (up and down) between two spots
const pktFlip=el('g',{id:'pktflip',transform:'scale(-1,1)'},pktHop);
el('g',{transform:'translate(-34.8,-24.4) scale(.58)'},pktFlip).innerHTML=`<path d="M22 80 C16 60 24 30 50 20 C72 12 100 16 111 36 C119 50 118 68 115 81 Q109 71 104 81 Q98 71 92 81 Q86 71 80 81 Q74 71 68 81 Q62 71 56 81 Q50 71 44 81 Q38 71 32 81 Q27 73 22 80 Z" fill="#B19888"/><path d="M66 15 C86 14 104 22 111 36 C119 50 118 68 115 81 Q109 71 104 81 Q101 75 99 76 C103 56 96 30 66 15 Z" fill="#9F8475"/><g fill="none" stroke-linecap="round" opacity="0.55"><path d="M62 17 C58 34 60 54 55 74" stroke="#8C7163" stroke-width="1.2"/><path d="M74 16 C76 34 80 54 77 74" stroke="#C0794C" stroke-width="1.8"/><path d="M86 19 C92 36 96 56 93 74" stroke="#E2D3C7" stroke-width="1.3"/><path d="M97 25 C105 40 109 58 106 74" stroke="#C0794C" stroke-width="1.5"/><path d="M52 21 C46 38 46 56 42 74" stroke="#E2D3C7" stroke-width="1.3"/></g><ellipse cx="25" cy="55" rx="19" ry="18" fill="#D2BEB0"/><ellipse cx="40" cy="50" rx="6" ry="9" transform="rotate(14 40 50)" fill="#9A7F70"/><path d="M30 34 C36 16 60 12 74 20 C62 22 52 30 47 44 C45 38 42 36 40 38 C36 34 33 38 31 46 C28 40 24 42 21 48 C20 42 16 44 13 50 C13 42 20 34 30 34 Z" fill="#DDCDC1"/><g fill="none" stroke-linecap="round" opacity="0.6"><path d="M34 30 C44 20 58 17 68 20" stroke="#C0794C" stroke-width="1.5"/><path d="M26 37 C36 26 48 22 58 22" stroke="#B19888" stroke-width="1.2"/></g><circle cx="20" cy="55" r="4.4" fill="#5B1626"/><circle cx="20" cy="55" r="3.2" fill="#8E2740"/><circle cx="21.3" cy="53.7" r="1.2" fill="#fff"/><ellipse cx="7" cy="60" rx="2.8" ry="2.1" fill="#E8A9B9"/><path d="M8 65 q4 3 8 0" fill="none" stroke="#8C7163" stroke-width="1.3" stroke-linecap="round"/>`;
