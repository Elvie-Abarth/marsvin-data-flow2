// The drawing: nodes (customer, Razor Pages, Stores, SQL Server, tables), wires and the packet.
// ---------- Layout ----------
const N={
  customer:{x:80,y:385,w:116,h:56,t:"👤 Customer"},
  web:{x:270,y:385,w:150,h:66,t:"🌐 Razor Pages",s:"PageModels (.cshtml.cs)"},
  back:{x:510,y:385,w:150,h:66,t:"⚙️ Stores",s:"IXxxStore → SqlXxxStore"},
  captcha:{x:510,y:150,w:150,h:50,t:"🛡️ reCAPTCHA",s:"bot check"},
  mail:{x:510,y:620,w:150,h:50,t:"✉️ Email",s:"MailKit / logging"}
};
N.db={x:735,y:385,w:110,h:76,t:"🗄️ SQL Server",s:"the database"};
TABLES.forEach((k,i)=>N[k]={x:960,y:36+i*49,w:210,h:42,t:"🗄️ "+k,s:PURPOSE[k]});

const svg=document.getElementById('svg');
const NS="http://www.w3.org/2000/svg";
function el(n,a,p=svg){const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);p.appendChild(e);return e}

[["customer","web"],["web","back"]].forEach(([a,b])=>el('line',{class:'link',x1:N[a].x+N[a].w/2,y1:N[a].y,x2:N[b].x-N[b].w/2,y2:N[b].y}));
["captcha","mail"].forEach(k=>el('line',{class:'link',x1:N.back.x,y1:N.back.y+(k==="captcha"?-33:33),x2:N[k].x,y2:N[k].y+(k==="captcha"?25:-25)}));
const BUSX=832, FIRST=N[TABLES[0]].y, LAST=N[TABLES[TABLES.length-1]].y;
el('rect',{x:812,y:2,width:276,height:758,rx:16,fill:'none',stroke:'#475569','stroke-width':2,'stroke-dasharray':'8 6'});
el('line',{class:'wire',x1:N.back.x+75,y1:N.back.y,x2:N.db.x-55,y2:N.db.y});
el('line',{class:'wire',x1:N.db.x+55,y1:N.db.y,x2:BUSX,y2:N.db.y});
el('line',{class:'wire',x1:BUSX,y1:FIRST,x2:BUSX,y2:LAST});
TABLES.forEach(k=>el('line',{class:'wire',x1:BUSX,y1:N[k].y,x2:N[k].x-105,y2:N[k].y}));


const nodeEl={};
for(const id in N){
  const n=N[id],g=el('g',{class:'node',transform:`translate(${n.x-n.w/2},${n.y-n.h/2})`});
  el('rect',{width:n.w,height:n.h,rx:12},g);
  const t=el('text',{x:n.w/2,y:n.s?n.h/2-8:n.h/2},g);t.textContent=n.t;
  if(n.s){const s=el('text',{class:'sub',x:n.w/2,y:n.h/2+11},g);s.textContent=n.s;n.sub=s}
  [['r','READ'],['w','WRITE'],['a','PROCESSING']].forEach(([c,t])=>{
    const b=el('text',{class:'badge '+c,x:n.w-6,y:-5},g);b.textContent=t;
  });
  nodeEl[id]=g;
}
const pkt=el('circle',{id:'pkt',r:11,cx:N.customer.x,cy:N.customer.y});
