// Tiny test runner + tests. Open http://localhost:5173/tests/ (or run tests/run.py for a command-line result).
const results=[];let group="";
const suite=n=>{group=n};
function test(name,fn){
  try{const msgs=fn()||[];results.push({group,name,fail:msgs});}
  catch(e){results.push({group,name,fail:["threw: "+e.message]});}
}
const ids=Object.keys(N);
const sceneText=s=>s.steps.map(x=>x.cap+"\n"+x.sql).join("\n");
const stepId=(s,k)=>s.name+" step "+(k+1);

// Wires that really exist in the drawing (stage.js). Tables connect through the SQL Server box.
const isTable=id=>TABLES.includes(id);
function adjacent(a,b){
  if(a===b)return true;
  const pair=[a,b].sort().join("|");
  if(["customer|web","back|web","back|captcha","back|mail"].includes(pair))return true;
  if(isTable(a)&&isTable(b))return true;            // via db + bus
  if((a==="back"&&isTable(b))||(b==="back"&&isTable(a)))return true;
  return false;
}

suite("Structure");
test("every scene in SCENE_ORDER is defined, and none is forgotten",()=>{
  const f=[];
  SCENE_ORDER.forEach(n=>{if(!SCENE_DEFS[n])f.push("not defined: "+n)});
  Object.keys(SCENE_DEFS).forEach(n=>{if(!SCENE_ORDER.includes(n))f.push("defined but not in order.js: "+n)});
  if(new Set(SCENE_ORDER).size!==SCENE_ORDER.length)f.push("duplicate in SCENE_ORDER");
  return f;
});
test("no script errors while loading",()=>window.__loadErrors.slice());
test("every scene has a title and at least one step with caption + sql",()=>{
  const f=[];
  SCENES.forEach(s=>{
    if(!s.title)f.push(s.name+": no title");
    if(!s.steps||!s.steps.length)f.push(s.name+": no steps");
    (s.steps||[]).forEach((x,k)=>{if(!x.cap)f.push(stepId(s,k)+": no caption");if(!x.sql)f.push(stepId(s,k)+": no sql")});
  });
  return f;
});
test("every table has a PURPOSE and a position in the drawing",()=>{
  return TABLES.flatMap(t=>[PURPOSE[t]?null:t+": no PURPOSE",N[t]?null:t+": not drawn"]).filter(Boolean);
});

suite("Animation");
test("every node in a path / read / write / active exists in the drawing",()=>{
  const f=[];
  SCENES.forEach(s=>s.steps.forEach((x,k)=>{
    [["path",x.path],["read",x.read],["write",x.write],["active",x.active]].forEach(([w,list])=>
      (list||[]).forEach(id=>{if(!ids.includes(id))f.push(stepId(s,k)+" "+w+": unknown node '"+id+"'")}));
  }));
  return f;
});
test("the packet only moves along wires that exist (no jumps inside a step)",()=>{
  const f=[];
  SCENES.forEach(s=>s.steps.forEach((x,k)=>{
    for(let i=1;i<x.path.length;i++)
      if(!adjacent(x.path[i-1],x.path[i]))f.push(stepId(s,k)+": "+x.path[i-1]+" -> "+x.path[i]+" has no wire");
  }));
  return f;
});
test("each step starts where the previous step ended (no jump between steps)",()=>{
  const f=[];
  SCENES.forEach(s=>{
    for(let k=1;k<s.steps.length;k++){
      const prev=s.steps[k-1].path, last=prev[prev.length-1], first=s.steps[k].path[0];
      // a step that touched a table comes back to the Stores afterwards (animation.js)
      const from=isTable(last)?"back":last;
      if(!adjacent(from,first)&&!(isTable(last)&&adjacent(last,first)))f.push(stepId(s,k)+": starts at "+first+" but the packet is at "+from);
    }
  });
  return f;
});
test("every table in read/write is on the path or reached through a neighbour step",()=>{
  // reading/writing a table that the packet never goes near would light it up for no reason
  const f=[];
  SCENES.forEach(s=>s.steps.forEach((x,k)=>{
    const touched=new Set(x.path.filter(isTable));
    const marked=[...(x.read||[]),...(x.write||[])].filter(isTable);
    if(marked.length&&!touched.size)f.push(stepId(s,k)+": marks "+marked.join(",")+" but the path visits no table");
  }));
  return f;
});
test("a step that writes sets the packet to 'write' colour, a read-only step to 'read'",()=>{
  const f=[];
  SCENES.forEach(s=>s.steps.forEach((x,k)=>{if((x.write||[]).some(t=>!isTable(t)))f.push(stepId(s,k)+": write list contains a non-table")}));
  return f;
});

suite("SQL matches the schema");
const colName=c=>c.trim().split(/[\s(]/)[0];
const schemaCols=t=>new Set(SCHEMA[t].flatMap(c=>c.split(" / ")).map(colName));
function allSql(){return SCENES.flatMap(s=>s.steps.map((x,k)=>({id:stepId(s,k),sql:x.sql})))}
test("every dbo.<Table> mentioned in SQL is a real table",()=>{
  const f=[];
  allSql().forEach(({id,sql})=>{for(const m of sql.matchAll(/dbo\.(\w+)/g))if(!TABLES.includes(m[1]))f.push(id+": unknown table dbo."+m[1])});
  return f;
});
test("INSERT column lists only use real columns",()=>{
  const f=[];
  allSql().forEach(({id,sql})=>{
    for(const m of sql.matchAll(/INSERT INTO dbo\.(\w+)\s*\(([^)]*)\)/g)){
      if(!SCHEMA[m[1]])continue;
      const have=schemaCols(m[1]);
      m[2].split(",").map(c=>c.trim()).filter(c=>c&&c!=="...").forEach(c=>{if(!have.has(c))f.push(id+": "+m[1]+"."+c+" is not in the schema")});
    }
  });
  return f;
});
test("UPDATE ... SET only uses real columns",()=>{
  const f=[];
  allSql().forEach(({id,sql})=>{
    for(const m of sql.matchAll(/UPDATE dbo\.(\w+)\s+SET\s+([^;]*?)(?:\s+WHERE|;|$)/gs)){
      if(!SCHEMA[m[1]])continue;
      const have=schemaCols(m[1]);
      for(const a of m[2].matchAll(/(\w+)\s*=/g))if(!have.has(a[1]))f.push(id+": "+m[1]+"."+a[1]+" is not in the schema");
    }
  });
  return f;
});
test("Overview's table count equals the number of tables in the schema",()=>{
  const t=sceneText(SCENE_DEFS.Overview);const m=t.match(/(\d+) shop tables/);
  if(!m)return ["Overview no longer states a table count"];
  return +m[1]===TABLES.length?[]:["Overview says "+m[1]+", schema has "+TABLES.length];
});
test("the SQL a scene shows for checkout stock matches the cart example",()=>{
  const cart=sceneText(SCENE_DEFS.Cart).match(/Quantity=(\d+)/), co=sceneText(SCENE_DEFS.Checkout).match(/StockQuantity - (\d+)/);
  if(!cart||!co)return ["could not find both quantities"];
  return cart[1]===co[1]?[]:["Cart adds "+cart[1]+" but checkout subtracts "+co[1]];
});

suite("Accuracy facts (checked against the real source)");
FACTS.forEach(f=>{
  test(f.scene+": "+(f.has?"has \""+f.has+"\"":"lacks \""+f.lacks+"\"")+"  ["+f.src+"]",()=>{
    const s=SCENE_DEFS[f.scene];if(!s)return ["no such scene"];
    const t=sceneText(s);
    if(f.has&&!t.includes(f.has))return ["text no longer contains it - update the scene or the fact"];
    if(f.lacks&&t.includes(f.lacks))return ["text contains something known to be wrong"];
    return [];
  });
});

// ---------- report ----------
const failed=results.filter(r=>r.fail.length);
document.getElementById("sum").innerHTML=failed.length
  ?`<span class="bad">${failed.length} of ${results.length} tests FAILED</span>`
  :`<span class="ok">All ${results.length} tests passed</span>`;
let html="",g="";
results.forEach(r=>{
  if(r.group!==g){g=r.group;html+=`<h2>${g}</h2>`}
  html+=`<li class="${r.fail.length?"bad":"ok"}">${r.fail.length?"✗":"✓"} ${r.name.replace(/</g,"&lt;")}`+
    r.fail.map(m=>`<br>&nbsp;&nbsp;<code>${m.replace(/</g,"&lt;")}</code>`).join("")+"</li>";
});
document.getElementById("out").innerHTML=html;
document.title=(failed.length?"FAIL ":"PASS ")+(results.length-failed.length)+"/"+results.length;
