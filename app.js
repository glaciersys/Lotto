// ===== Constants & Config =====
const $ = id => document.getElementById(id);

const LBL = {
  '2': {title:'หวย 2 ตัว', top:'บน', bot:'ล่าง', topFull:'2 ตัวบน', botFull:'2 ตัวล่าง', digits:2, perPanel:25, rrt:70, rrb:70, slipTitle:'ใบโพยหวย 2 ตัว', phT:'45', phB:'72'},
  '3': {title:'หวย 3 ตัว', top:'เต็ง', bot:'โต๊ด', topFull:'3 ตัวเต็ง', botFull:'3 ตัวโต๊ด', digits:3, perPanel:250, rrt:900, rrb:150, slipTitle:'ใบโพยหวย 3 ตัว', phT:'123', phB:'456'}
};

let MODE = localStorage.getItem('h_mode') || '2';
let D = {}, E = {};
const cfg = () => LBL[MODE];

// ===== Buyers =====
function dataKey(m,b){ return 'h'+m+'d_'+b; }
function entryKey(m,b){ return 'h'+m+'e_'+b; }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

let BUYERS = JSON.parse(localStorage.getItem('h_buyers')||'null');
let currentBuyer = localStorage.getItem('h_current_buyer');

if(!BUYERS || !BUYERS.length){
  const id='b'+Date.now();
  BUYERS=[{id, name:'หน้าร้าน'}];
  ['2','3'].forEach(m=>{
    const d=localStorage.getItem('h'+m+'d'); if(d!==null) localStorage.setItem(dataKey(m,id), d);
    const e=localStorage.getItem('h'+m+'e'); if(e!==null) localStorage.setItem(entryKey(m,id), e);
  });
  currentBuyer=id;
}
if(currentBuyer!=='ALL' && !BUYERS.find(b=>b.id===currentBuyer)){
  currentBuyer = BUYERS.length ? BUYERS[0].id : 'ALL';
}
function saveBuyers(){ localStorage.setItem('h_buyers', JSON.stringify(BUYERS)); }
function saveCurrentBuyer(){ localStorage.setItem('h_current_buyer', currentBuyer); }
saveBuyers(); saveCurrentBuyer();

function combineAll(m){
  const out={};
  BUYERS.forEach(b=>{
    const bd=JSON.parse(localStorage.getItem(dataKey(m,b.id))||'{}');
    for(const n in bd){
      if(!out[n]) out[n]={top:0,bot:0};
      out[n].top+=bd[n].top||0;
      out[n].bot+=bd[n].bot||0;
    }
  });
  return out;
}

function loadData(){
  if(currentBuyer==='ALL'){
    D = combineAll(MODE);
    E = [];
  } else {
    D = JSON.parse(localStorage.getItem(dataKey(MODE,currentBuyer))||'{}');
    E = JSON.parse(localStorage.getItem(entryKey(MODE,currentBuyer))||'[]');
  }
}
const sv = () => {
  if(currentBuyer==='ALL') return;
  localStorage.setItem(dataKey(MODE,currentBuyer),JSON.stringify(D));
  localStorage.setItem(entryKey(MODE,currentBuyer),JSON.stringify(E));
};

function renderBuyerBar(){
  $('buyerScroll').innerHTML = BUYERS.map(b=>
    `<div class="buyer-chip${b.id===currentBuyer?' on':''}" onclick="switchBuyer('${b.id}')">${escapeHtml(b.name)}<span class="buyer-del" onclick="event.stopPropagation();delBuyer('${b.id}')">✕</span></div>`
  ).join('');
  $('allChip').classList.toggle('on', currentBuyer==='ALL');
}

function updateAllViewUI(){
  const isAll = currentBuyer==='ALL';
  $('ibar').style.display = isAll ? 'none' : '';
  $('allbar').style.display = isAll ? '' : 'none';
  $('btnSpecial').style.display = (!isAll && MODE==='2') ? '' : 'none';
  $('btnClear').style.display = isAll ? 'none' : '';
}

function promptAddBuyer(){
  const name=prompt('ชื่อผู้ซื้อใหม่:');
  if(!name||!name.trim())return;
  const id='b'+Date.now();
  BUYERS.push({id, name:name.trim()});
  saveBuyers();
  switchBuyer(id);
}

function delBuyer(id){
  if(BUYERS.length<=1){alert('ต้องมีผู้ซื้ออย่างน้อย 1 คน');return;}
  const b=BUYERS.find(x=>x.id===id);
  if(!confirm(`ลบ "${b?b.name:''}" และข้อมูลทั้งหมดของผู้ซื้อนี้?`))return;
  BUYERS=BUYERS.filter(x=>x.id!==id);
  saveBuyers();
  ['2','3'].forEach(m=>{
    localStorage.removeItem(dataKey(m,id));
    localStorage.removeItem(entryKey(m,id));
  });
  if(currentBuyer===id){
    currentBuyer=BUYERS[0].id;
    saveCurrentBuyer();
    loadData(); applyLabels(); build(); renderLog(); goPanel(0); updateAllViewUI();
  }
  renderBuyerBar();
}

function buyerLabel(){
  if(currentBuyer==='ALL') return '📊 รวมทุกผู้ซื้อ';
  const b=BUYERS.find(x=>x.id===currentBuyer);
  return b ? '👤 '+b.name : '';
}

function switchBuyer(id){
  if(id===currentBuyer)return;
  currentBuyer=id;
  saveCurrentBuyer();
  closeSpecial();
  closeMod();
  loadData();
  applyLabels();
  build();
  renderLog();
  goPanel(0);
  renderBuyerBar();
  updateAllViewUI();
  if(currentBuyer!=='ALL') setTimeout(()=>$('fn').focus(),50);
}

// ===== Panel Navigation =====
const isMob = () => window.innerWidth < 600;
let cur = 0;

function goPanel(idx) {
  idx = Math.max(0,Math.min(3,idx));
  cur = idx;
  if(!isMob()) return;
  $('pi').style.transform = `translateX(-${idx * 25}%)`;
  [0,1,2,3].forEach(i=>$('d'+i).classList.toggle('on', i===idx));
}

let tx0 = 0;
$('pa').addEventListener('touchstart', e=>{ tx0=e.touches[0].clientX; },{passive:true});
$('pa').addEventListener('touchend', e=>{
  const dx = e.changedTouches[0].clientX - tx0;
  if(Math.abs(dx)>40) goPanel(cur+(dx<0?1:-1));
},{passive:true});

// ===== Rendering =====
const panelOf = n => Math.floor(parseInt(n)/cfg().perPanel);
const fmt = v => !v?'-':v>=1000?(v/1000).toFixed(v%1000?1:0)+'k':v;

function rHTML(n,d){
  const s=(d.top||0)+(d.bot||0);
  return `<span class="c n">${n}</span><span class="c ${d.top>0?'tv':'em'}">${fmt(d.top)}</span><span class="c ${d.bot>0?'bv':'em'}">${fmt(d.bot)}</span><span class="c ${s>0?'sv':'em'}">${fmt(s)}</span>`;
}

function rangeLabel(p){
  const c=cfg();
  const start=p*c.perPanel, end=start+c.perPanel-1;
  return String(start).padStart(c.digits,'0')+'-'+String(end).padStart(c.digits,'0');
}

function build(){
  const c=cfg();
  for(let p=0;p<4;p++){
    $('thn'+p).textContent = rangeLabel(p);
    const cont=$('r'+p); cont.innerHTML='';
    const start=p*c.perPanel, end=start+c.perPanel-1;
    for(let i=start;i<=end;i++){
      const n=String(i).padStart(c.digits,'0');
      const d=D[n]||{top:0,bot:0};
      const div=document.createElement('div');
      div.className='row'+((d.top||0)+(d.bot||0)>0?' has':'');
      div.id='row'+n; div.innerHTML=rHTML(n,d);
      cont.appendChild(div);
    }
  }
  calcSum();
}

function updRow(n){
  const d=D[n]||{top:0,bot:0};
  const s=(d.top||0)+(d.bot||0);
  const row=$('row'+n); if(!row)return;
  row.className='row'+(s>0?' has':'');
  row.innerHTML=rHTML(n,d);
  row.classList.add('fl'); setTimeout(()=>row.classList.remove('fl'),500);
  scrollTo2(n);
}

function scrollTo2(n){
  const p=panelOf(n);
  if(isMob() && cur!==p){
    goPanel(p);
    setTimeout(()=>highlightRow(n), 320);
  } else {
    highlightRow(n);
  }
}

function highlightRow(n){
  document.querySelectorAll('.row.hi').forEach(r=>r.classList.remove('hi'));
  const row=$('row'+n); if(!row)return;
  row.classList.add('hi');
  const container=row.closest('.rows');
  if(!container) return;
  const siblings=Array.from(container.children);
  const idx=siblings.indexOf(row);
  if(idx<0) return;
  const rowH=container.scrollHeight/siblings.length;
  const target=(idx*rowH)-(container.clientHeight/2)+(rowH/2);
  container.scrollTop=Math.max(0,target);
}

function calcSum(){
  let tt=0,tb=0,cnt=0;
  for(const n in D){const d=D[n];tt+=d.top||0;tb+=d.bot||0;if((d.top||0)+(d.bot||0)>0)cnt++;}
  $('st').textContent=tt.toLocaleString();
  $('sb').textContent=tb.toLocaleString();
  $('ss').textContent=(tt+tb).toLocaleString();
  $('sc').textContent=cnt;
}

// ===== Input =====
function delActiveField(){
  const el=$(activeInpId);
  if(el){ el.value=''; el.focus(); }
}

function doAdd(){
  if(currentBuyer==='ALL'){alert('หน้ารวมดูข้อมูลได้เท่านั้น กรุณาเลือกผู้ซื้อก่อนป้อนเลข');return;}
  const c=cfg();
  const raw=$('fn').value.trim();
  const n=raw.padStart(c.digits,'0');
  const ftRaw=$('ft').value.trim();
  const fbRaw=$('fb').value.trim();
  const taSub=parseFloat(ftRaw)||0;
  const baSub=parseFloat(fbRaw)||0;
  const maxVal=Math.pow(10,c.digits)-1;
  if(!raw){alert('กรุณากรอกหมายเลข');return;}
  if(!new RegExp('^\\d{1,'+c.digits+'}$').test(raw)||parseInt(raw)>maxVal){alert('หมายเลขต้องเป็น '+'0'.repeat(c.digits)+'-'+maxVal);return;}
  if(!taSub&&!baSub){alert('กรุณากรอกยอด'+c.top+'หรือ'+c.bot+'อย่างน้อย 1 ช่อง');return;}
  if(!D[n])D[n]={top:0,bot:0};
  if(taSub!==0){
    if(taSub<0){
      const deduct=Math.min(Math.abs(taSub), D[n].top||0);
      if(deduct>0){D[n].top=Math.max(0,(D[n].top||0)-deduct);E.push({n,t:'top',a:-deduct});}
    } else {
      D[n].top=(D[n].top||0)+taSub;
      E.push({n,t:'top',a:taSub});
    }
  }
  if(baSub!==0){
    if(baSub<0){
      const deduct=Math.min(Math.abs(baSub), D[n].bot||0);
      if(deduct>0){D[n].bot=Math.max(0,(D[n].bot||0)-deduct);E.push({n,t:'bot',a:-deduct});}
    } else {
      D[n].bot=(D[n].bot||0)+baSub;
      E.push({n,t:'bot',a:baSub});
    }
  }
  updRow(n); sv(); calcSum(); renderLog();
  $('fn').value='';$('ft').value='';$('fb').value='';
  document.querySelectorAll('.row.hi').forEach(r=>r.classList.remove('hi'));
  $('fn').focus();
}

function renderLog(){
  const c=cfg();
  const el=$('log');
  if(!E.length){el.innerHTML='<span class="log-e">รายการล่าสุด...</span>';return;}
  el.innerHTML=[...E].reverse().slice(0,30).map((e,i)=>{
    const neg=e.a<0;
    const cls=neg?'chip neg':`chip ${e.t==='bot'?'b':''}`;
    const sign=neg?'-':'';
    return `<div class="${cls}">${e.n} ${e.t==='top'?c.top:c.bot} ${sign}฿${Math.abs(e.a)}<span class="xdel" onclick="delE(${E.length-1-i})">✕</span></div>`;
  }).join('');
}

function delE(idx){
  const e=E[idx];if(!e||!D[e.n])return;
  const k=e.t==='top'?'top':'bot';
  D[e.n][k]=Math.max(0,(D[e.n][k]||0)-e.a);
  E.splice(idx,1);sv();updRow(e.n);calcSum();renderLog();
}

function clearAll(){
  if(currentBuyer==='ALL'){alert('ไม่สามารถล้างข้อมูลในหน้ารวมได้');return;}
  if(!confirm('ล้างข้อมูลทั้งหมด?'))return;
  D={};E=[];sv();build();renderLog();
}

// ===== Viewport Resize =====
(function(){
  function applyHeight(){
    const vv = window.visualViewport;
    const h = vv ? vv.height : window.innerHeight;
    const w = vv ? vv.width : window.innerWidth;
    let safeH = h;
    if(w >= 600){
      const winBottom = window.screenY + window.outerHeight;
      const availBottom = window.screen.availTop + window.screen.availHeight;
      const overlap = winBottom - availBottom;
      if(overlap > 0) safeH = h - overlap;
    }
    document.documentElement.style.height = safeH + 'px';
    document.body.style.height = safeH + 'px';
    document.documentElement.style.width = w + 'px';
    if(vv) window.scrollTo(0,0);
  }
  applyHeight();
  window.addEventListener('resize', applyHeight);
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', applyHeight);
    window.visualViewport.addEventListener('scroll', applyHeight);
  }
})();

// ===== Keyboard Handling =====
let activeInpId='fn';
['fn','ft','fb'].forEach(id=>{
  const el=$(id);
  if(el) el.addEventListener('focus',()=>{ activeInpId=id; });
});

$('fn').onkeydown=e=>{if(e.key==='Enter')$('ft').focus();};
$('ft').onkeydown=e=>{if(e.key==='Enter')$('fb').focus();};
$('fb').onkeydown=e=>{if(e.key==='Enter')doAdd();};
$('res3').onkeydown=e=>{if(e.key==='Enter')$('res2b').focus();};
$('res2b').onkeydown=e=>{if(e.key==='Enter')doCheck();};
$('fn').oninput=e=>{
  const c=cfg();
  const raw=e.target.value.trim();
  if(raw.length>=1&&new RegExp('^\\d{1,'+c.digits+'}$').test(raw)&&parseInt(raw)<=Math.pow(10,c.digits)-1) scrollTo2(raw.padStart(c.digits,'0'));
  if(raw.length===c.digits)$('ft').focus();
};

document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    if($('sp-ov').classList.contains('on')){closeSpecial();return;}
    if($('slip-ov').classList.contains('on')){closeSlip();return;}
    if($('ov').classList.contains('on')){closeMod();return;}
    return;
  }
  if(e.key!=='Delete')return;
  const active=document.activeElement;
  if(!active)return;
  const mainIds=['fn','ft','fb'];
  const checkIds=['res3','res2b','rrt3','rrb3','rrt2','rrb2'];
  if(mainIds.includes(active.id)){
    e.preventDefault();active.value='';
  } else if(checkIds.includes(active.id)&&$('ov').classList.contains('on')){
    e.preventDefault();active.value='';
    if(active.id==='res3'){$('derived').innerHTML='';}
  }
},true);

// ===== Modal Back-Button Handling =====
// เมื่อเปิด popup ใดๆ (ตรวจผล/กลุ่มเลข/สลิป) ให้ผลัก history state เพิ่ม 1 ระดับ
// เวลากดปุ่ม Back บนมือถือ จะ trigger 'popstate' ให้ปิด popup แทนที่จะออกจากแอป
let currentModal = null;
let closingViaBack = false;

function openModal(name){
  currentModal = name;
  history.pushState({modal:name}, '');
}

function closeModal(){
  if(!currentModal) return;
  currentModal = null;
  if(!closingViaBack && history.state && history.state.modal){
    history.back();
  }
}

window.addEventListener('popstate', function(){
  if(currentModal){
    closingViaBack = true;
    if(currentModal==='special') closeSpecial();
    else if(currentModal==='check') closeMod();
    else if(currentModal==='slip') closeSlip();
    closingViaBack = false;
  }
});

// ===== Check Modal =====
function showMod(){$('ov').classList.add('on');setTimeout(()=>$('res3').focus(),50);openModal('check');}
function closeMod(){$('ov').classList.remove('on');$('ro').innerHTML='';$('derived').innerHTML='';closeModal();}
function bgClose(e){if(e.target===$('ov'))closeMod();}
function clearCheck(){
  ['res3','res2b'].forEach(id=>{$(id).value='';});
  $('derived').innerHTML='';$('ro').innerHTML='';
  $('res3').focus();
}

function isPerm(a,b){ return a.length===b.length && [...a].sort().join('')===[...b].sort().join(''); }

function permsOf(s){
  const out=new Set();
  (function go(arr,acc){
    if(!arr.length){out.add(acc);return;}
    for(let i=0;i<arr.length;i++) go(arr.slice(0,i).concat(arr.slice(i+1)), acc+arr[i]);
  })([...s],'');
  return [...out];
}

function updDerived(){
  const v=$('res3').value.trim();
  if(v.length<3){$('derived').innerHTML='';return;}
  const r3=v.padStart(3,'0');
  const top2=r3.slice(-2);
  const tod=permsOf(r3).sort().join(' , ');
  $('derived').innerHTML=`บน 2 ตัว = <b style="color:#0d7a5f">${top2}</b> &nbsp;·&nbsp; โต๊ด = <b style="color:#7c5cbf">${tod}</b>`;
}

function doCheck(){
  const r3v=$('res3').value.trim(), r2bv=$('res2b').value.trim();
  if(!r3v&&!r2bv){alert('กรุณากรอกผลรางวัล');return;}
  const r3=r3v?r3v.padStart(3,'0'):'';
  const r2b=r2bv?r2bv.padStart(2,'0'):'';
  const r2t=r3?r3.slice(-2):'';
  const rrt3=parseFloat($('rrt3').value)||LBL['3'].rrt;
  const rrb3=parseFloat($('rrb3').value)||LBL['3'].rrb;
  const rrt2=parseFloat($('rrt2').value)||LBL['2'].rrt;
  const rrb2=parseFloat($('rrb2').value)||LBL['2'].rrb;

  const D3=getData('3'), D2=getData('2');
  let pay=0,rec=0,html='';
  for(const n in D3){const d=D3[n];rec+=(d.top||0)+(d.bot||0);}
  for(const n in D2){const d=D2[n];rec+=(d.top||0)+(d.bot||0);}

  if(r3&&D3[r3]&&D3[r3].top>0){
    const p=D3[r3].top*rrt3;pay+=p;
    html+=`<div class="wr t"><div><div class="wn">${r3}</div><div class="wm">3 ตัวเต็ง · แทง ฿${D3[r3].top.toLocaleString()}</div></div><div class="wp">+฿${p.toLocaleString()}</div></div>`;
  }
  if(r3){
    const hits=Object.keys(D3).filter(n=>(D3[n].bot||0)>0&&isPerm(n,r3)).sort();
    hits.forEach(n=>{
      const p=D3[n].bot*rrb3;pay+=p;
      html+=`<div class="wr b"><div><div class="wn">${n}</div><div class="wm">3 ตัวโต๊ด · แทง ฿${D3[n].bot.toLocaleString()}</div></div><div class="wp">+฿${p.toLocaleString()}</div></div>`;
    });
  }
  if(r2t&&D2[r2t]&&D2[r2t].top>0){
    const p=D2[r2t].top*rrt2;pay+=p;
    html+=`<div class="wr t"><div><div class="wn">${r2t}</div><div class="wm">2 ตัวบน · แทง ฿${D2[r2t].top.toLocaleString()}</div></div><div class="wp">+฿${p.toLocaleString()}</div></div>`;
  }
  if(r2b&&D2[r2b]&&D2[r2b].bot>0){
    const p=D2[r2b].bot*rrb2;pay+=p;
    html+=`<div class="wr b"><div><div class="wn">${r2b}</div><div class="wm">2 ตัวล่าง · แทง ฿${D2[r2b].bot.toLocaleString()}</div></div><div class="wp">+฿${p.toLocaleString()}</div></div>`;
  }

  const profit=rec-pay;
  $('ro').innerHTML=`<div class="sr">
    <div class="st" style="background:#f8f8f6"><div class="sl">รับรวม</div><div class="sv2">฿${rec.toLocaleString()}</div></div>
    <div class="st" style="background:#fff0f0"><div class="sl">จ่าย</div><div class="sv2" style="color:#c0392b">฿${pay.toLocaleString()}</div></div>
    <div class="st" style="background:${profit>=0?'#e8f5f1':'#fff0f0'}"><div class="sl">กำไร</div><div class="sv2" style="color:${profit>=0?'#0d7a5f':'#c0392b'}">฿${profit.toLocaleString()}</div></div>
  </div>${html||'<div class="nw">ไม่มีเลขถูกรางวัล</div>'}`;
}

function getData(m){
  sv();
  if(currentBuyer==='ALL') return combineAll(m);
  return JSON.parse(localStorage.getItem(dataKey(m,currentBuyer))||'{}');
}

// ===== Slip / Print =====
function doPrint(){
  let body='', grandTop=0, grandBot=0, totalCount=0;
  const grandByMode={};
  ['3','2'].forEach(m=>{
    const c=LBL[m];
    const data=getData(m);
    const keys=Object.keys(data).filter(n=>(data[n].top||0)+(data[n].bot||0)>0).sort();
    if(!keys.length) return;
    let tt=0,tb=0;
    const rows=keys.map(n=>{
      const d=data[n],t=d.top||0,b=d.bot||0; tt+=t; tb+=b;
      return `<tr><td class="tc-n">${n}</td><td class="tc-sep">=</td><td class="tc-t">${t>0?t.toLocaleString():'-'}</td><td class="tc-sep">x</td><td class="tc-b">${b>0?b.toLocaleString():'-'}</td></tr>`;
    }).join('');
    grandByMode[m]=tt+tb;
    grandTop+=tt; grandBot+=tb; totalCount+=keys.length;
    body+=`<div class="slip-sec">
      <div class="slip-sec-title">เลข ${c.digits} ตัว</div>
      <table class="slip-tbl">
        <thead><tr><th class="tc-n">เลข</th><th class="tc-sep">=</th><th class="tc-t">${c.top}</th><th class="tc-sep">x</th><th class="tc-b">${c.bot}</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr class="sub-row"><td class="tc-n">รวม</td><td class="tc-sep"></td><td class="tc-t">${tt>0?tt.toLocaleString():'-'}</td><td class="tc-sep">x</td><td class="tc-b">${tb>0?tb.toLocaleString():'-'}</td></tr></tfoot>
      </table>
    </div>`;
  });
  if(!totalCount){alert('ยังไม่มีข้อมูล');return;}
  const grand3=grandByMode['3']||0, grand2=grandByMode['2']||0, grand=grand3+grand2;
  const g3str=grand3>0?grand3.toLocaleString():'-';
  const g2str=grand2>0?grand2.toLocaleString():'-';
  $('slip-title').innerHTML='<img src="https://flagcdn.com/w20/la.png" style="height:16px;vertical-align:middle;margin-right:4px"> Slip ລາວ';
  $('slip-buyer').textContent=buyerLabel();
  $('slip-date').textContent='วันที่ '+new Date().toLocaleDateString('th-TH',{day:'2-digit',month:'2-digit',year:'numeric'});
  $('slip-body').innerHTML=body;
  $('slip-total').innerHTML=`<table>
    <tr>
      <td class="tc-n">รวม</td>
      <td class="tc-sep"></td>
      <td class="tc-t"><span class="tc-lbl">3ตัว</span>${g3str}</td>
      <td class="tc-sep">+</td>
      <td class="tc-b"><span class="tc-lbl">2ตัว</span>${g2str}</td>
      <td class="tc-sep">=</td>
      <td class="tc-sum">${grand.toLocaleString()} บ.</td>
    </tr></table>`;
  $('slip-ov').classList.add('on');
  openModal('slip');
}
function closeSlip(){$('slip-ov').classList.remove('on');closeModal();}

function doPrintThai(){
  const THAI_MULT_2 = 12;
  let body='', grandTop=0, grandBot=0, totalCount=0;
  const grandByMode={};
  ['3','2'].forEach(m=>{
    const c=LBL[m];
    const data=getData(m);
    const keys=Object.keys(data).filter(n=>(data[n].top||0)+(data[n].bot||0)>0).sort();
    if(!keys.length) return;
    let tt=0,tb=0;
    const rows=keys.map(n=>{
      const d=data[n];
      const t=d.top||0, b=d.bot||0;
      tt+=t; tb+=b;
      return `<tr><td class="tc-n">${n}</td><td class="tc-sep">=</td><td class="tc-t">${t>0?t.toLocaleString():'-'}</td><td class="tc-sep">x</td><td class="tc-b">${b>0?b.toLocaleString():'-'}</td></tr>`;
    }).join('');
    const dispTT = m==='2' ? tt*THAI_MULT_2 : tt;
    const dispTB = m==='2' ? tb*THAI_MULT_2 : tb;
    grandByMode[m]=dispTT+dispTB;
    grandTop+=dispTT; grandBot+=dispTB; totalCount+=keys.length;
    body+=`<div class="slip-sec">
      <div class="slip-sec-title">เลข ${c.digits} ตัว</div>
      <table class="slip-tbl">
        <thead><tr><th class="tc-n">เลข</th><th class="tc-sep">=</th><th class="tc-t">${c.top}</th><th class="tc-sep">x</th><th class="tc-b">${c.bot}</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr class="sub-row"><td class="tc-n">รวม</td><td class="tc-sep"></td><td class="tc-t">${dispTT>0?dispTT.toLocaleString():'-'}</td><td class="tc-sep">x</td><td class="tc-b">${dispTB>0?dispTB.toLocaleString():'-'}</td></tr></tfoot>
      </table>
    </div>`;
  });
  if(!totalCount){alert('ยังไม่มีข้อมูล');return;}
  const grand3=grandByMode['3']||0, grand2=grandByMode['2']||0, grand=grand3+grand2;
  const g3str=grand3>0?grand3.toLocaleString():'-';
  const g2str=grand2>0?grand2.toLocaleString():'-';
  $('slip-title').innerHTML='<img src="https://flagcdn.com/w20/th.png" style="height:16px;vertical-align:middle;margin-right:4px"> Slip ไทย';
  $('slip-buyer').textContent=buyerLabel();
  $('slip-date').textContent='วันที่ '+new Date().toLocaleDateString('th-TH',{day:'2-digit',month:'2-digit',year:'numeric'});
  $('slip-body').innerHTML=body;
  $('slip-total').innerHTML=`<table>
    <tr>
      <td class="tc-n">รวม</td>
      <td class="tc-sep"></td>
      <td class="tc-t"><span class="tc-lbl">3ตัว</span>${g3str}</td>
      <td class="tc-sep">+</td>
      <td class="tc-b"><span class="tc-lbl">2ตัว</span>${g2str}</td>
      <td class="tc-sep">=</td>
      <td class="tc-sum">${grand.toLocaleString()} บ.</td>
    </tr></table>`;
  $('slip-ov').classList.add('on');
  openModal('slip');
}

// ===== Mode Switch =====
function applyLabels(){
  const c=cfg();
  $('appTitle').textContent='🎫 '+c.title;
  document.title=c.title;
  $('lblTop').textContent='ยอด'+c.top;
  $('lblBot').textContent='ยอด'+c.bot;
  document.querySelectorAll('.th-top').forEach(e=>e.textContent=c.top);
  document.querySelectorAll('.th-bot').forEach(e=>e.textContent=c.bot);
  $('lblInpTop').textContent=c.top+' (฿)';
  $('lblInpBot').textContent=c.bot+' (฿)';
  $('fn').setAttribute('maxlength',c.digits);
  $('fn').placeholder='0'.repeat(c.digits);
}

function switchMode(m){
  if(m===MODE)return;
  MODE=m;
  localStorage.setItem('h_mode',MODE);
  $('tab2').classList.toggle('on',m==='2');
  $('tab3').classList.toggle('on',m==='3');
  loadData();
  applyLabels();
  build();
  renderLog();
  goPanel(0);
  closeMod();
  updateAllViewUI();
  if(currentBuyer!=='ALL') setTimeout(()=>$('fn').focus(),50);
}

// ===== Init =====
loadData();
applyLabels();
build(); renderLog();
$('tab2').classList.toggle('on',MODE==='2');
$('tab3').classList.toggle('on',MODE==='3');
renderBuyerBar();
updateAllViewUI();
if(currentBuyer!=='ALL') setTimeout(()=>$('fn').focus(),50);

// ===== Auto Update Detection =====
// เช็ค header Last-Modified ของ index.html เป็นระยะ ถ้าเปลี่ยน = มีการอัปเดตไฟล์ใหม่บน GitHub
// ไม่ต้อง bump เลข version เอง เพราะดึงค่าจาก server โดยตรงทุกครั้ง
let pageTag = null;

async function getPageTag(){
  try{
    const res = await fetch('./index.html', {cache:'no-store'});
    return res.headers.get('last-modified') || res.headers.get('etag') || null;
  }catch(e){ return null; }
}

async function initVersionCheck(){
  pageTag = await getPageTag();
  setInterval(checkForUpdate, 5*60*1000); // เช็คทุก 5 นาที
  document.addEventListener('visibilitychange', ()=>{
    if(document.visibilityState==='visible') checkForUpdate();
  });
}

async function checkForUpdate(){
  const tag = await getPageTag();
  if(tag && pageTag && tag!==pageTag) showUpdateBanner();
}

function showUpdateBanner(){
  if($('update-banner')) return;
  const div=document.createElement('div');
  div.id='update-banner';
  div.innerHTML=`<span>🔄 มีเวอร์ชันใหม่ของแอป</span><button onclick="location.reload()">อัปเดตเลย</button>`;
  document.body.appendChild(div);
}

initVersionCheck();

// ===== Register Service Worker =====
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  });
}
