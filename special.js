// ===== Special Groups =====
const DEFAULT_GROUPS = [
  {id:'g_double', name:'เลขเบิ้ล', nums:['00','11','22','33','44','55','66','77','88','99']},
  {id:'g_near1',  name:'เลขติด 1', nums:['01','10','12','21','23','32','34','43','45','54','56','65','67','76','78','87','89','98']},
  {id:'g_near2',  name:'เลขติด 2', nums:['02','20','13','31','24','42','35','53','46','64','57','75','68','86','79','97']},
  {id:'g_high',   name:'เลขสูง (50-99)', nums:Array.from({length:50},(_,i)=>String(50+i).padStart(2,'0'))},
  {id:'g_low',    name:'เลขต่ำ (00-49)', nums:Array.from({length:50},(_,i)=>String(i).padStart(2,'0'))},
  {id:'g_even',   name:'เลขท้ายคู่', nums:Array.from({length:100},(_,i)=>String(i).padStart(2,'0')).filter(n=>parseInt(n[1])%2===0)},
  {id:'g_odd',    name:'เลขท้ายคี่', nums:Array.from({length:100},(_,i)=>String(i).padStart(2,'0')).filter(n=>parseInt(n[1])%2===1)},
];

let SPECIAL_GROUPS_CACHE = null;

db.ref('specialGroups').on('value', snap=>{
  const val = snap.val();
  SPECIAL_GROUPS_CACHE = val ? Object.keys(val).map(k=>({id:k, name:val[k].name, nums:val[k].nums||[]})) : [];
  if($('sp-ov') && $('sp-ov').classList.contains('on')) renderSpecialList();
});

function getSpecialGroups(){
  return SPECIAL_GROUPS_CACHE || [];
}

function showSpecial(){
  if(currentBuyer==='ALL'){alert('กลุ่มเลขพิเศษใช้ไม่ได้ในหน้ารวม กรุณาเลือกผู้ซื้อก่อน');return;}
  if(MODE!=='2'){alert('กลุ่มเลขพิเศษใช้ได้เฉพาะหวย 2 ตัว');return;}
  renderSpecialList();
  $('sp-ov').classList.add('on');
  $('sp-panel').classList.add('on');
  pushModalState();
  spFocusField(null);
}

let spActiveField=null;
function spFocusField(id){
  spActiveField=id;
  document.querySelectorAll('.sp-inp-focusable').forEach(el=>{
    el.classList.toggle('sp-inp-active', el.id===id);
  });
}
function spKey(v){
  if(!spActiveField) return;
  const el=$(spActiveField);
  if(!el) return;
  if(v==='DEL'){ el.value=''; }
  else { if(el.dataset.maxlen && el.value.length>=parseInt(el.dataset.maxlen)) return; el.value+=v; }
  if(spActiveField==='sp-perm-num' && el.value.length===3) genPerm();
}
function closeSpecial(){
  $('sp-ov').classList.remove('on');
  $('sp-panel').classList.remove('on');
  popModalStateIfNeeded();
}

function renderSpecialList(){
  const groups = getSpecialGroups();
  const list = $('sp-list');
  list.innerHTML = groups.map((g,gi)=>`
    <div class="sp-group">
      <div class="sp-group-head" onclick="toggleGroup(${gi})">
        <span class="sp-group-name">${g.name}</span>
        <span>
          <span class="sp-group-count">${g.nums.length} เลข</span>
          <button class="sp-group-del" onclick="event.stopPropagation();deleteGroup(${gi})">🗑</button>
        </span>
      </div>
      <div class="sp-nums-wrap" id="sg-nums-${gi}" style="display:none">
        ${g.nums.map(n=>`<span class="sp-num-chip" onclick="chipClick('${n}',${gi})">${n}</span>`).join('')}
        <div class="sp-price-row" style="width:100%;margin-top:4px">
          <span class="sp-price-lbl">บน</span><input class="sp-price-inp" id="sg-top-${gi}" type="text" inputmode="decimal" placeholder="0">
          <span class="sp-price-lbl">ล่าง</span><input class="sp-price-inp" id="sg-bot-${gi}" type="text" inputmode="decimal" placeholder="0">
          <button class="sp-apply-btn" onclick="applyGroup(${gi})">ใส่ทั้งกลุ่ม</button>
        </div>
      </div>
    </div>`).join('');
}

function toggleGroup(gi){
  const el=$('sg-nums-'+gi);
  el.style.display=el.style.display==='none'?'flex':'none';
  el.style.flexWrap='wrap';
}

function chipClick(n, gi){
  $('fn').value=n;
  const top=$('sg-top-'+gi).value||'';
  const bot=$('sg-bot-'+gi).value||'';
  if(top) $('ft').value=top;
  if(bot) $('fb').value=bot;
  closeSpecial();
  setTimeout(()=>{ if(!top) $('ft').focus(); else if(!bot) $('fb').focus(); else doAdd(); },100);
}

function addAmountBulk(n, top, bot){
  const c=cfg();
  const key=n.padStart(c.digits,'0');
  const dataRef = db.ref(`data/${MODE}/${currentBuyer}/${key}`);
  const entriesRef = db.ref(`entries/${MODE}/${currentBuyer}`);
  dataRef.transaction(cur=>{
    cur = cur || {top:0,bot:0};
    cur.top = Math.max(0,(cur.top||0)+top);
    cur.bot = Math.max(0,(cur.bot||0)+bot);
    return cur;
  }).then(result=>{
    if(!result.committed) return;
    if(top) entriesRef.push({n:key, t:'top', a:top, ts: firebase.database.ServerValue.TIMESTAMP});
    if(bot) entriesRef.push({n:key, t:'bot', a:bot, ts: firebase.database.ServerValue.TIMESTAMP});
  });
}

function applyGroup(gi){
  const groups=getSpecialGroups();
  const g=groups[gi];
  const top=parseFloat($('sg-top-'+gi).value)||0;
  const bot=parseFloat($('sg-bot-'+gi).value)||0;
  if(!top&&!bot){alert('กรุณากรอกราคาบน หรือ ล่าง');return;}
  let count=0;
  g.nums.forEach(n=>{
    addAmountBulk(n, top, bot);
    count++;
  });
  closeSpecial();
  alert(`ใส่ ${count} เลข เสร็จแล้ว`);
}

function deleteGroup(gi){
  if(!confirm('ลบกลุ่มนี้?')) return;
  const groups=getSpecialGroups();
  const g=groups[gi];
  db.ref('specialGroups/'+g.id).remove().then(renderSpecialList);
}

let permNums=[];

function genPerm(){
  const val=$('sp-perm-num').value.trim();
  if(!/^\d{3}$/.test(val)){alert('กรุณาป้อนเลข 3 หลัก');return;}
  const a=val[0],b=val[1],c=val[2];
  const pairs=[a+b,b+a,a+c,c+a,b+c,c+b];
  permNums=[...new Set(pairs)];
  const chips=$('sp-perm-chips');
  chips.innerHTML=permNums.map(n=>`<span class="sp-num-chip" onclick="permChipClick('${n}')">${n}</span>`).join('');
  $('sp-perm-price').style.display='flex';
}

function permChipClick(n){
  $('fn').value=n;
  const top=$('sp-perm-top').value||'';
  const bot=$('sp-perm-bot').value||'';
  if(top) $('ft').value=top;
  if(bot) $('fb').value=bot;
  closeSpecial();
  setTimeout(()=>{ if(!top) $('ft').focus(); else if(!bot) $('fb').focus(); else doAdd(); },100);
}

function applyPerm(){
  if(!permNums.length){alert('กรุณาสร้างเลขก่อน');return;}
  const top=parseFloat($('sp-perm-top').value)||0;
  const bot=parseFloat($('sp-perm-bot').value)||0;
  if(!top&&!bot){alert('กรุณากรอกราคาบน หรือ ล่าง');return;}
  permNums.forEach(n=>{
    addAmountBulk(n, top, bot);
  });
  closeSpecial();
  alert(`ใส่ ${permNums.length} เลข เสร็จแล้ว`);
}

function resetSpecialGroups(){
  if(!confirm('คืนค่ากลุ่มเริ่มต้น? กลุ่มที่สร้างเองจะถูกลบทั้งหมด')) return;
  const obj={};
  DEFAULT_GROUPS.forEach(g=>{ obj[g.id]={name:g.name, nums:g.nums}; });
  db.ref('specialGroups').set(obj).then(renderSpecialList);
}

function saveSpecialGroup(){
  const name=$('sp-name').value.trim();
  const raw=$('sp-nums').value.trim();
  if(!name){alert('กรุณาใส่ชื่อกลุ่ม');return;}
  if(!raw){alert('กรุณาใส่เลข');return;}
  const nums=[...new Set(raw.split(/[,\n\s]+/).map(s=>s.trim().padStart(2,'0')).filter(s=>/^\d{2}$/.test(s)))];
  if(!nums.length){alert('ไม่พบเลขที่ถูกต้อง');return;}
  const ref=db.ref('specialGroups').push();
  ref.set({name, nums}).then(()=>{
    $('sp-name').value=''; $('sp-nums').value='';
    renderSpecialList();
    alert(`บันทึกกลุ่ม "${name}" (${nums.length} เลข) แล้ว`);
  });
}

// ===== Inject Special Popup DOM =====
(function(){
  const ov = document.createElement('div');
  ov.className = 'sp-ov'; ov.id = 'sp-ov';
  ov.onclick = closeSpecial;
  document.body.appendChild(ov);

  const panel = document.createElement('div');
  panel.className = 'sp-panel'; panel.id = 'sp-panel';
  panel.innerHTML = `
  <div class="sp-head">
    <span>✨ กลุ่มเลขพิเศษ</span>
    <button class="sp-close" onclick="closeSpecial()">✕</button>
  </div>
  <div class="sp-scroll" id="sp-scroll">
  <div class="sp-list" id="sp-list"></div>
  <div class="sp-perm-section">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div class="sp-add-title" style="margin:0">🔀 สลับเลข 3 ตัว → 6 เลข 2 หลัก</div>
    </div>
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
      <input class="sp-inp" id="sp-perm-num" placeholder="ป้อนเลข 3 ตัว เช่น 123" maxlength="3" inputmode="numeric" style="margin:0;flex:1"
        onkeydown="if(event.key==='Delete'){this.value='';$('sp-perm-chips').innerHTML='';$('sp-perm-price').style.display='none';event.preventDefault()}">
      <button class="sp-k-del" onclick="$('sp-perm-num').value='';$('sp-perm-chips').innerHTML='';$('sp-perm-price').style.display='none'">DEL</button>
      <button onclick="genPerm()" style="background:#0d7a5f;color:#fff;border:none;border-radius:8px;padding:8px 12px;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap">สร้าง</button>
    </div>
    <div class="sp-nums-wrap" id="sp-perm-chips" style="min-height:36px;background:#f9f9f9;border-radius:8px;border:1px dashed #ccc;padding:8px"></div>
    <div class="sp-price-row" id="sp-perm-price" style="display:none;margin-top:6px;padding:0">
      <span class="sp-price-lbl">บน</span>
      <input class="sp-price-inp" id="sp-perm-top" type="text" inputmode="decimal" placeholder="0"
        onkeydown="if(event.key==='Delete'){this.value='';event.preventDefault()}else if(event.key==='Enter'||event.key==='Go'){event.preventDefault();$('sp-perm-bot').focus()}" enterkeyhint="next">
      <button class="sp-k-del" onclick="$('sp-perm-top').value=''">DEL</button>
      <span class="sp-price-lbl">ล่าง</span>
      <input class="sp-price-inp" id="sp-perm-bot" type="text" inputmode="decimal" placeholder="0"
        onkeydown="if(event.key==='Delete'){this.value='';event.preventDefault()}else if(event.key==='Enter'||event.key==='Go'){event.preventDefault();applyPerm()}" enterkeyhint="done">
      <button class="sp-k-del" onclick="$('sp-perm-bot').value=''">DEL</button>
      <button class="sp-apply-btn" onclick="applyPerm()">ใส่ทั้งหมด</button>
    </div>
  </div>
  <div class="sp-add-section">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div class="sp-add-title" style="margin:0">➕ เพิ่มกลุ่มใหม่</div>
      <button onclick="resetSpecialGroups()" style="font-size:11px;background:none;border:1px solid #aaa;border-radius:6px;padding:3px 8px;color:#666;cursor:pointer">↺ คืนค่าเริ่มต้น</button>
    </div>
    <input class="sp-inp" id="sp-name" placeholder="ชื่อกลุ่ม เช่น เลขเบิ้ล">
    <textarea class="sp-inp sp-ta" id="sp-nums" placeholder="เลข คั่นด้วย , หรือ Enter เช่น 00,11,22"></textarea>
    <button class="sp-save-btn" onclick="saveSpecialGroup()">บันทึกกลุ่ม</button>
  </div>
  </div>`;
  document.body.appendChild(panel);
})();
