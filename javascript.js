/* ── STORAGE ── */
const KEY = 'wmcd_v3';
function load(){ try{ return JSON.parse(localStorage.getItem(KEY))||[]; }catch{ return []; } }
function save(l){ localStorage.setItem(KEY, JSON.stringify(l)); }
let pp = load();

/* ── HELPERS ── */
function g(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ── TABS ── */
document.querySelectorAll('.tbtn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tbtn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    g('panel-' + btn.dataset.tab).classList.add('active');
    if(btn.dataset.tab === 'participants') render();
  });
});

/* ── RADIO HIGHLIGHT ── */
document.querySelectorAll('.ro').forEach(ro => {
  ro.addEventListener('click', () => {
    document.querySelectorAll('.ro').forEach(r => r.classList.remove('sel'));
    ro.classList.add('sel');
  });
});

/* ── VALIDATION ── */
function setErr(f, msg){
  g('e-'+f).textContent = msg;
  const el = g(f); if(el) el.classList.add('ef');
}
function clrErr(f){
  g('e-'+f).textContent = '';
  const el = g(f); if(el) el.classList.remove('ef');
}
function clrAll(){ ['fullName','email','phone','country','gender','participation','terms'].forEach(clrErr); }
function validEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function validPhone(p){ const d=p.replace(/\D/g,''); return d.length>=7&&d.length<=15; }

/* ── SUBMIT ── */
g('regForm').addEventListener('submit', function(e){
  e.preventDefault();
  clrAll();

  const name    = g('fullName').value.trim();
  const email   = g('email').value.trim();
  const phone   = g('phone').value.trim();
  const country = g('country').value.trim();
  const gender  = (document.querySelector('input[name="gender"]:checked')||{}).value||'';
  const type    = g('participation').value;
  const terms   = g('terms').checked;
  let ok = true;

  if(!name)              { setErr('fullName','⚠ Full name is required.');               ok=false; }
  if(!email)             { setErr('email','⚠ Email address is required.');              ok=false; }
  else if(!validEmail(email)) { setErr('email','⚠ Please enter a valid email address.'); ok=false; }
  if(!phone)             { setErr('phone','⚠ Phone number is required.');               ok=false; }
  else if(!validPhone(phone)){ setErr('phone','⚠ Must be 7–15 digits (spaces/dashes ok).'); ok=false; }
  if(!country)           { setErr('country','⚠ Country / culture is required.');        ok=false; }
  if(!gender)            { setErr('gender','⚠ Please select a gender.');                ok=false; }
  if(!type)              { setErr('participation','⚠ Please select a participation type.'); ok=false; }
  if(!terms)             { setErr('terms','⚠ You must accept the Terms & Conditions.'); ok=false; }

  if(!ok){
    const first = document.querySelector('.ef');
    if(first) first.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }

  /* save */
  const entry = { id:Date.now().toString(), name, email, phone, country, gender, type,
                  requests:g('requests').value.trim(), date:new Date().toLocaleDateString() };
  pp.push(entry);
  save(pp);
  updateBadge();

  /* reset */
  this.reset();
  document.querySelectorAll('.ro').forEach(r => r.classList.remove('sel'));

  /* success banner */
  g('sbMsg').textContent = '🎉 ' + name + ' has been successfully registered as a ' + type + '!';
  const sb = g('sb');
  sb.classList.add('show');
  sb.scrollIntoView({behavior:'smooth',block:'center'});
  setTimeout(() => sb.classList.remove('show'), 6000);
});

/* ── RENDER ── */
function render(){
  const q  = (g('searchInput').value||'').toLowerCase();
  const ft = g('filterType').value;
  const list = pp.filter(p =>
    (!q  || p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q)) &&
    (!ft || p.type === ft)
  );
  const grid  = g('pList');
  const empty = g('emptyState');
  grid.innerHTML = '';
  if(!list.length){ empty.style.display='block'; return; }
  empty.style.display='none';
  list.forEach(p => grid.appendChild(makeCard(p)));
}

function makeCard(p){
  const d  = document.createElement('div');
  d.className = 'pc';
  d.dataset.t = p.type;
  const ini = p.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const ico = {Performer:'🎭',Volunteer:'🤝',Attendee:'🎟️'};
  d.innerHTML =
    '<div class="av">'+esc(ini)+'</div>'+
    '<div class="pn">'+esc(p.name)+'</div>'+
    '<div class="pco">🌍 '+esc(p.country)+'</div>'+
    '<span class="ptag">'+(ico[p.type]||'')+' '+esc(p.type)+'</span>'+
    '<div class="cbtns">'+
      '<button class="cbtn cedit" data-id="'+p.id+'">✏️ Edit</button>'+
      '<button class="cbtn cdel"  data-id="'+p.id+'">🗑️ Delete</button>'+
    '</div>';
  d.querySelector('.cdel').onclick  = () => del(p.id);
  d.querySelector('.cedit').onclick = () => openEdit(p.id);
  return d;
}

/* ── DELETE ── */
function del(id){
  if(!confirm('Remove this participant?')) return;
  pp = pp.filter(p => p.id !== id);
  save(pp); updateBadge(); render();
}

/* ── EDIT ── */
function openEdit(id){
  const p = pp.find(p=>p.id===id); if(!p) return;
  g('editId').value      = p.id;
  g('editName').value    = p.name;
  g('editCountry').value = p.country;
  g('editType').value    = p.type;
  g('e-editName').textContent='';
  g('editName').classList.remove('ef');
  g('editOv').classList.add('open');
}
g('editForm').addEventListener('submit', function(e){
  e.preventDefault();
  const name = g('editName').value.trim();
  if(!name){ g('e-editName').textContent='⚠ Name cannot be empty.'; g('editName').classList.add('ef'); return; }
  const idx = pp.findIndex(p=>p.id===g('editId').value);
  if(idx===-1) return;
  pp[idx]={...pp[idx], name, country:g('editCountry').value.trim(), type:g('editType').value};
  save(pp); g('editOv').classList.remove('open'); render();
});
g('closeEdit').onclick = () => g('editOv').classList.remove('open');
g('editOv').addEventListener('click', e=>{ if(e.target===g('editOv')) g('editOv').classList.remove('open'); });

/* ── SEARCH / FILTER ── */
g('searchInput').addEventListener('input', render);
g('filterType').addEventListener('change', render);

/* ── TERMS MODAL ── */
g('openTerms').addEventListener('click', () => g('termsOv').classList.add('open'));
g('closeTerms').onclick = () => g('termsOv').classList.remove('open');
g('termsOv').addEventListener('click', e=>{ if(e.target===g('termsOv')) g('termsOv').classList.remove('open'); });

/* ── ESC KEY ── */
document.addEventListener('keydown', e=>{
  if(e.key==='Escape'){ g('termsOv').classList.remove('open'); g('editOv').classList.remove('open'); }
});

/* ── EXPORT CSV ── */
g('exportBtn').addEventListener('click', ()=>{
  if(!pp.length){ alert('No participants to export yet.'); return; }
  const hdr = ['Name','Email','Phone','Gender','Country','Type','Special Requests','Date'];
  const rows = pp.map(p=>[p.name,p.email,p.phone,p.gender,p.country,p.type,
    (p.requests||'').replace(/\n/g,' '),p.date]
    .map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(','));
  const a = Object.assign(document.createElement('a'),{
    href:URL.createObjectURL(new Blob([[hdr.join(','),...rows].join('\r\n')],{type:'text/csv'})),
    download:'wmcd_participants.csv'});
  a.click();
});

/* ── BADGE ── */
function updateBadge(){ g('badge').textContent = pp.length; }

/* ── INIT ── */
updateBadge();
