// ===== Firebase Init =====
const firebaseConfig = {
  apiKey: "AIzaSyCfVOMfnoFwNwedwpTSdAOSUWo5DuRH9bM",
  authDomain: "lotto-f64dc.firebaseapp.com",
  databaseURL: "https://lotto-f64dc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lotto-f64dc",
  storageBucket: "lotto-f64dc.firebasestorage.app",
  messagingSenderId: "238579052649",
  appId: "1:238579052649:web:73e4f2de07dc869a08b2f8"
};
firebase.initializeApp(firebaseConfig);
const fbAuth = firebase.auth();
const db = firebase.database();

// รหัสผ่านร้าน — เปลี่ยนได้ตรงนี้
const SHOP_PASSWORD = '0418';

function gateShow(){
  const el = document.getElementById('gate-ov');
  if(el) el.style.display = 'flex';
  const pw = document.getElementById('gate-pw');
  if(pw){ pw.disabled = false; setTimeout(()=>pw.focus(), 50); }
}
function gateHide(){
  const el = document.getElementById('gate-ov');
  if(el) el.style.display = 'none';
}

function gateSubmit(){
  const pwEl = document.getElementById('gate-pw');
  const errEl = document.getElementById('gate-err');
  const val = pwEl.value.trim();
  if(val !== SHOP_PASSWORD){
    errEl.textContent = 'รหัสผ่านไม่ถูกต้อง';
    pwEl.value = '';
    pwEl.focus();
    return;
  }
  errEl.textContent = '';
  pwEl.disabled = true;
  fbAuth.signInAnonymously().catch(e=>{
    errEl.textContent = 'เชื่อมต่อไม่สำเร็จ: ' + e.message;
    pwEl.disabled = false;
  });
}

fbAuth.onAuthStateChanged(user=>{
  if(user){
    gateHide();
    if(window.startApp) window.startApp();
  } else {
    gateShow();
  }
});
