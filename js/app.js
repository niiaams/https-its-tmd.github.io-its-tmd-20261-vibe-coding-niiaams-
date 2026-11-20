// ROBRIES · aplikasi satu halaman (tanpa server). Semua penyimpanan di localStorage browser.
/* global catat, kondisi, log, tanyaSkor */

const STORE = 'robries-app-v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = '') => p + Math.random().toString(36).slice(2, 8).toUpperCase();
const clone = (o) => JSON.parse(JSON.stringify(o));

// ---------- State ----------
function loadState() {
  try { return JSON.parse(localStorage.getItem(STORE)) || null; } catch (e) { return null; }
}
let S = loadState() || {
  projects: [], current: null, leads: [], orders: [], quotes: [],
  role: 'guest', lang: 'en', cur: 'IDR', rules: null,
  account: { tradeApproved: false, wholesaleApproved: false, distributorCountry: 'MY', name: 'Demo Studio (fictional)' },
  ui: { grid: true, multi: false, rotStep: 15, filters: {} },
};
S.ui = S.ui || { grid: true, multi: false, rotStep: 15, filters: {} };
S.cart = S.cart || { lines: [], ctx: null, notes: '' };
S.locale = S.locale || null;
let R = mergeRules(DEFAULT_RULES, S.rules);
LANG = S.lang;

function mergeRules(def, saved) {
  const r = clone(def);
  if (!saved || saved.version !== def.version) return r;
  return Object.assign(r, saved);
}
function save() {
  S.rules = R;
  try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { toast('Storage full — could not save'); }
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('tampil');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('tampil'), 2600);
}

// ---------- Proyek ----------
function newProject(name, tplId) {
  const tpl = TEMPLATES.find((x) => x.id === tplId);
  const p = {
    id: uid('P'), name: name || 'Untitled project', folder: 'General', created: Date.now(), updated: Date.now(),
    room: tpl ? tpl.room.slice() : [8000, 6000, 3000], template: tplId || 'custom', items: [],
    ctx: defaultCtx(),
    versions: [], notes: '', files: [], override: { pct: 0 }, status: 'draft', email: '', estStamp: null,
  };
  if (tpl) p.items = tpl.items.map((t) => makeItem(t.pid, t.x, t.z, { rot: t.rot, color: tpl.color, dims: t.dims, size: t.dims ? 'custom' : 'standard' }));
  S.projects.unshift(p);
  S.current = p.id;
  save();
  return p;
}
function defaultCtx() {
  return { country: (S.locale && S.locale.country) || 'ID', zone: 'jawa', incoterm: 'CIF', priceList: S.role === 'distributor' ? 'distributor' : 'retail', segment: 'fnb' };
}
function makeItem(pid, x, z, extra = {}) {
  const p = PMAP[pid];
  const color = extra.color || 'damson';
  const c = CMAP[color];
  return {
    uid: uid('i'), pid, x, z, rot: extra.rot || 0, size: extra.size || 'standard', dims: extra.dims || null,
    color, mat: c.type === 'LDPE' ? 'ldpe' : 'hdpe', finish: p.io === 'outdoor' ? 'uv' : 'matte', addons: [], group: null,
  };
}
function cur() {
  let p = S.projects.find((x) => x.id === S.current);
  if (!p) p = newProject('My café layout', null);
  return p;
}
function touch(p) { p.updated = Date.now(); save(); }

// Encode proyek ke URL (tautan baca-saja / lanjutkan via email). Tanpa server.
function encodeProject(p) {
  const c = { n: p.name, r: p.room, x: p.ctx, o: p.override, i: p.items.map((it) => [it.pid, Math.round(it.x), Math.round(it.z), it.rot, it.color, it.mat, it.finish, it.size === 'custom' ? it.dims : 0, it.addons, it.group]) };
  return btoa(unescape(encodeURIComponent(JSON.stringify(c)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeProject(s) {
  const c = JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
  return {
    id: uid('P'), name: c.n, room: c.r, ctx: c.x, override: c.o || { pct: 0 }, folder: 'Shared', created: Date.now(), updated: Date.now(), template: 'custom', versions: [], notes: '', files: [], status: 'draft',
    items: c.i.map((a) => ({ uid: uid('i'), pid: a[0], x: a[1], z: a[2], rot: a[3], color: a[4], mat: a[5], finish: a[6], size: a[7] ? 'custom' : 'standard', dims: a[7] || null, addons: a[8] || [], group: a[9] || null })),
  };
}
function baseURL() { return location.href.split('#')[0]; }

// ---------- Helpers tampilan ----------
const money = (idr) => fmt(idr, S.cur, R);
// Kondisi A: harga produk tidak ditampilkan ke pelanggan (staf tetap melihat harga).
function hargaTampil() { return kondisi === 'B' || ['sales', 'admin', 'distributor'].includes(S.role); }
function priceTag(idr) { return hargaTampil() ? money(idr) : `<span class="harga-minta">${t('price_on_request')}</span>`; }
// Nilai pesanan memakai mata uang & kurs yang dikunci saat checkout.
function om(idr, o) {
  if (!o || !o.cur) return money(idr);
  try { return new Intl.NumberFormat(LANG === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: o.cur, maximumFractionDigits: 0 }).format(idr / o.fx); } catch (e) { return o.cur + ' ' + Math.round(idr / o.fx); }
}
function lockOrderCur(o) { o.cur = S.cur; o.fx = R.fx[S.cur] || 1; return o; }
function segLabel(id) { return L(SEGMENTS.find((s) => s.id === id)); }
function catLabel(id) { return L(CATEGORIES.find((s) => s.id === id)); }
function countryLabel(id) { return L(COUNTRIES.find((s) => s.id === id)); }
function swatch(c, cls = '') { return `<span class="swatch ${cls}" style="background-image:url('${c.img}');background-color:${c.hex}" title="${esc(c.name)}"></span>`; }
function productThumb(p, color) {
  if (p.img) return `<img src="${p.img}" alt="${esc(p.name)} – recycled plastic ${esc(catLabel(p.cat))}" loading="lazy">`;
  const c = CMAP[color || (p.cat === 'sheet' ? 'light-terrarium' : p.cat === 'planter' ? 'seaweed' : 'damson')];
  return `<div class="thumb-tekstur" style="background-image:url('${c.img}')"><span>${esc(p.name)}</span></div>`;
}
function dimsText(d) { return `${d[0]} × ${d[1]} × ${d[2]} mm`; }
function productMats(p) { return p.io === 'outdoor' ? ['hdpe'] : ['hdpe', 'ldpe']; }
function canSeeList(id) {
  if (id === 'retail') return true;
  if (S.role === 'admin' || S.role === 'sales') return true;
  if (id === 'distributor') return S.role === 'distributor';
  if (id === 'trade') return false;
  if (id === 'wholesale') return S.role === 'distributor';
  return false;
}
function routeLead(country, segment) {
  const d = (S.distributors || DEFAULT_DISTRIBUTORS).find((x) => x.country === country);
  if (d && segment !== 'hospitality') return { type: 'distributor', id: d.id, name: d.name, wa: d.wa, email: d.email, country };
  const desk = { hospitality: 'Hospitality Key Accounts', architect: 'Projects & Specifiers', institution: 'Projects & Specifiers', wholesale: 'Wholesale Desk', fnb: 'F&B & Retail Desk' }[segment] || 'Sales';
  return { type: 'hq', id: 'hq', name: `${HQ.name} · ${desk}`, wa: HQ.wa, email: HQ.email, country };
}

// ---------- Router ----------
let route = { name: 'home', arg: null };
function parseRoute() {
  const h = location.hash.replace(/^#\/?/, '');
  const [pathQ] = [h];
  const [path, q] = pathQ.split('?');
  const parts = path.split('/');
  if (q) { const lang = new URLSearchParams(q).get('lang'); if (lang && I18N[lang]) setLang(lang, true); }
  return { name: parts[0] || 'home', arg: parts.slice(1).join('/') || null };
}
function go(hash) { location.hash = hash; }
window.addEventListener('hashchange', () => { route = parseRoute(); render(); window.scrollTo(0, 0); });

function navHTML() {
  const links = [['catalog', 'nav_explore'], ['materials', 'nav_materials'], ['projects', 'nav_projects'], ['configure', 'nav_configure']];
  if (S.role === 'distributor') links.push(['distributor', 'nav_dist']);
  if (S.role === 'sales' || S.role === 'admin') links.push(['sales', 'nav_sales']);
  if (S.role === 'admin') links.push(['admin', 'nav_admin']);
  links.push(['account', 'nav_account']);
  return links.map(([r, k]) => `<a href="#/${r}" class="${route.name === r || (r === 'catalog' && route.name === 'product') ? 'aktif' : ''}">${t(k)}</a>`).join('');
}

const VIEWS = {};
function render() {
  document.documentElement.lang = LANG;
  $('#nav-utama').innerHTML = navHTML();
  $('#nav-utama').classList.remove('buka');
  $('#pilih-bahasa').value = LANG;
  $('#pilih-mata-uang').value = S.cur;
  $('#pilih-peran').value = S.role;
  $('#chat-judul').textContent = t('ai_title');
  $('#chat-label').textContent = t('ai_label');
  $('#chat-input').placeholder = t('ai_placeholder');
  $('#chat-handoff').textContent = t('ai_handoff');
  $('#buka-riset').textContent = t('research');
  const n = S.cart.lines.reduce((a, l) => a + l.qty, 0);
  $('#jumlah-keranjang').textContent = n;
  $('#tombol-keranjang').title = kondisi === 'A' ? t('quote_cart') : t('cart');
  const locked = ['checkout', 'pay'].includes(route.name);
  $('#pilih-mata-uang').disabled = locked;
  $('#pilih-mata-uang').title = locked ? t('cur_locked') : 'Currency';
  $('#tombol-lokasi').disabled = locked;
  $('#label-lokasi').textContent = `${(S.locale && S.locale.country) || 'ID'} · ${S.cur}`;
  const v = VIEWS[route.name] || VIEWS.home;
  const app = $('#app');
  app.className = 'view-' + route.name;
  v(app, route.arg);
  catat('lihat_halaman', route.name + (route.arg ? '/' + route.arg.slice(0, 30) : ''));
}

function setLang(l, silent) {
  LANG = l; S.lang = l; save();
  if (!silent) { catat('ganti_bahasa', l); render(); }
}

// ========== HOME ==========
VIEWS.home = (app) => {
  const totalKg = MATERIALS.reduce((s, m) => s + m.divertedKg, 0);
  const featured = ['anyer-chair', 'klayar-table', 'sawarna-low-table', 'mada-bench', 'glagah-counter-stool', 'rps-120-20'].map((id) => PMAP[id]);
  app.innerHTML = `
  <section class="hero">
    <div class="hero-teks">
      <p class="eyebrow">${t('hero_eyebrow')}</p>
      <h1>${t('hero_title')}</h1>
      <p class="lead">${t('hero_sub')}</p>
      <div class="cta-baris">
        <a class="primer besar" href="#/catalog">${t('cta_browse')}</a>
        <a class="sekunder besar" href="#/configure" data-log="cta_konfigurasi">${t('cta_configure')}</a>
      </div>
    </div>
    <figure class="hero-foto">
      <img src="./gambar/proyek/wall-panel-retail.jpg" alt="Recycled plastic wall panels and circular seating installation in a retail store">
      <figcaption>Wall panel & installation · 100% recycled HDPE</figcaption>
    </figure>
  </section>
  <section class="strip-tekstur" aria-hidden="true">${COLORS.map((c) => `<span style="background-image:url('${c.img}')"></span>`).join('')}</section>
  <section class="blok">
    <div class="stat-baris">
      <div><strong>${totalKg.toLocaleString()}</strong><span>${t('stat_kg')}</span></div>
      <div><strong>120+</strong><span>${t('stat_projects')}</span></div>
      <div><strong>${COLORS.length}</strong><span>${t('stat_colors')}</span></div>
    </div>
  </section>
  <section class="blok">
    <h2>${t('journey_title')}</h2>
    <ol class="langkah">
      ${[1, 2, 3, 4, 5].map((n) => `<li><span class="no">0${n}</span><strong>${t('j' + n)}</strong><p>${t('j' + n + 'd')}</p></li>`).join('')}
    </ol>
  </section>
  <section class="blok">
    <h2>${t('seg_title')}</h2>
    <div class="chip-baris">${CUSTOMER_SEGMENTS.map((s) => `<span class="chip besar">${esc(L(s))}</span>`).join('')}</div>
    <div class="chip-baris">${SEGMENTS.map((s) => `<a class="chip" href="#/catalog" data-seg="${s.id}">${esc(L(s))}</a>`).join('')}</div>
  </section>
  <section class="blok">
    <div class="judul-baris"><h2>${LANG === 'id' ? 'Produk pilihan' : 'Featured recycle furniture'}</h2><a href="#/catalog">${t('cta_browse')} →</a></div>
    <div class="grid-produk">${featured.map(cardHTML).join('')}</div>
  </section>
  <section class="blok dua-kolom">
    <div>
      <h2>${LANG === 'id' ? 'Material daur ulang yang jujur' : 'Recycled material, honestly made'}</h2>
      <p>${LANG === 'id'
        ? 'Setiap lembaran RPS (Robries Polymer Sheet) dibuat dari tutup botol, krat, botol sampo, dan plastik fleksibel yang dipilah per warna. Variasi pola adalah jejak asal-usulnya — bukan cacat.'
        : 'Every RPS (Robries Polymer Sheet) is pressed from bottle caps, crates, shampoo bottles and flexible plastics sorted by colour. Pattern variation is the trace of its origin, not a defect.'}</p>
      <a class="sekunder" href="#/materials">${t('cta_materials')}</a>
    </div>
    <div class="mosaik">${COLORS.slice(0, 6).map((c) => `<figure><img src="${c.img}" alt="${c.name} recycled ${c.type} texture" loading="lazy"><figcaption>${c.name}</figcaption></figure>`).join('')}</div>
  </section>
  <section class="blok">
    <div class="judul-baris"><h2>${t('proj_title')}</h2><a href="#/projects">${LANG === 'id' ? 'Semua proyek' : 'All projects'} →</a></div>
    <div class="grid-proyek">${CASE_STUDIES.slice(0, 3).map(caseHTML).join('')}</div>
  </section>
  <section class="blok seo">
    <h2>${LANG === 'id' ? 'Recycle sheet & recycle furniture untuk proyek komersial' : 'Recycle sheet & recycle furniture for commercial projects'}</h2>
    <p>${LANG === 'id'
      ? 'ROBRIES adalah produsen recycle sheet, recycle furniture, dan outdoor furniture dari 100% recycled material di Indonesia. Kami melayani kafe, restoran, hotel, kantor, sekolah, arsitek, dan desainer interior di Indonesia, Malaysia, Singapura, Australia, Jepang, Inggris, dan Amerika Serikat — langsung maupun melalui distributor. #recycledmaterial #sustainableproduct'
      : 'ROBRIES manufactures recycle sheet, recycle furniture and outdoor furniture from 100% recycled material in Indonesia. We work with cafés, restaurants, hotels, offices, schools, architects and interior designers across Indonesia, Malaysia, Singapore, Australia, Japan, the UK and the US, directly or through regional distributors. #recycledmaterial #sustainableproduct'}</p>
  </section>`;
  $$('[data-seg]', app).forEach((a) => a.addEventListener('click', () => { S.ui.filters = { seg: a.dataset.seg }; save(); }));
  bindCards(app);
};

function cardHTML(p) {
  return `<article class="kartu-produk">
    <a href="#/product/${p.id}" class="kartu-foto">${productThumb(p)}</a>
    <div class="kartu-isi">
      <p class="kat">${esc(catLabel(p.cat))} · ${p.io === 'both' ? `${t('f_indoor')} / ${t('f_outdoor')}` : p.io === 'outdoor' ? t('f_outdoor') : t('f_indoor')}${p.dummy ? ' · <em>dummy</em>' : ''}</p>
      <h3><a href="#/product/${p.id}">${esc(p.name)}</a></h3>
      <p class="harga">${priceTag(R.prices[p.id])}</p>
      <p class="redup kecil-teks">${t('lead')}: ~${R.days[p.id]} ${t('days')} · ${(p.g / 1000).toFixed(1)} kg ${LANG === 'id' ? 'plastik daur ulang' : 'recycled plastic'}</p>
      <div class="kartu-aksi">
        <button type="button" class="kecil sekunder" data-add="${p.id}" title="${t('add_to_layout')}">+ 3D</button>
        <button type="button" class="kecil primer" data-cart="${p.id}">🛒 ${kondisi === 'A' ? t('add_to_quote') : t('add_to_cart')}</button>
      </div>
    </div>
  </article>`;
}
function bindCards(root) {
  $$('[data-add]', root).forEach((b) => b.addEventListener('click', () => addToLayout(b.dataset.add)));
  $$('[data-cart]', root).forEach((b) => b.addEventListener('click', () => addToCart(b.dataset.cart)));
}
function addToLayout(pid, color) {
  const p = cur();
  const it = makeItem(pid, p.room[0] / 2 + (Math.random() - 0.5) * 600, p.room[1] / 2 + (Math.random() - 0.5) * 600, { color });
  p.items.push(it);
  touch(p);
  catat('tambah_item', `${pid} (dari katalog)`);
  toast(`${PMAP[pid].name} → ${p.name}`);
  go('#/configure');
}

// ========== CATALOG ==========
VIEWS.catalog = (app) => {
  const f = S.ui.filters || {};
  const maxPrice = Math.max(...PRODUCTS.map((p) => R.prices[p.id]));
  const opt = (arr, sel, lab) => `<option value="">${t('f_all')}</option>` + arr.map((x) => `<option value="${x.id}" ${sel === x.id ? 'selected' : ''}>${esc(lab(x))}</option>`).join('');
  app.innerHTML = `
  <section class="kepala-halaman">
    <p class="eyebrow">Recycle furniture · Recycle sheet · Outdoor furniture</p>
    <h1>${t('catalog_title')}</h1>
    <p class="lead">${t('catalog_sub')}</p>
  </section>
  <div class="katalog">
    <aside class="filter" aria-label="${t('filters')}">
      <h2>${t('filters')}</h2>
      <label>${t('f_category')}<select data-f="cat">${opt(CATEGORIES, f.cat, L)}</select></label>
      <label>${t('f_segment')}<select data-f="seg">${opt(SEGMENTS, f.seg, L)}</select></label>
      <label>${t('f_material')}<select data-f="mat">${opt(MATERIALS, f.mat, (m) => m.name)}</select></label>
      <label>${t('f_io')}<select data-f="io"><option value="">${t('f_all')}</option><option value="indoor" ${f.io === 'indoor' ? 'selected' : ''}>${t('f_indoor')}</option><option value="outdoor" ${f.io === 'outdoor' ? 'selected' : ''}>${t('f_outdoor')}</option></select></label>
      <p class="label">${t('f_color')}</p>
      <div class="swatch-pilih">${COLORS.map((c) => `<button type="button" class="sw-btn ${f.color === c.id ? 'aktif' : ''}" data-color="${c.id}" title="${c.name}">${swatch(c)}</button>`).join('')}</div>
      <label>${t('f_price')}: <output id="out-harga">${money(f.price || maxPrice)}</output>
        <input type="range" data-f="price" min="50000" max="${maxPrice}" step="50000" value="${f.price || maxPrice}"></label>
      <label>${t('f_lead')}: <output id="out-lead">${f.lead || 30}</output>
        <input type="range" data-f="lead" min="7" max="30" step="1" value="${f.lead || 30}"></label>
      <button type="button" class="sekunder" id="reset-filter">${t('f_reset')}</button>
    </aside>
    <section>
      <p class="redup" id="jumlah-hasil"></p>
      <div class="grid-produk" id="grid-katalog"></div>
    </section>
  </div>`;
  const apply = () => {
    const list = PRODUCTS.filter((p) => (!f.cat || p.cat === f.cat) && (!f.seg || p.segs.includes(f.seg))
      && (!f.mat || productMats(p).includes(f.mat)) && (!f.io || p.io === f.io || p.io === 'both')
      && (!f.color || (CMAP[f.color].type === 'LDPE' ? productMats(p).includes('ldpe') : true))
      && (!f.price || R.prices[p.id] <= f.price) && (!f.lead || R.days[p.id] <= f.lead));
    $('#grid-katalog').innerHTML = list.map(cardHTML).join('') || `<p>${t('no_data')}</p>`;
    $('#jumlah-hasil').textContent = `${list.length} ${t('results')}`;
    bindCards($('#grid-katalog'));
  };
  $$('[data-f]', app).forEach((el) => el.addEventListener('input', () => {
    const k = el.dataset.f;
    f[k] = el.type === 'range' ? Number(el.value) : el.value;
    if (k === 'price') $('#out-harga').textContent = money(f.price);
    if (k === 'lead') $('#out-lead').textContent = f.lead;
    S.ui.filters = f; save(); apply();
    clearTimeout(apply.t); apply.t = setTimeout(() => catat('filter_katalog', JSON.stringify(f)), 500);
  }));
  $$('[data-color]', app).forEach((b) => b.addEventListener('click', () => {
    f.color = f.color === b.dataset.color ? '' : b.dataset.color;
    $$('[data-color]', app).forEach((x) => x.classList.toggle('aktif', x.dataset.color === f.color));
    S.ui.filters = f; save(); apply(); catat('filter_katalog', 'color=' + f.color);
  }));
  $('#reset-filter').addEventListener('click', () => { S.ui.filters = {}; save(); render(); });
  apply();
};

// ========== PRODUCT DETAIL ==========
VIEWS.product = (app, id) => {
  const p = PMAP[id];
  if (!p) { go('#/catalog'); return; }
  catat('lihat_produk', id);
  let pick = p.io === 'outdoor' ? 'seaweed' : 'damson';
  const related = PRODUCTS.filter((x) => x.id !== p.id && x.cat === p.cat).slice(0, 3);
  const gallery = [p.img, ...['damson', 'chesnut', 'seaweed', 'marigold'].map((c) => CMAP[c].img)].filter(Boolean);
  app.innerHTML = `
  <nav class="remah"><a href="#/catalog">${t('nav_explore')}</a> / ${esc(catLabel(p.cat))}</nav>
  <section class="detail">
    <div class="galeri">
      <div class="galeri-utama" id="galeri-utama">${productThumb(p)}</div>
      <div class="galeri-thumb">${gallery.map((g, i) => `<button type="button" data-g="${g}" aria-label="Image ${i + 1}"><img src="${g}" alt=""></button>`).join('')}</div>
    </div>
    <div class="detail-info">
      <p class="eyebrow">${esc(catLabel(p.cat))}${p.dummy ? ' · ' + t('dummy_note') : ''}</p>
      <h1>${esc(p.name)}</h1>
      <p class="lead">${esc(L(p))}</p>
      <p class="harga besar">${priceTag(R.prices[p.id])} <small class="redup">${LANG === 'id' ? 'harga retail, belum pajak & ongkir' : 'retail, excl. tax & shipping'}</small></p>
      <dl class="spes">
        <dt>${t('dims')}</dt><dd>${dimsText(p.dims)}${p.seat ? ` · seat ${p.seat} mm` : ''}</dd>
        <dt>${t('weight')}</dt><dd>${(p.w / 1000).toFixed(1)} kg</dd>
        <dt>${t('recycled')}</dt><dd>${(p.g / 1000).toFixed(2)} kg ≈ ${Math.round(p.g / 2.5).toLocaleString()} ${LANG === 'id' ? 'tutup botol' : 'bottle caps'}</dd>
        <dt>${t('lead')}</dt><dd>~${R.days[p.id]} ${t('days')} ${LANG === 'id' ? 'produksi (warna utama)' : 'production (main colours)'}</dd>
      </dl>
      <h2>${t('materials_finishes')}</h2>
      <p class="kecil-teks">${productMats(p).map((m) => MATERIALS.find((x) => x.id === m).name).join(' / ')} · ${FINISHES.map((x) => L(x)).join(' · ')}</p>
      <div class="swatch-pilih">${COLORS.filter((c) => productMats(p).includes(c.type.toLowerCase())).map((c) => `<button type="button" class="sw-btn ${c.id === pick ? 'aktif' : ''}" data-pick="${c.id}" title="${c.name}${c.group === 'special' ? ' (special)' : ''}">${swatch(c)}</button>`).join('')}</div>
      <p class="kecil-teks" id="pick-label"></p>
      <div class="qty-baris">
        <label>${t('finish')}<select id="d-fin">${FINISHES.map((f) => `<option value="${f.id}" ${(p.io === 'outdoor' ? 'uv' : 'matte') === f.id ? 'selected' : ''}>${esc(L(f))}</option>`).join('')}</select></label>
        <label>${t('qty_label')}<input type="number" id="d-qty" value="1" min="1" max="500"></label>
      </div>
      <div class="cta-baris">
        <button type="button" class="primer besar" id="tambah-keranjang">🛒 ${kondisi === 'A' ? t('add_to_quote') : t('add_to_cart')}</button>
        <button type="button" class="sekunder besar" id="tambah-layout">+ ${t('add_to_layout')}</button>
      </div>
      <h2>${t('tech_specs')}</h2>
      <table class="tabel-spes">
        <tr><th>${t('spec_load')}</th><td>${p.specs.load}</td></tr>
        <tr><th>${t('spec_uv')}</th><td>${p.specs.uv}</td></tr>
        <tr><th>${t('spec_water')}</th><td>${p.specs.water}</td></tr>
        <tr><th>${t('spec_fire')}</th><td>${p.specs.fire}</td></tr>
        <tr><th>Custom range</th><td>${dimsText(p.minDims)} – ${dimsText(p.maxDims)}</td></tr>
      </table>
      <p class="kecil-teks redup">${LANG === 'id' ? 'Nilai teknis bersifat indikatif (data rekaan prototipe).' : 'Technical values are indicative (prototype placeholder data).'}</p>
      <h2>${t('downloads')}</h2>
      <div class="cta-baris">
        <button type="button" class="sekunder" id="dl-spec">⬇ ${t('dl_spec')}</button>
        <button type="button" class="sekunder" id="dl-dxf">⬇ ${t('dl_dxf')}</button>
        <button type="button" class="sekunder" id="dl-obj">⬇ ${t('dl_obj')}</button>
      </div>
      <aside class="catatan-variasi"><strong>${t('variation_title')}</strong><p>${t('variation_text')}</p></aside>
    </div>
  </section>
  ${related.length ? `<section class="blok"><h2>${LANG === 'id' ? 'Produk terkait' : 'Related'}</h2><div class="grid-produk">${related.map(cardHTML).join('')}</div></section>` : ''}`;
  const lab = () => { const c = CMAP[pick]; $('#pick-label').innerHTML = `<strong>${c.name}</strong> · ${c.type} · ${c.group === 'special' ? t('special_colors') + ' ' + t('special_note') : t('main_colors')}${c.pinhole ? ' · pinhole possible' : ''}`; };
  lab();
  $$('[data-pick]', app).forEach((b) => b.addEventListener('click', () => {
    pick = b.dataset.pick;
    $$('[data-pick]', app).forEach((x) => x.classList.toggle('aktif', x === b));
    $('#galeri-utama').innerHTML = `<img src="${CMAP[pick].img}" alt="${CMAP[pick].name} texture close-up">`;
    lab(); catat('pilih_warna_produk', `${p.id}:${pick}`);
  }));
  $$('[data-g]', app).forEach((b) => b.addEventListener('click', () => { $('#galeri-utama').innerHTML = `<img src="${b.dataset.g}" alt="">`; }));
  $('#tambah-layout').addEventListener('click', () => addToLayout(p.id, pick));
  $('#tambah-keranjang').addEventListener('click', () => addToCart(p.id, pick, $('#d-fin').value, Math.max(1, Number($('#d-qty').value) || 1)));
  $('#dl-spec').addEventListener('click', () => { catat('unduh_spec', p.id); printSpec(p); });
  $('#dl-dxf').addEventListener('click', () => { catat('unduh_cad', p.id + '.dxf'); download(`${p.id}.dxf`, makeDXF(p), 'application/dxf'); });
  $('#dl-obj').addEventListener('click', () => { catat('unduh_cad', p.id + '.obj'); download(`${p.id}.obj`, makeOBJ(p), 'text/plain'); });
  bindCards(app);
};

function download(name, content, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function makeDXF(p) {
  const [Lx, W] = p.dims;
  const lines = [];
  const add = (...a) => lines.push(...a);
  add('0', 'SECTION', '2', 'ENTITIES');
  if (p.round) add('0', 'CIRCLE', '8', 'FOOTPRINT', '10', Lx / 2, '20', W / 2, '30', 0, '40', Lx / 2);
  else [[0, 0, Lx, 0], [Lx, 0, Lx, W], [Lx, W, 0, W], [0, W, 0, 0]].forEach(([a, b, c, d]) => add('0', 'LINE', '8', 'FOOTPRINT', '10', a, '20', b, '30', 0, '11', c, '21', d, '31', 0));
  add('0', 'TEXT', '8', 'ANNO', '10', 0, '20', -60, '30', 0, '40', 30, '1', `ROBRIES ${p.name} ${dimsText(p.dims)} (placeholder)`);
  add('0', 'ENDSEC', '0', 'EOF');
  return lines.join('\n');
}
function makeOBJ(p) {
  const [a, b, c] = p.dims.map((v) => v / 1000);
  const v = [[0, 0, 0], [a, 0, 0], [a, 0, b], [0, 0, b], [0, c, 0], [a, c, 0], [a, c, b], [0, c, b]];
  return `# ROBRIES ${p.name} – bounding-box placeholder (metres)\no ${p.id}\n` + v.map((q) => `v ${q.join(' ')}`).join('\n')
    + '\nf 1 2 3 4\nf 5 8 7 6\nf 1 5 6 2\nf 2 6 7 3\nf 3 7 8 4\nf 5 1 4 8\n';
}

// ========== MATERIALS ==========
VIEWS.materials = (app) => {
  const sheets = PRODUCTS.filter((p) => p.sheet);
  const colorCard = (c) => `<figure class="warna-kartu"><img src="${c.img}" alt="${c.name} recycled ${c.type} texture close-up" loading="lazy">
    <figcaption><strong>${c.name}</strong><span>${c.type}</span>${c.pinhole ? '<em>pinhole</em>' : ''}</figcaption></figure>`;
  app.innerHTML = `
  <section class="kepala-halaman">
    <p class="eyebrow">RPS · Robries Polymer Sheet · Recycled material</p>
    <h1>${t('mat_title')}</h1>
    <p class="lead">${t('mat_sub')}</p>
  </section>
  <section class="blok grid-material">
    ${MATERIALS.map((m) => `<article class="material-kartu">
      <div class="material-kode">♲ ${m.code}</div>
      <h2>${m.name} <small>${esc(m.en.full)}</small></h2>
      <p><strong>${t('mat_from')}:</strong> ${esc(L({ en: m.en.from, idn: m.idn.from }))}</p>
      <p>${esc(L({ en: m.en.story, idn: m.idn.story }))}</p>
      <dl class="spes"><dt>${t('mat_code')}</dt><dd>${m.code}</dd><dt>${t('mat_impact')}</dt><dd>${m.impact}</dd></dl>
      <p class="angka-besar">${m.divertedKg.toLocaleString()} kg <span>${t('mat_diverted')}</span></p>
    </article>`).join('')}
  </section>
  <section class="blok">
    <div class="judul-baris"><h2>${t('main_colors')}</h2><span class="redup">HDPE · ${LANG === 'id' ? 'stok tersedia' : 'in stock'}</span></div>
    <div class="grid-warna">${COLORS.filter((c) => c.group === 'main').map(colorCard).join('')}</div>
  </section>
  <section class="blok">
    <div class="judul-baris"><h2>${t('special_colors')}</h2><span class="redup">${t('special_note')}</span></div>
    <div class="grid-warna">${COLORS.filter((c) => c.group === 'special').map(colorCard).join('')}</div>
  </section>
  <section class="blok">
    <aside class="catatan-variasi besar"><strong>${t('variation_title')}</strong><p>${t('variation_text')}</p></aside>
  </section>
  <section class="blok">
    <h2>${t('sheet_prices')}</h2>
    <div class="tabel-scroll"><table class="tabel">
      <thead><tr><th>Size</th><th>1 cm</th><th>2 cm</th></tr></thead>
      <tbody>${[[950, 400], [1000, 500], [1200, 600]].map(([a, b]) => {
        const s1 = sheets.find((s) => s.dims[0] === a && s.dims[2] === 10), s2 = sheets.find((s) => s.dims[0] === a && s.dims[2] === 20);
        return `<tr><td>${a / 10} × ${b / 10} cm</td><td>${priceTag(R.prices[s1.id])} <button type="button" class="kecil tautan" data-cart="${s1.id}">🛒</button></td><td>${priceTag(R.prices[s2.id])} <button type="button" class="kecil tautan" data-cart="${s2.id}">🛒</button></td></tr>`;
      }).join('')}</tbody>
    </table></div>
    <p class="kecil-teks redup">${t('sheet_terms')} ${LANG === 'id' ? 'Rekomendasi: 2 cm untuk top meja/stool, 1 cm untuk pelapis rangka.' : 'Recommended: 2 cm for table/stool tops, 1 cm for layering a framework.'}</p>
  </section>`;
  bindCards(app);
};

// ========== PROJECTS ==========
function caseHTML(c) {
  const tx = L({ en: c.en.t, idn: c.idn.t }), d = L({ en: c.en.d, idn: c.idn.d });
  return `<article class="kartu-proyek">
    <div class="proyek-foto">${c.img ? `<img src="${c.img}" alt="${esc(tx)}" loading="lazy">` : `<div class="thumb-tekstur tinggi" style="background-image:url('${CMAP[c.color].img}')"><span>${LANG === 'id' ? 'Ilustrasi' : 'Illustration'}</span></div>`}</div>
    <div class="kartu-isi"><p class="kat">${esc(segLabel(c.seg))} · ${esc(countryLabel(c.country))} · ${c.year}</p><h3>${esc(tx)}</h3><p class="kecil-teks">${esc(d)}</p><p class="kecil-teks"><strong>${c.kg.toLocaleString()} kg</strong> ${LANG === 'id' ? 'plastik didaur ulang' : 'plastic recycled'}</p></div>
  </article>`;
}
VIEWS.projects = (app) => {
  const f = { seg: '', country: '' };
  app.innerHTML = `
  <section class="kepala-halaman"><p class="eyebrow">Case studies</p><h1>${t('proj_title')}</h1><p class="lead">${t('proj_sub')}</p></section>
  <div class="filter-baris">
    <label>${t('segment')}<select id="pf-seg"><option value="">${t('f_all')}</option>${SEGMENTS.map((s) => `<option value="${s.id}">${esc(L(s))}</option>`).join('')}</select></label>
    <label>${t('country')}<select id="pf-country"><option value="">${t('f_all')}</option>${COUNTRIES.map((s) => `<option value="${s.id}">${esc(L(s))}</option>`).join('')}</select></label>
  </div>
  <div class="grid-proyek" id="grid-proyek"></div>`;
  const apply = () => { $('#grid-proyek').innerHTML = CASE_STUDIES.filter((c) => (!f.seg || c.seg === f.seg) && (!f.country || c.country === f.country)).map(caseHTML).join('') || `<p>${t('no_data')}</p>`; };
  $('#pf-seg').addEventListener('change', (e) => { f.seg = e.target.value; apply(); catat('filter_proyek', 'seg=' + f.seg); });
  $('#pf-country').addEventListener('change', (e) => { f.country = e.target.value; apply(); catat('filter_proyek', 'country=' + f.country); });
  apply();
};

// ========== CONFIGURATOR ==========
let lastEst = null;
let estSnapshot = null; // kondisi A: estimasi terakhir yang diminta
let readOnly = false;
let breakdownOpen = false;

function liveMode() { return kondisi === 'B' || readOnly; }

VIEWS.configure = (app) => { readOnly = false; configuratorView(app, cur()); };
VIEWS.view = (app, data) => {
  let p;
  try { p = decodeProject(data); } catch (e) { app.innerHTML = '<section class="kepala-halaman"><h1>Invalid link</h1></section>'; return; }
  readOnly = true;
  configuratorView(app, p);
};
VIEWS.resume = (app, data) => {
  try {
    const p = decodeProject(data);
    p.folder = 'Resumed';
    S.projects.unshift(p); S.current = p.id; save();
    catat('lanjutkan_dari_tautan', p.name);
    toast(LANG === 'id' ? 'Proyek dipulihkan dari tautan' : 'Project restored from link');
  } catch (e) { toast('Invalid link'); }
  go('#/configure');
};

let viewProject = null;
function configuratorView(app, p) {
  viewProject = p;
  const ro = readOnly;
  const tplOptions = TEMPLATES.map((x) => `<option value="${x.id}">${esc(L(x))}</option>`).join('');
  const palette = CATEGORIES.map((c) => {
    const list = PRODUCTS.filter((x) => x.cat === c.id);
    if (!list.length) return '';
    return `<details ${['chair', 'table', 'stool'].includes(c.id) ? 'open' : ''}><summary>${esc(L(c))} <span class="redup">${list.length}</span></summary>
      <div class="palet-list">${list.map((x) => `<div class="palet-item" draggable="true" data-pid="${x.id}" title="${esc(x.name)}">
        <div class="palet-foto">${productThumb(x)}</div><span>${esc(x.name)}</span><button type="button" class="ikon kecil" data-quick="${x.id}" aria-label="Add ${esc(x.name)}">+</button></div>`).join('')}</div></details>`;
  }).join('');
  app.innerHTML = `
  <div class="cfg ${ro ? 'baca-saja' : ''}">
    <aside class="cfg-kiri">
      ${ro ? `<div class="kotak"><p class="eyebrow">${LANG === 'id' ? 'Tautan baca-saja' : 'Read-only link'}</p><h2>${esc(p.name)}</h2><p class="kecil-teks">${LANG === 'id' ? 'Dibagikan dari ROBRIES Configurator.' : 'Shared from the ROBRIES Configurator.'}</p><button type="button" class="primer" id="salin-ke-saya">${LANG === 'id' ? 'Salin ke proyek saya' : 'Copy to my projects'}</button></div>` : `
      <div class="kotak">
        <label>${t('project_name')}<input id="nama-proyek" value="${esc(p.name)}"></label>
        <div class="baris-tombol">
          <button type="button" class="kecil sekunder" id="proyek-baru">+ ${LANG === 'id' ? 'Baru' : 'New'}</button>
          <select id="pilih-proyek" class="kecil">${S.projects.map((x) => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
        </div>
      </div>
      <div class="kotak">
        <h3>${t('cfg_room')}</h3>
        <label>${t('cfg_template')}<select id="tpl">${`<option value="">—</option>` + tplOptions}</select></label>
        <div class="baris-tombol"><button type="button" class="kecil primer" id="muat-tpl">${t('cfg_load_tpl')}</button><button type="button" class="kecil sekunder" id="tpl-kosong">${t('cfg_empty')}</button></div>
        <details><summary>${t('cfg_custom')}</summary>
          <div class="tiga"><label>${t('cfg_length')}<input type="number" id="r-l" value="${p.room[0]}" min="1500" max="40000" step="100"></label>
          <label>${t('cfg_width')}<input type="number" id="r-w" value="${p.room[1]}" min="1500" max="40000" step="100"></label>
          <label>${t('cfg_height')}<input type="number" id="r-h" value="${p.room[2]}" min="2200" max="8000" step="100"></label></div>
          <button type="button" class="kecil sekunder" id="r-apply">${t('cfg_apply')}</button>
        </details>
      </div>
      <div class="kotak palet">
        <h3>${t('cfg_products')}</h3>
        <p class="kecil-teks redup">${t('cfg_drag_hint')}</p>
        ${palette}
      </div>`}
    </aside>
    <section class="cfg-tengah">
      <div class="toolbar" role="toolbar">
        ${ro ? '' : `
        <button type="button" data-act="rotl" title="${t('t_rot_l')}">⟲</button>
        <button type="button" data-act="rotr" title="${t('t_rot_r')}">⟳</button>
        <select id="rot-step" title="Snap"><option value="15" ${S.ui.rotStep === 15 ? 'selected' : ''}>15°</option><option value="90" ${S.ui.rotStep === 90 ? 'selected' : ''}>90°</option></select>
        <button type="button" data-act="dup">${t('t_dup')}</button>
        <button type="button" data-act="del">${t('t_del')}</button>
        <button type="button" data-act="group">${t('t_group')}</button>
        <button type="button" data-act="ungroup">${t('t_ungroup')}</button>
        <button type="button" data-act="multi" class="${S.ui.multi ? 'aktif' : ''}">${t('t_multi')}</button>
        <button type="button" data-act="grid" class="${S.ui.grid ? 'aktif' : ''}">${t('t_grid')}</button>
        <span class="pisah"></span>`}
        <button type="button" data-act="top">${t('t_top')}</button>
        <button type="button" data-act="3d">${t('t_3d')}</button>
        <button type="button" data-act="shot">📷 ${t('t_shot')}</button>
      </div>
      <div class="kanvas" id="kanvas"><p class="memuat" id="memuat-3d">Loading 3D… <small>(three.js from CDN)</small></p></div>
      <div class="peringatan" id="peringatan"></div>
      <p class="kecil-teks redup petunjuk">${ro ? '' : t('cfg_select_hint') + ' · '}${LANG === 'id' ? 'Ruang' : 'Room'} ${p.room[0]} × ${p.room[1]} × ${p.room[2]} mm · ${LANG === 'id' ? 'grid 500 mm' : '500 mm grid'}</p>
      ${ro ? '' : `<div class="baris-tombol simpan-baris">
        <button type="button" class="sekunder kecil" id="simpan">💾 ${t('save')}</button>
        <button type="button" class="sekunder kecil" id="simpan-versi">${t('save_version')}</button>
        <button type="button" class="sekunder kecil" id="lihat-versi">${t('versions')} (${p.versions.length})</button>
        <button type="button" class="sekunder kecil" id="simpan-email">✉ ${t('save_email')}</button>
        <button type="button" class="sekunder kecil" id="bagikan">🔗 ${t('share')}</button>
        <button type="button" class="sekunder kecil" id="pdf">⬇ ${t('export_pdf')}</button>
      </div>`}
    </section>
    <aside class="cfg-kanan">
      ${ro ? '' : `<div class="kotak" id="panel-spes"></div>`}
      <div class="kotak" id="panel-boq"></div>
      <div class="kotak" id="panel-est"></div>
      ${ro ? '' : `<div class="kotak" id="panel-konversi"></div>`}
    </aside>
  </div>`;

  // --- bind kiri ---
  if (ro) {
    $('#salin-ke-saya').addEventListener('click', () => {
      const c = clone(p); c.id = uid('P'); c.folder = 'Shared with me';
      S.projects.unshift(c); S.current = c.id; save(); readOnly = false; catat('salin_proyek_bersama', c.name); go('#/configure');
    });
  } else {
    $('#nama-proyek').addEventListener('change', (e) => { p.name = e.target.value || 'Untitled'; touch(p); });
    $('#proyek-baru').addEventListener('click', () => { newProject(LANG === 'id' ? 'Proyek baru' : 'New project', null); catat('proyek_baru'); render(); });
    $('#pilih-proyek').addEventListener('change', (e) => { S.current = e.target.value; save(); render(); });
    $('#muat-tpl').addEventListener('click', () => {
      const id = $('#tpl').value;
      const tpl = TEMPLATES.find((x) => x.id === id);
      if (!tpl) return;
      if (p.items.length && !confirm(LANG === 'id' ? 'Ganti layout saat ini dengan layout referensi?' : 'Replace the current layout with the reference layout?')) return;
      p.room = tpl.room.slice(); p.template = id;
      p.items = tpl.items.map((x) => makeItem(x.pid, x.x, x.z, { rot: x.rot, color: tpl.color, dims: x.dims, size: x.dims ? 'custom' : 'standard' }));
      p.ctx.segment = { cafe: 'fnb', hotel: 'hospitality', classroom: 'institution', office: 'architect' }[id] || p.ctx.segment;
      touch(p); catat('pilih_template', id); render();
    });
    $('#tpl-kosong').addEventListener('click', () => { if (p.items.length && !confirm('Clear all items?')) return; p.items = []; touch(p); catat('kosongkan_ruang'); render(); });
    $('#r-apply').addEventListener('click', () => {
      const v = ['#r-l', '#r-w', '#r-h'].map((s) => Math.max(1500, Math.min(40000, Number($(s).value) || 0)));
      p.room = v; p.template = 'custom'; touch(p); catat('ubah_ruang', v.join('x')); render();
    });
    $$('.palet-item').forEach((el) => {
      el.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', el.dataset.pid); e.dataTransfer.effectAllowed = 'copy'; });
    });
    $$('[data-quick]').forEach((b) => b.addEventListener('click', () => {
      const pid = b.dataset.quick;
      addItemAt(pid, p.room[0] / 2 + (Math.random() - 0.5) * 800, p.room[1] / 2 + (Math.random() - 0.5) * 800);
    }));
    // toolbar
    $('#rot-step').addEventListener('change', (e) => { S.ui.rotStep = Number(e.target.value); save(); });
    $('#simpan').addEventListener('click', () => { saveThumb(p); touch(p); catat('simpan_proyek', p.name); toast(t('saved')); });
    $('#simpan-versi').addEventListener('click', () => {
      const name = prompt(LANG === 'id' ? 'Nama versi' : 'Version name', `v${p.versions.length + 1}`);
      if (name === null) return;
      p.versions.unshift({ name, t: Date.now(), room: p.room.slice(), items: clone(p.items) });
      touch(p); catat('simpan_versi', name); render();
    });
    $('#lihat-versi').addEventListener('click', () => versionsModal(p));
    $('#simpan-email').addEventListener('click', () => emailModal(p));
    $('#bagikan').addEventListener('click', () => shareModal(p));
    $('#pdf').addEventListener('click', () => { catat('ekspor_pdf', p.name); printProjectSheet(p); });
  }
  $$('[data-act]').forEach((b) => b.addEventListener('click', () => toolbarAction(b.dataset.act, p)));

  // --- 3D ---
  const mount3D = () => {
    const k = $('#kanvas');
    if (!k) return;
    const m = $('#memuat-3d'); if (m) m.remove();
    window.R3D.mount(k, {
      getProject: () => p,
      persist: () => { if (!readOnly) touch(p); },
      readOnly: () => readOnly,
      isMulti: () => S.ui.multi,
      gridOn: () => S.ui.grid,
      onSelect: (uids, info) => { renderSpec(p, uids); showWarnings(p, info); },
      onChange: (kind, detail, info) => { touch(p); catat('pindah_item', detail); showWarnings(p, info); refreshPanels(p); },
      onLive: (info) => showWarnings(p, info),
      onAnalyse: (info, uids) => { showWarnings(p, info); renderSpec(p, uids); },
      onDropProduct: (pid, x, z) => addItemAt(pid, x, z),
    });
  };
  if (window.R3D && window.R3D.ready) mount3D();
  else {
    window.addEventListener('r3d-ready', mount3D, { once: true });
    setTimeout(() => { const m = $('#memuat-3d'); if (m) m.innerHTML = '3D could not load (CDN blocked?). BoQ & estimate still work.'; }, 9000);
  }
  refreshPanels(p);
  renderSpec(p, []);
}

function addItemAt(pid, x, z) {
  const p = viewProject;
  const it = makeItem(pid, x, z, { color: lastColor() });
  if (PMAP[pid].shape === 'panel' && window.R3D) window.R3D.snapToWalls(it);
  p.items.push(it);
  touch(p);
  catat('tambah_item', pid);
  if (window.R3D && window.R3D.ready) { window.R3D.rebuild(); window.R3D.setSelection([it.uid]); }
  refreshPanels(p);
}
function lastColor() {
  const p = viewProject;
  return p.items.length ? p.items[p.items.length - 1].color : 'damson';
}

function selectedItems(p) {
  const sel = window.R3D ? window.R3D.getSelection() : [];
  return p.items.filter((x) => sel.includes(x.uid));
}

function toolbarAction(act, p) {
  const sel = selectedItems(p);
  const R3 = window.R3D;
  switch (act) {
    case 'rotl': case 'rotr': {
      if (!sel.length) return toast(t('nothing_selected'));
      const d = (act === 'rotl' ? -1 : 1) * S.ui.rotStep;
      // putar mengelilingi pusat pilihan
      const cx = sel.reduce((s, x) => s + x.x, 0) / sel.length, cz = sel.reduce((s, x) => s + x.z, 0) / sel.length;
      const a = (-d * Math.PI) / 180;
      sel.forEach((it) => {
        if (sel.length > 1) { const dx = it.x - cx, dz = it.z - cz; it.x = Math.round(cx + dx * Math.cos(a) + dz * Math.sin(a)); it.z = Math.round(cz - dx * Math.sin(a) + dz * Math.cos(a)); }
        it.rot = (((it.rot || 0) + d) % 360 + 360) % 360;
      });
      catat('putar_item', `${sel.length}×${d}°`);
      break;
    }
    case 'dup': {
      if (!sel.length) return toast(t('nothing_selected'));
      const g = sel.some((x) => x.group) ? uid('g') : null;
      const copies = sel.map((it) => ({ ...clone(it), uid: uid('i'), x: it.x + 600, z: it.z + 600, group: it.group ? g : null }));
      p.items.push(...copies);
      touch(p); catat('gandakan_item', sel.length);
      R3.rebuild(); R3.setSelection(copies.map((x) => x.uid)); refreshPanels(p);
      return;
    }
    case 'del':
      if (!sel.length) return toast(t('nothing_selected'));
      p.items = p.items.filter((x) => !sel.includes(x));
      catat('hapus_item', sel.map((x) => x.pid).join('+'));
      break;
    case 'group': {
      if (sel.length < 2) return toast(LANG === 'id' ? 'Pilih minimal 2 item' : 'Select at least 2 items');
      const g = uid('g'); sel.forEach((x) => { x.group = g; }); catat('grup_item', sel.length); toast(`${t('t_group')} ✓`);
      break;
    }
    case 'ungroup': sel.forEach((x) => { x.group = null; }); catat('lepas_grup', sel.length); break;
    case 'multi': S.ui.multi = !S.ui.multi; save(); $('[data-act="multi"]').classList.toggle('aktif', S.ui.multi); return;
    case 'grid': S.ui.grid = !S.ui.grid; save(); $('[data-act="grid"]').classList.toggle('aktif', S.ui.grid); return;
    case 'top': R3 && R3.setView('top'); return;
    case '3d': R3 && R3.setView('3d'); return;
    case 'shot': {
      if (!R3 || !R3.ready) return;
      download(`robries-layout-${p.name.replace(/\W+/g, '-')}.png`, dataURLtoBlob(R3.screenshot()));
      catat('screenshot', p.name);
      return;
    }
    default: return;
  }
  touch(p);
  if (R3 && R3.ready) { R3.rebuild(); R3.setSelection(p.items.filter((x) => sel.includes(x)).map((x) => x.uid)); }
  refreshPanels(p);
}
function dataURLtoBlob(d) {
  const [h, b] = d.split(',');
  const bin = atob(b);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: h.split(':')[1].split(';')[0] });
}
function saveThumb(p) {
  if (!window.R3D || !window.R3D.ready || !$('#kanvas')) return;
  try {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const w = 720; c.width = w; c.height = Math.round((img.height / img.width) * w);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      p.thumb = c.toDataURL('image/jpeg', 0.72); save();
    };
    img.src = window.R3D.screenshot();
  } catch (e) { /* abaikan */ }
}

function showWarnings(p, info) {
  const el = $('#peringatan');
  if (!el || !info) return;
  const name = (u) => { const it = p.items.find((x) => x.uid === u); return it ? PMAP[it.pid].name : '?'; };
  const msgs = [];
  const seen = new Set();
  info.warnings.slice(0, 4).forEach((w) => {
    if (w.type === 'overlap') msgs.push(`⚠ ${t('collision')}: ${esc(name(w.a))} ↔ ${esc(name(w.b))}`);
    else msgs.push(`⚠ ${esc(name(w.a))} ${LANG === 'id' ? 'di luar ruang' : 'is outside the room'}`);
    seen.add(w.a);
  });
  if (info.warnings.length > 4) msgs.push(`+${info.warnings.length - 4}`);
  if (info.clearance) {
    const c = info.clearance;
    const low = c.dist < 600;
    msgs.push(`<span class="${low ? 'warn' : 'ok'}">↔ ${t('clearance')}: ${c.dist} mm ${t('nearest')} ${c.to === 'wall' ? (LANG === 'id' ? 'dinding' : 'wall') : esc(name(c.to))}${low ? (LANG === 'id' ? ' · < 600 mm jalur sirkulasi' : ' · < 600 mm walkway') : ''}</span>`);
  }
  el.innerHTML = msgs.join(' ');
  const n = info.warnings.length;
  if (n && n !== showWarnings.last) catat('peringatan_tabrakan', n);
  showWarnings.last = n;
}

function rangeText([a, b]) {
  return b < 14 ? `${a}–${b} ${t('days')}` : `${weeks(a)}–${weeks(b)} ${t('weeks')}`;
}

// --- Panel spesifikasi ---
function renderSpec(p, uids) {
  const box = $('#panel-spes');
  if (!box) return;
  const sel = p.items.filter((x) => uids.includes(x.uid));
  if (!sel.length) {
    box.innerHTML = `<h3>${t('spec_panel')}</h3><p class="redup kecil-teks">${t('nothing_selected')} ${t('cfg_select_hint')}</p>`;
    return;
  }
  const it = sel[0];
  const pr = PMAP[it.pid];
  const multi = sel.length > 1;
  const state = itemCustomState(it);
  const d = itemDims(it);
  const mats = productMats(pr);
  const sameCat = PRODUCTS.filter((x) => x.cat === pr.cat || (['stool', 'chair'].includes(pr.cat) && ['stool', 'chair'].includes(x.cat)));
  box.innerHTML = `
    <h3>${t('spec_panel')} ${multi ? `<span class="chip">${sel.length} ${t('items')}</span>` : ''}</h3>
    <div class="spes-kepala">${productThumb(pr, it.color)}<div><strong>${esc(pr.name)}</strong><br><span class="kecil-teks redup">${esc(catLabel(pr.cat))}${it.group ? ' · grouped' : ''}</span></div></div>
    ${state !== 'standard' ? `<p class="bendera ${state}">${state === 'review' ? '⚑ ' + t('custom_flag') : '✎ ' + t('custom') + ' · formula pricing'}</p>` : ''}
    <label>${t('replace_with')}<select id="sp-ganti">${sameCat.map((x) => `<option value="${x.id}" ${x.id === it.pid ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
    ${multi ? '' : `
    <p class="label">${t('size')}</p>
    <div class="segmented kecil"><button type="button" class="seg2 ${it.size !== 'custom' ? 'aktif' : ''}" data-size="standard">${t('standard')}</button><button type="button" class="seg2 ${it.size === 'custom' ? 'aktif' : ''}" data-size="custom">${t('custom')}</button></div>
    ${it.size === 'custom' ? `<div class="tiga">${['L', 'W', 'H'].map((k, i) => `<label>${k} mm<input type="number" data-dim="${i}" value="${d[i]}" step="10"></label>`).join('')}</div>
      <p class="kecil-teks redup">${LANG === 'id' ? 'Rentang standar' : 'Allowed range'}: ${dimsText(pr.minDims)} – ${dimsText(pr.maxDims)}. ${LANG === 'id' ? 'Di luar rentang tetap boleh, akan ditandai untuk Sales.' : 'Outside the range is allowed and will be flagged for Sales.'}</p>` : `<p class="kecil-teks">${dimsText(pr.dims)}</p>`}`}
    <label>${t('material')}<select id="sp-mat">${mats.map((m) => `<option value="${m}" ${it.mat === m ? 'selected' : ''}>${MATERIALS.find((x) => x.id === m).name}</option>`).join('')}</select></label>
    <p class="label">${t('color')}: <strong id="sp-warna-nama">${CMAP[it.color].name}</strong></p>
    <div class="swatch-pilih">${COLORS.filter((c) => c.type.toLowerCase() === it.mat).map((c) => `<button type="button" class="sw-btn ${c.id === it.color ? 'aktif' : ''}" data-sc="${c.id}" title="${c.name}${c.group === 'special' ? ' · special' : ''}">${swatch(c)}${c.group === 'special' ? '<i>+</i>' : ''}</button>`).join('')}</div>
    <label>${t('finish')}<select id="sp-fin">${FINISHES.map((f) => `<option value="${f.id}" ${it.finish === f.id ? 'selected' : ''}>${esc(L(f))} ${R.finishes[f.id].pct ? `(+${R.finishes[f.id].pct}%)` : ''}</option>`).join('')}</select></label>
    <p class="label">${t('addons')}</p>
    <div class="cek">${ADDONS.map((a) => `<label><input type="checkbox" data-addon="${a.id}" ${(it.addons || []).includes(a.id) ? 'checked' : ''}> ${esc(L(a))}</label>`).join('')}</div>
    ${liveMode() ? `<p class="harga">${t('unit')}: ${money(itemUnitPrice(it, R))}</p>` : ''}
    <details class="massal" ${multi ? 'open' : ''}><summary>${t('bulk_title')}</summary>
      <p class="kecil-teks redup">${LANG === 'id' ? 'Terapkan material, warna, dan finishing item ini ke:' : 'Apply this item’s material, colour and finish to:'}</p>
      <div class="baris-tombol"><button type="button" class="kecil sekunder" data-bulk="sel">${t('bulk_selected')}</button><button type="button" class="kecil sekunder" data-bulk="type">${t('bulk_type')}</button><button type="button" class="kecil sekunder" data-bulk="all">${t('bulk_all')}</button></div>
    </details>`;

  const after = (ev, detail, rebuild = true) => {
    touch(p); catat(ev, detail);
    if (rebuild && window.R3D && window.R3D.ready) { window.R3D.rebuild(); }
    refreshPanels(p);
    renderSpec(p, sel.map((x) => x.uid).filter((u) => p.items.some((x) => x.uid === u)));
  };
  $('#sp-ganti').addEventListener('change', (e) => { sel.forEach((x) => { x.pid = e.target.value; x.size = 'standard'; x.dims = null; if (!productMats(PMAP[x.pid]).includes(x.mat)) { x.mat = 'hdpe'; x.color = 'damson'; } }); after('ganti_item', e.target.value); });
  $$('[data-size]', box).forEach((b) => b.addEventListener('click', () => { it.size = b.dataset.size; if (it.size === 'custom' && !it.dims) it.dims = pr.dims.slice(); after('ubah_spesifikasi', `${it.pid}:size=${it.size}`); }));
  $$('[data-dim]', box).forEach((inp) => inp.addEventListener('change', () => { it.dims[Number(inp.dataset.dim)] = Math.max(5, Number(inp.value) || 0); after('ubah_spesifikasi', `${it.pid}:dims=${it.dims.join('x')}:${itemCustomState(it)}`); }));
  $('#sp-mat').addEventListener('change', (e) => { sel.forEach((x) => { x.mat = e.target.value; if (CMAP[x.color].type.toLowerCase() !== x.mat) x.color = COLORS.find((c) => c.type.toLowerCase() === x.mat).id; }); after('ubah_spesifikasi', `material=${e.target.value}`); });
  $$('[data-sc]', box).forEach((b) => b.addEventListener('click', () => { sel.forEach((x) => { x.color = b.dataset.sc; x.mat = CMAP[x.color].type.toLowerCase(); }); after('ubah_spesifikasi', `color=${b.dataset.sc}`); }));
  $('#sp-fin').addEventListener('change', (e) => { sel.forEach((x) => { x.finish = e.target.value; }); after('ubah_spesifikasi', `finish=${e.target.value}`, false); });
  $$('[data-addon]', box).forEach((c) => c.addEventListener('change', () => { sel.forEach((x) => { x.addons = x.addons || []; x.addons = c.checked ? [...new Set([...x.addons, c.dataset.addon])] : x.addons.filter((a) => a !== c.dataset.addon); }); after('ubah_spesifikasi', `addon=${c.dataset.addon}:${c.checked}`, false); }));
  $$('[data-bulk]', box).forEach((b) => b.addEventListener('click', () => {
    const scope = b.dataset.bulk;
    const target = scope === 'sel' ? sel : scope === 'type' ? p.items.filter((x) => x.pid === it.pid) : p.items;
    target.forEach((x) => { if (productMats(PMAP[x.pid]).includes(it.mat)) { x.mat = it.mat; x.color = it.color; } x.finish = it.finish; });
    after('edit_massal', `${scope}:${target.length}:${it.color}/${it.finish}`);
    toast(`${target.length} ${t('items')} ✓`);
  }));
}

// --- BoQ + estimasi + konversi ---
function refreshPanels(p) {
  const est = estimate(p, R);
  lastEst = est;
  renderBoQ(p, est);
  renderEstimate(p, est);
  renderConvert(p, est);
}

function specText(it) {
  const st = itemCustomState(it);
  return `${CMAP[it.color].name} ${it.mat.toUpperCase()} · ${L(FINISHES.find((f) => f.id === it.finish))}${st !== 'standard' ? ' · ' + dimsText(itemDims(it)) : ''}${(it.addons || []).length ? ' · +' + it.addons.join(', ') : ''}`;
}
function renderBoQ(p, est) {
  const box = $('#panel-boq');
  if (!box) return;
  const live = liveMode();
  if (!est.boq.length) { box.innerHTML = `<h3>${t('boq')}</h3><p class="redup kecil-teks">${t('empty_boq')}</p>`; return; }
  box.innerHTML = `<h3>${t('boq')} <span class="redup kecil-teks">${est.units} ${t('items')}</span></h3>
    <div class="tabel-scroll"><table class="tabel boq">
      <thead><tr><th>${t('qty')}</th><th>${t('spec')}</th><th class="kanan">${t('subtotal')}</th></tr></thead>
      <tbody>${est.boq.map((r) => `<tr class="${r.state}"><td>${r.qty}×</td><td><strong>${esc(PMAP[r.it.pid].name)}</strong>${swatch(CMAP[r.it.color], 'mini')}<br><span class="kecil-teks redup">${esc(specText(r.it))}${live ? ` · @ ${money(r.unit)}` : ''}</span>${r.state === 'review' ? `<br><span class="bendera review">⚑ ${t('custom_flag')}</span>` : ''}</td>
        <td class="kanan">${live ? money(r.sub) : '—'}</td></tr>`).join('')}</tbody>
    </table></div>`;
}

function renderEstimate(p, est) {
  const box = $('#panel-est');
  if (!box) return;
  const live = liveMode();
  const ctx = p.ctx;
  const ro = readOnly;
  const ctxHTML = ro ? `<p class="kecil-teks">${countryLabel(ctx.country)} · ${ctx.country === 'ID' ? R.domesticZones[ctx.zone].en : ctx.incoterm}</p>` : `
    <div class="dua">
      <label>${t('destination')}<select id="e-country">${COUNTRIES.map((c) => `<option value="${c.id}" ${ctx.country === c.id ? 'selected' : ''}>${esc(L(c))}</option>`).join('')}</select></label>
      ${ctx.country === 'ID'
        ? `<label>${t('zone')}<select id="e-zone">${Object.entries(R.domesticZones).map(([k, z]) => `<option value="${k}" ${ctx.zone === k ? 'selected' : ''}>${esc(z.en)}</option>`).join('')}</select></label>`
        : `<label>${t('incoterm')}<select id="e-inco">${['FOB', 'CIF', 'DDP'].map((x) => `<option ${ctx.incoterm === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>`}
      <label>${t('currency')}<select id="e-cur">${CURRENCIES.map((c) => `<option ${S.cur === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label>${t('pricelist')}<select id="e-list">${Object.keys(R.priceLists).filter(canSeeList).map((k) => `<option value="${k}" ${ctx.priceList === k ? 'selected' : ''}>${k}${R.priceLists[k] ? ` (−${R.priceLists[k]}%)` : ''}</option>`).join('')}</select></label>
      <label class="span2">${t('segment')}<select id="e-seg">${CUSTOMER_SEGMENTS.map((s) => `<option value="${s.id}" ${ctx.segment === s.id ? 'selected' : ''}>${esc(L(s))}</option>`).join('')}</select></label>
    </div>`;

  // Kondisi A: estimasi hanya setelah diminta
  let shown = est;
  let stale = false;
  if (!live) {
    if (!estSnapshot || estSnapshot.pid !== p.id) shown = null;
    else { shown = estSnapshot.est; stale = estSnapshot.sig !== estSig(p); }
  }
  const body = !est.units ? `<p class="redup kecil-teks">${t('empty_boq')}</p>` : !shown ? `<p class="kecil-teks">${t('est_hidden')}</p><button type="button" class="primer lebar" id="hitung">${t('get_estimate')}</button>` : estimateBody(p, shown, stale);
  box.innerHTML = `<h3>${t('est_title')} <span class="label-est">${t('est_label')}</span></h3>${ctxHTML}${body}`;
  if (!ro) {
    const upd = (k, v) => { ctx[k] = v; touch(p); catat('ubah_tujuan', `${k}=${v}`); refreshPanels(p); };
    $('#e-country').addEventListener('change', (e) => { ctx.country = e.target.value; if (ctx.country !== 'ID' && !['FOB', 'CIF', 'DDP'].includes(ctx.incoterm)) ctx.incoterm = 'CIF'; upd('country', ctx.country); });
    const z = $('#e-zone'); if (z) z.addEventListener('change', (e) => upd('zone', e.target.value));
    const inc = $('#e-inco'); if (inc) inc.addEventListener('change', (e) => upd('incoterm', e.target.value));
    $('#e-cur').addEventListener('change', (e) => { S.cur = e.target.value; save(); catat('ubah_mata_uang', S.cur); render(); });
    $('#e-list').addEventListener('change', (e) => upd('priceList', e.target.value));
    $('#e-seg').addEventListener('change', (e) => upd('segment', e.target.value));
  }
  const h = $('#hitung');
  if (h) h.addEventListener('click', () => requestEstimate(p));
  const rh = $('#hitung-ulang');
  if (rh) rh.addEventListener('click', () => requestEstimate(p));
  const bd = $('#rincian');
  if (bd) bd.addEventListener('toggle', () => { breakdownOpen = bd.open; if (bd.open) catat('buka_rincian', money(shown.total)); });
}
function estSig(p) { return JSON.stringify([p.items, p.ctx, p.override, S.cur]); }
function requestEstimate(p) {
  estSnapshot = { pid: p.id, sig: estSig(p), est: estimate(p, R) };
  catat('hitung_estimasi', money(estSnapshot.est.total));
  refreshPanels(p);
}

function estimateBody(p, est, stale) {
  const ld = est.lead;
  const row = (k, v, cls = '') => v ? `<tr class="${cls}"><th>${k}</th><td class="kanan">${money(v)}</td></tr>` : '';
  const ctry = COUNTRIES.find((c) => c.id === p.ctx.country);
  const dest = p.ctx.country === 'ID' ? R.domesticZones[p.ctx.zone].en : (R.export[p.ctx.country] || {}).port;
  const start = new Date();
  const addD = (d) => new Date(start.getTime() + d * 864e5);
  const dfmt = (d) => d.toLocaleDateString(LANG === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short' });
  const tl = ld ? [
    [t('tl_deposit'), 0, 0], [t('tl_prod'), 1, ld.prod], [t('tl_qc'), ld.prod, ld.prod + ld.qc], [t('tl_ship'), ld.shipMin, ld.shipMin + est.transit[1]], [t('tl_arrive'), ld.shipMin + est.transit[0], ld.shipMax + est.transit[1]],
  ] : [];
  const span = ld ? ld.shipMax + est.transit[1] : 1;
  if (!est.units) return '';
  return `
    ${stale ? `<p class="bendera custom">↻ ${t('est_stale')} <button type="button" class="kecil primer" id="hitung-ulang">${t('get_estimate')}</button></p>` : ''}
    <div class="total-est"><span>${t('total')}</span><strong>${money(est.total)}</strong>
      <small>${t('est_label')} · ${t('valid_until')} ${est.valid.toLocaleDateString(LANG === 'id' ? 'id-ID' : 'en-GB')} · ${esc(est.shipNote)}</small></div>
    <details id="rincian" ${breakdownOpen ? 'open' : ''}><summary>${t('breakdown')}</summary>
      <table class="tabel rincian">
        ${row(t('goods'), est.goods)}
        ${est.qtyDisc ? `<tr><th>${t('disc_qty')}</th><td class="kanan">−${money(est.qtyDisc)}</td></tr>` : ''}
        ${est.listDisc ? `<tr><th>${t('disc_list')} (${p.ctx.priceList} −${est.listPct}%)</th><td class="kanan">−${money(est.listDisc)}</td></tr>` : ''}
        ${row(t('packaging'), est.packaging)}
        ${row(`${t('shipping')} (${Math.round(est.kgShip)} kg)`, est.shipping)}
        ${row(t('insurance'), est.insurance)}
        ${row(t('duty') + ' + clearance', est.duty)}
        ${row(p.ctx.country === 'ID' ? `PPN ${R.taxPPN}%` : `${t('tax')} (VAT/GST)`, est.tax)}
        ${est.override ? `<tr><th>${t('override')} (−${est.overridePct}%)</th><td class="kanan">${money(est.override)}</td></tr>` : ''}
        <tr class="total"><th>${t('total')}</th><td class="kanan">${money(est.total)}</td></tr>
      </table>
      <p class="kecil-teks redup">${LANG === 'id' ? 'Kurs dari tabel admin (bukan kurs live)' : 'FX from admin table (not live)'}: 1 ${S.cur} = IDR ${R.fx[S.cur].toLocaleString()}. ${p.ctx.country !== 'ID' ? (LANG === 'id' ? 'Ekspor: PPN 0%.' : 'Export: 0% Indonesian VAT.') : ''}</p>
    </details>
    ${ld ? `<div class="lead-box">
      <h4>${t('lead_title')}</h4>
      <p><strong>${weeks(ld.shipMin)}–${weeks(ld.shipMax)} ${t('weeks')}</strong> ${t('to_ship')}, ~${rangeText(est.transit)} ${t('transit_to')} ${esc(dest || ctry.en)}</p>
      <div class="timeline" aria-label="${t('timeline')}">${tl.map(([n, a, b], i) => `<div class="tl-bar tl${i}" style="left:${(a / span) * 100}%;width:${Math.max(3, ((b - a) / span) * 100)}%"><span>${n}</span></div>`).join('')}</div>
      <p class="kecil-teks redup">${t('tl_deposit')} ${dfmt(start)} → ${t('tl_arrive')} ${dfmt(addD(ld.shipMin + est.transit[0]))}–${dfmt(addD(ld.shipMax + est.transit[1]))} · ${LANG === 'id' ? 'beban pabrik' : 'factory load'} ${R.productionLoad}% · ${LANG === 'id' ? 'item terlama' : 'longest item'} ${ld.maxItem} ${t('days')}</p>
    </div>` : ''}
    <div class="sus-box">
      <span class="sus-angka">${est.recycledKg.toFixed(1)}</span>
      <span>${t('sus_kg')}<br><small>${t('sus_caps')} ${Math.round(est.recycledKg * 400).toLocaleString()}</small></span>
    </div>`;
}

function renderConvert(p, est) {
  const box = $('#panel-konversi');
  if (!box) return;
  if (!est.units) { box.innerHTML = ''; return; }
  const usd = est.total / R.fx.USD;
  const blockCustom = est.hasCustom;
  const blockValue = usd >= R.checkoutThresholdUSD;
  const canCheckout = !blockCustom && !blockValue;
  const route = routeLead(p.ctx.country, p.ctx.segment);
  box.innerHTML = `<h3>${t('convert_title')}</h3>
    ${canCheckout ? '' : `<p class="kecil-teks bendera review">${blockCustom ? t('checkout_blocked_custom') : t('checkout_blocked_value')} (${LANG === 'id' ? 'batas' : 'limit'} USD ${R.checkoutThresholdUSD.toLocaleString()})</p>`}
    <div class="konversi">
      <button type="button" class="${canCheckout ? 'primer' : 'sekunder'} lebar" id="ke-checkout" ${canCheckout ? '' : 'disabled'}>${t('checkout')}</button>
      <button type="button" class="${canCheckout ? 'sekunder' : 'primer'} lebar" id="ke-sales">${t('send_sales')}</button>
    </div>
    <p class="kecil-teks redup">${t('route_to')}: <strong>${esc(route.name)}</strong></p>`;
  $('#ke-checkout').addEventListener('click', () => { saveThumb(p); coStep = 0; catat('checkout_mulai', money(est.total)); go('#/checkout'); });
  $('#ke-sales').addEventListener('click', () => { saveThumb(p); catat('konsultasi_mulai', route.name); go('#/consult'); });
}

// --- Modal ---
function modal(html, onBind) {
  const m = $('#modal');
  m.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><button type="button" class="ikon tutup-modal" aria-label="Close">✕</button>${html}</div>`;
  m.hidden = false;
  const close = () => { m.hidden = true; m.innerHTML = ''; };
  $('.tutup-modal', m).addEventListener('click', close);
  m.onclick = (e) => { if (e.target === m) close(); };
  if (onBind) onBind(m, close);
}
function versionsModal(p) {
  modal(`<h2>${t('versions')}</h2>${p.versions.length ? `<ul class="daftar">${p.versions.map((v, i) => `<li><span><strong>${esc(v.name)}</strong> · ${new Date(v.t).toLocaleString()} · ${v.items.length} ${t('items')}</span><button type="button" class="kecil sekunder" data-v="${i}">${t('restore')}</button></li>`).join('')}</ul>` : `<p>${t('no_data')}</p>`}`, (m, close) => {
    $$('[data-v]', m).forEach((b) => b.addEventListener('click', () => {
      const v = p.versions[Number(b.dataset.v)];
      p.items = clone(v.items); p.room = v.room.slice(); touch(p); catat('pulihkan_versi', v.name); close(); render();
    }));
  });
}
function emailModal(p) {
  const link = `${baseURL()}#/resume/${encodeProject(p)}`;
  modal(`<h2>${t('save_email')}</h2>
    <p class="kecil-teks">${LANG === 'id' ? 'Simpan sebagai tamu: kami membuat tautan berisi proyek Anda. Buka di perangkat mana pun untuk melanjutkan. (Simulasi — email dibuka di aplikasi email Anda, tidak dikirim server.)' : 'Save as guest: we create a link that contains your project. Open it on any device to continue. (Simulated — opens your own email app; no server sends it.)'}</p>
    <label>Email<input type="email" id="em" value="${esc(p.email || '')}" placeholder="you@company.com"></label>
    <label>Link<textarea readonly rows="3" id="em-link">${esc(link)}</textarea></label>
    <div class="baris-tombol"><button type="button" class="primer" id="em-kirim">✉ ${LANG === 'id' ? 'Buka email' : 'Open email'}</button><button type="button" class="sekunder" id="em-salin">${LANG === 'id' ? 'Salin tautan' : 'Copy link'}</button></div>`, (m) => {
    $('#em-kirim', m).addEventListener('click', () => {
      p.email = $('#em', m).value; touch(p); catat('simpan_email', 'guest-link');
      location.href = `mailto:${encodeURIComponent(p.email)}?subject=${encodeURIComponent('ROBRIES project: ' + p.name)}&body=${encodeURIComponent('Continue your ROBRIES layout here:\n' + link)}`;
    });
    $('#em-salin', m).addEventListener('click', () => { copy(link); catat('simpan_email', 'copy-link'); });
  });
}
function shareModal(p) {
  const link = `${baseURL()}#/view/${encodeProject(p)}`;
  catat('bagikan_tautan', p.name);
  modal(`<h2>${t('share')}</h2>
    <p class="kecil-teks">${LANG === 'id' ? 'Untuk klien atau atasan Anda. Mereka bisa melihat layout 3D, BoQ, dan estimasi tanpa bisa mengubah.' : 'For your client or boss. They can view the 3D layout, BoQ and estimate without editing.'}</p>
    <textarea readonly rows="4">${esc(link)}</textarea>
    <div class="baris-tombol"><button type="button" class="primer" id="sh-salin">${LANG === 'id' ? 'Salin' : 'Copy'}</button><a class="sekunder" href="${esc(link)}" target="_blank" rel="noopener">${t('open')} ↗</a></div>`, (m) => {
    $('#sh-salin', m).addEventListener('click', () => copy(link));
  });
}
function copy(s) {
  (navigator.clipboard ? navigator.clipboard.writeText(s) : Promise.reject()).then(() => toast('Copied ✓')).catch(() => toast('Select the text and copy'));
}

// --- Cetak / PDF ---
function printHTML(html) {
  $('#cetak').innerHTML = html;
  document.body.classList.add('mencetak');
  setTimeout(() => { window.print(); document.body.classList.remove('mencetak'); }, 350);
}
function sheetHeader(title, sub) {
  return `<header class="ps-head"><div class="logo">R<span class="logo-o">O</span>BRIES</div><div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div></header>`;
}
function boqTableHTML(est) {
  return `<table class="tabel"><thead><tr><th>${t('qty')}</th><th>${t('spec')}</th><th>${t('unit')}</th><th>${t('subtotal')}</th></tr></thead><tbody>
    ${est.boq.map((r) => `<tr><td>${r.qty}</td><td>${esc(PMAP[r.it.pid].name)} — ${esc(specText(r.it))}${r.state === 'review' ? ' ⚑ ' + t('custom_flag') : ''}</td><td>${money(r.unit)}</td><td>${money(r.sub)}</td></tr>`).join('')}</tbody></table>`;
}
function breakdownHTML(p, est) {
  const r = (k, v) => v ? `<tr><th>${k}</th><td>${money(v)}</td></tr>` : '';
  return `<table class="tabel">${r(t('goods'), est.goods)}${est.qtyDisc ? `<tr><th>${t('disc_qty')}</th><td>−${money(est.qtyDisc)}</td></tr>` : ''}${est.listDisc ? `<tr><th>${t('disc_list')}</th><td>−${money(est.listDisc)}</td></tr>` : ''}${r(t('packaging'), est.packaging)}${r(t('shipping'), est.shipping)}${r(t('insurance'), est.insurance)}${r(t('duty'), est.duty)}${r(t('tax'), est.tax)}${est.override ? `<tr><th>${t('override')}</th><td>${money(est.override)}</td></tr>` : ''}<tr class="total"><th>${t('total')} (${t('est_label')})</th><td>${money(est.total)}</td></tr></table>`;
}
function printProjectSheet(p) {
  const est = estimate(p, R);
  const img = window.R3D && window.R3D.ready && $('#kanvas') ? window.R3D.screenshot() : p.thumb;
  const ld = est.lead;
  printHTML(`${sheetHeader(t('export_pdf'), `${p.name} · ${new Date().toLocaleDateString()} · ${t('valid_until')} ${est.valid.toLocaleDateString()}`)}
    ${img ? `<img class="ps-img" src="${img}" alt="Layout">` : ''}
    <p>${LANG === 'id' ? 'Ruang' : 'Room'}: ${p.room.join(' × ')} mm · ${countryLabel(p.ctx.country)} · ${est.shipNote}</p>
    <h2>${t('boq')}</h2>${boqTableHTML(est)}
    <h2>${t('est_title')}</h2>${breakdownHTML(p, est)}
    ${ld ? `<p><strong>${t('lead_title')}:</strong> ${weeks(ld.shipMin)}–${weeks(ld.shipMax)} ${t('weeks')} ${t('to_ship')}, ~${rangeText(est.transit)} transit.</p>` : ''}
    <p class="ps-sus">♲ ${est.recycledKg.toFixed(1)} ${t('sus_kg')}</p>
    <p class="kecil-teks">${t('variation_text')} ${LANG === 'id' ? 'Ini adalah estimasi, bukan penawaran resmi.' : 'This is an estimate, not an official quote.'}</p>`);
}
function printSpec(p) {
  printHTML(`${sheetHeader(p.name, `${catLabel(p.cat)} · Spec sheet`)}
    ${p.img ? `<img class="ps-img kecil" src="${p.img}" alt="">` : ''}
    <p>${esc(L(p))}</p>
    <table class="tabel"><tr><th>${t('dims')}</th><td>${dimsText(p.dims)}</td></tr><tr><th>${t('weight')}</th><td>${(p.w / 1000).toFixed(1)} kg</td></tr><tr><th>${t('recycled')}</th><td>${(p.g / 1000).toFixed(2)} kg</td></tr>
    <tr><th>${t('material')}</th><td>${productMats(p).join(' / ').toUpperCase()}</td></tr><tr><th>${t('spec_load')}</th><td>${p.specs.load}</td></tr><tr><th>${t('spec_uv')}</th><td>${p.specs.uv}</td></tr><tr><th>${t('spec_fire')}</th><td>${p.specs.fire}</td></tr>
    <tr><th>Retail price</th><td>${hargaTampil() ? money(R.prices[p.id]) : t('price_on_request')}</td></tr></table>
    <h2>${t('main_colors')} / ${t('special_colors')}</h2><p>${COLORS.map((c) => `${c.name} (${c.type}${c.group === 'special' ? ', special' : ''})`).join(', ')}</p>
    <p class="kecil-teks">${t('variation_text')}</p>`);
}

// ========== KERANJANG ==========
function cartCtx() {
  if (!S.cart.ctx) S.cart.ctx = defaultCtx();
  return S.cart.ctx;
}
function addToCart(pid, color, finish, qty = 1) {
  const p = PMAP[pid];
  const c = color || (p.io === 'outdoor' ? 'seaweed' : 'damson');
  const mat = CMAP[c].type === 'LDPE' ? 'ldpe' : 'hdpe';
  const fin = finish || (p.io === 'outdoor' ? 'uv' : 'matte');
  const ex = S.cart.lines.find((l) => l.pid === pid && l.color === c && l.finish === fin);
  if (ex) ex.qty += qty; else S.cart.lines.push({ id: uid('c'), pid, color: c, mat, finish: fin, qty });
  cartCtx(); save();
  catat('tambah_keranjang', `${pid}:${c}:${fin}:x${qty}`);
  toast(`${p.name} ×${qty} ${t('added_cart')}`);
  render();
}
// Keranjang diubah menjadi "proyek" sementara agar mesin estimasi & Sales bisa memakainya.
function cartProject() {
  const units = [];
  S.cart.lines.forEach((l) => { for (let i = 0; i < l.qty; i++) units.push(l); });
  const cols = Math.max(1, Math.ceil(Math.sqrt(units.length)));
  const step = 1300;
  const L = Math.max(3000, cols * step + 400), W = Math.max(3000, Math.ceil(units.length / cols) * step + 400);
  return {
    id: 'CART', name: LANG === 'id' ? `Pesanan katalog ${new Date().toLocaleDateString('id-ID')}` : `Catalogue order ${new Date().toLocaleDateString('en-GB')}`,
    room: [L, W, 3000], ctx: cartCtx(), override: { pct: 0 }, notes: S.cart.notes || '', files: [], versions: [], status: 'cart', email: '',
    items: units.map((l, i) => ({ uid: 'u' + i, pid: l.pid, x: 200 + step / 2 + (i % cols) * step, z: 200 + step / 2 + Math.floor(i / cols) * step, rot: 0, size: 'standard', dims: null, color: l.color, mat: l.mat, finish: l.finish, addons: [], group: null })),
  };
}
function sourceFor(arg) { return arg === 'cart' ? cartProject() : cur(); }

VIEWS.cart = (app) => {
  const lines = S.cart.lines;
  const showP = hargaTampil();
  const p = cartProject();
  const est = estimate(p, R);
  const ctx = p.ctx;
  const title = kondisi === 'A' && !showP ? t('quote_cart') : t('cart');
  if (!lines.length) {
    app.innerHTML = `<section class="kepala-halaman"><h1>${title}</h1><p>${t('cart_empty')}</p><div class="cta-baris"><a class="primer" href="#/catalog">${t('continue_shopping')}</a><a class="sekunder" href="#/configure">${t('cta_configure')}</a></div></section>`;
    return;
  }
  const usd = est.total / R.fx.USD;
  const canCheckout = showP && usd < R.checkoutThresholdUSD;
  app.innerHTML = `<section class="kepala-halaman"><h1>${title}</h1></section>
  <div class="keranjang">
    <div class="kotak">
      ${lines.map((l) => {
        const pr = PMAP[l.pid];
        const unit = itemUnitPrice({ pid: l.pid, size: 'standard', mat: l.mat, color: l.color, finish: l.finish, addons: [] }, R);
        return `<div class="baris-keranjang">
          <a href="#/product/${pr.id}">${productThumb(pr, l.color)}</a>
          <div><strong>${esc(pr.name)}</strong> ${swatch(CMAP[l.color], 'mini')}<br><span class="kecil-teks redup">${dimsText(pr.dims)}${showP ? ` · @ ${money(unit)}` : ''}</span>
            <div class="kontrol">
              <select data-l="${l.id}" data-k="color" aria-label="${t('color')}">${COLORS.filter((c) => productMats(pr).includes(c.type.toLowerCase())).map((c) => `<option value="${c.id}" ${c.id === l.color ? 'selected' : ''}>${c.name}${c.group === 'special' ? ' ★' : ''}</option>`).join('')}</select>
              <select data-l="${l.id}" data-k="finish" aria-label="${t('finish')}">${FINISHES.map((f) => `<option value="${f.id}" ${f.id === l.finish ? 'selected' : ''}>${esc(L(f))}</option>`).join('')}</select>
              <input type="number" min="1" max="500" value="${l.qty}" data-l="${l.id}" data-k="qty" aria-label="${t('qty_label')}">
              <button type="button" class="tautan" data-hapus="${l.id}">${t('remove')}</button>
            </div></div>
          <div class="kanan">${showP ? money(unit * l.qty) : ''}</div>
        </div>`;
      }).join('')}
      <p class="kecil-teks"><a href="#/catalog">← ${t('continue_shopping')}</a> · <a href="#/configure">${t('or_configure')}</a></p>
    </div>
    <aside class="kotak ringkas">
      <div class="dua">
        <label>${t('destination')}<select id="k-country">${COUNTRIES.map((c) => `<option value="${c.id}" ${ctx.country === c.id ? 'selected' : ''}>${esc(L(c))}</option>`).join('')}</select></label>
        ${ctx.country === 'ID'
          ? `<label>${t('zone')}<select id="k-zone">${Object.entries(R.domesticZones).map(([k, z]) => `<option value="${k}" ${ctx.zone === k ? 'selected' : ''}>${esc(z.en)}</option>`).join('')}</select></label>`
          : `<label>${t('incoterm')}<select id="k-inco">${['FOB', 'CIF', 'DDP'].map((x) => `<option ${ctx.incoterm === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>`}
        <label class="span2">${t('segment')}<select id="k-seg">${CUSTOMER_SEGMENTS.map((s) => `<option value="${s.id}" ${ctx.segment === s.id ? 'selected' : ''}>${esc(L(s))}</option>`).join('')}</select></label>
      </div>
      ${showP ? estimateBody(p, est, false) : `<p class="kecil-teks">${t('quote_cart_note')}</p><p class="kecil-teks">${est.units} ${t('items')}</p>`}
      ${showP && !canCheckout ? `<p class="kecil-teks bendera review">${t('checkout_blocked_value')} (${LANG === 'id' ? 'batas' : 'limit'} USD ${R.checkoutThresholdUSD.toLocaleString()})</p>` : ''}
      <div class="konversi">
        ${showP ? `<button type="button" class="${canCheckout ? 'primer' : 'sekunder'} lebar" id="k-checkout" ${canCheckout ? '' : 'disabled'}>${t('checkout')}</button>` : ''}
        <button type="button" class="${canCheckout ? 'sekunder' : 'primer'} lebar" id="k-sales">${showP ? t('send_sales') : t('request_quote')}</button>
      </div>
    </aside>
  </div>`;
  $$('[data-l]', app).forEach((el) => el.addEventListener('change', () => {
    const l = S.cart.lines.find((x) => x.id === el.dataset.l);
    if (el.dataset.k === 'qty') l.qty = Math.max(1, Math.min(500, Number(el.value) || 1));
    else if (el.dataset.k === 'color') { l.color = el.value; l.mat = CMAP[l.color].type === 'LDPE' ? 'ldpe' : 'hdpe'; } else l.finish = el.value;
    save(); catat('ubah_keranjang', `${l.pid}:${el.dataset.k}=${el.value}`); render();
  }));
  $$('[data-hapus]', app).forEach((b) => b.addEventListener('click', () => { const l = S.cart.lines.find((x) => x.id === b.dataset.hapus); S.cart.lines = S.cart.lines.filter((x) => x !== l); save(); catat('hapus_keranjang', l.pid); render(); }));
  const upd = (k, v) => { ctx[k] = v; save(); catat('ubah_tujuan', `cart:${k}=${v}`); render(); };
  $('#k-country').addEventListener('change', (e) => upd('country', e.target.value));
  const z = $('#k-zone'); if (z) z.addEventListener('change', (e) => upd('zone', e.target.value));
  const inc = $('#k-inco'); if (inc) inc.addEventListener('change', (e) => upd('incoterm', e.target.value));
  $('#k-seg').addEventListener('change', (e) => upd('segment', e.target.value));
  const bd = $('#rincian'); if (bd) bd.addEventListener('toggle', () => { breakdownOpen = bd.open; if (bd.open) catat('buka_rincian', 'cart'); });
  const ck = $('#k-checkout'); if (ck) ck.addEventListener('click', () => { coStep = 0; catat('checkout_mulai', `cart:${money(est.total)}`); go('#/checkout/cart'); });
  $('#k-sales').addEventListener('click', () => { catat('konsultasi_mulai', 'cart'); go('#/consult/cart'); });
};

// ========== POPUP NEGARA & MATA UANG ==========
const CUR_BY_COUNTRY = { ID: 'IDR', SG: 'SGD', JP: 'JPY', MY: 'USD', AU: 'USD', GB: 'EUR', US: 'USD' };
function localeModal(first) {
  let c = (S.locale && S.locale.country) || 'ID';
  let k = S.cur || CUR_BY_COUNTRY[c];
  modal(`<h2>${t('locale_title')}</h2><p class="kecil-teks">${t('locale_sub')}</p>
    <div class="lokasi-grid">${COUNTRIES.map((x) => `<label class="opsi-item"><input type="radio" name="lok" value="${x.id}" ${x.id === c ? 'checked' : ''}> ${esc(L(x))}</label>`).join('')}</div>
    <label>${t('currency')}<select id="lok-cur">${CURRENCIES.map((x) => `<option ${x === k ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
    <button type="button" class="primer lebar" id="lok-simpan">${t('locale_save')}</button>`, (m, close) => {
    $$('input[name="lok"]', m).forEach((r) => r.addEventListener('change', () => { c = r.value; $('#lok-cur', m).value = CUR_BY_COUNTRY[c]; }));
    const apply = () => {
      k = $('#lok-cur', m).value;
      S.locale = { country: c, cur: k }; S.cur = k;
      cartCtx().country = c;
      const pr = S.projects.find((x) => x.id === S.current);
      if (pr && !pr.items.length) pr.ctx.country = c;
      save(); catat(first ? 'pilih_negara_awal' : 'ubah_negara', `${c}:${k}`);
      close(); render();
    };
    $('#lok-simpan', m).addEventListener('click', apply);
    $('.tutup-modal', m).addEventListener('click', () => { if (!S.locale) { S.locale = { country: c, cur: S.cur }; save(); render(); } });
  });
}

// ========== CHECKOUT ==========
let coStep = 0;
let coData = { company: '', tax: '', billing: '', delivery: '', email: '', phone: '', pay: 'deposit', method: '' };
VIEWS.checkout = (app, arg) => {
  const p = sourceFor(arg);
  const backHref = arg === 'cart' ? '#/cart' : '#/configure';
  const consultHref = arg === 'cart' ? '#/consult/cart' : '#/consult';
  if (arg === 'cart' && kondisi === 'A' && !hargaTampil()) { go('#/consult/cart'); return; }
  const est = estimate(p, R);
  const usd = est.total / R.fx.USD;
  if (coStep !== 3 && (!est.units || est.hasCustom || usd >= R.checkoutThresholdUSD)) {
    app.innerHTML = `<section class="kepala-halaman"><h1>${t('checkout')}</h1><p>${est.units ? (est.hasCustom ? t('checkout_blocked_custom') : t('checkout_blocked_value')) : t('empty_boq')}</p><a class="primer" href="${consultHref}">${t('send_sales')}</a> <a class="sekunder" href="${backHref}">${t('back')}</a></section>`;
    return;
  }
  const steps = [t('co_cart'), t('co_company'), t('co_payment'), t('co_done')];
  const isID = p.ctx.country === 'ID';
  const methods = isID
    ? ['Midtrans · Virtual Account (BCA/Mandiri/BNI)', 'Midtrans · QRIS', 'Xendit · Credit/debit card', 'Bank transfer · Proforma invoice']
    : ['Stripe · Card', 'Bank transfer (SWIFT) · Proforma invoice'];
  if (!coData.method) coData.method = methods[0];
  const payAmt = coData.pay === 'deposit' ? (est.total * R.depositPct) / 100 : est.total;
  let body = '';
  if (coStep === 0) {
    body = `${boqTableHTML(est)}${breakdownHTML(p, est)}<p class="kecil-teks">${t('est_label')} · ${t('valid_until')} ${est.valid.toLocaleDateString()}</p>`;
  } else if (coStep === 1) {
    const f = (k, lab, type = 'text', req = true) => `<label>${lab}<input type="${type}" data-co="${k}" value="${esc(coData[k])}" ${req ? 'required' : ''}></label>`;
    body = `<form id="co-form" class="form-grid">${f('company', t('company_name'))}${f('tax', t('tax_id'), 'text', isID)}${f('email', t('contact_email'), 'email')}${f('phone', t('contact_phone'), 'tel')}
      <label class="span2">${t('billing')}<textarea data-co="billing" rows="2" required>${esc(coData.billing)}</textarea></label>
      <label class="span2">${t('delivery')}<textarea data-co="delivery" rows="2" required>${esc(coData.delivery)}</textarea></label></form>
      <p class="kecil-teks redup">${LANG === 'id' ? 'Gunakan data rekaan untuk uji coba.' : 'Use fictional data for testing.'}</p>`;
  } else if (coStep === 2) {
    body = `<p class="label">${t('pay_method')}</p>
      <div class="opsi">${methods.map((m) => `<label class="opsi-item"><input type="radio" name="met" value="${esc(m)}" ${coData.method === m ? 'checked' : ''}> ${esc(m)}</label>`).join('')}</div>
      <p class="label">${LANG === 'id' ? 'Skema pembayaran' : 'Payment terms'}</p>
      <div class="opsi">
        <label class="opsi-item"><input type="radio" name="pay" value="deposit" ${coData.pay === 'deposit' ? 'checked' : ''}> ${t('pay_deposit')} ${R.depositPct}% — ${money((est.total * R.depositPct) / 100)} <small>(${t('pay_balance')})</small></label>
        <label class="opsi-item"><input type="radio" name="pay" value="full" ${coData.pay === 'full' ? 'checked' : ''}> ${t('pay_full')} — ${money(est.total)}</label>
      </div>
      <p class="label-sim">${t('sim_payment')}</p>`;
  } else {
    const o = S.orders[0];
    body = `<div class="sukses"><h2>✓ ${t('order_conf')}</h2><p>${o ? `${o.id} · ${om(o.paid, o)} ${LANG === 'id' ? 'terbayar' : 'paid'} · ${t('est_arrival')}: ${schedText(o.schedule.delivered)}` : ''}</p>
      <div class="baris-tombol"><button type="button" class="sekunder" id="cetak-proforma">⬇ ${t('proforma')}</button><button type="button" class="sekunder" id="cetak-konf">⬇ ${t('order_conf')}</button><a class="primer" href="#/account">${t('my_orders')}</a></div></div>`;
  }
  app.innerHTML = `<section class="checkout">
    <h1>${t('checkout')}</h1>
    <ol class="stepper">${steps.map((s, i) => `<li class="${i === coStep ? 'aktif' : i < coStep ? 'lewat' : ''}">${i + 1}. ${s}</li>`).join('')}</ol>
    <div class="co-grid"><div class="kotak">${body}</div>
      <aside class="kotak ringkas"><h3>${esc(coStep === 3 && S.orders[0] ? S.orders[0].projectName : p.name)}</h3><p>${coStep === 3 && S.orders[0] ? S.orders[0].units : est.units} ${t('items')} · ${countryLabel(p.ctx.country)}</p><p class="harga besar">${coStep === 3 && S.orders[0] ? om(S.orders[0].total, S.orders[0]) : money(est.total)}</p>
      ${coStep === 2 ? `<p>${LANG === 'id' ? 'Dibayar sekarang' : 'Due now'}: <strong>${money(payAmt)}</strong></p>` : ''}
      <p class="kecil-teks">♲ ${est.recycledKg.toFixed(1)} ${t('sus_kg')}</p>
      ${coStep < 3 ? `<div class="baris-tombol">${coStep > 0 ? `<button type="button" class="sekunder" id="co-back">${t('back')}</button>` : `<a class="sekunder" href="${backHref}">${t('back')}</a>`}
      <button type="button" class="primer" id="co-next">${coStep === 2 ? t('pay_now') : t('next')}</button></div>` : ''}</aside></div>
  </section>`;
  $$('[data-co]', app).forEach((el) => el.addEventListener('input', () => { coData[el.dataset.co] = el.value; }));
  $$('input[name="met"]', app).forEach((r) => r.addEventListener('change', () => { coData.method = r.value; }));
  $$('input[name="pay"]', app).forEach((r) => r.addEventListener('change', () => { coData.pay = r.value; render(); }));
  const back = $('#co-back'); if (back) back.addEventListener('click', () => { coStep--; render(); });
  const nx = $('#co-next');
  if (nx) nx.addEventListener('click', () => {
    if (coStep === 1) { const f = $('#co-form'); if (!f.reportValidity()) return; }
    if (coStep === 2) return simulatePay(p, est, payAmt, arg === 'cart' ? 'cart' : 'konfigurator');
    coStep++; catat('checkout_langkah', steps[coStep]); render();
  });
  const pr = $('#cetak-proforma'); if (pr) pr.addEventListener('click', () => { catat('unduh_proforma'); printInvoice(S.orders[0], 'proforma'); });
  const kf = $('#cetak-konf'); if (kf) kf.addEventListener('click', () => { catat('unduh_konfirmasi'); printInvoice(S.orders[0], 'conf'); });
};
function simulatePay(p, est, payAmt, jalur) {
  const transfer = coData.method.includes('transfer');
  modal(`<div class="bayar-sim"><p class="label-sim">${t('sim_payment')}</p><h2>${esc(coData.method.split('·')[0])}</h2>
    ${coData.method.includes('QRIS') ? '<div class="qris-palsu" aria-label="QR placeholder"></div>' : ''}
    ${coData.method.includes('Virtual') ? `<p>VA: <code>8808 ${Math.floor(1e7 + Math.random() * 9e7)}</code></p>` : ''}
    <p class="harga besar">${money(payAmt)}</p>${transfer ? `<p class="kecil-teks">${LANG === 'id' ? 'Transfer ke: Bank Contoh Indonesia · 000-000-0000 a/n PT Robries (fiktif). Pesanan dibuat setelah dana diterima.' : 'Transfer to: Bank Contoh Indonesia · 000-000-0000, PT Robries (fictional). The order is created once funds are received.'}</p>` : ''}<button type="button" class="primer lebar" id="konfirm-bayar">${transfer ? t('confirm_transfer') : (LANG === 'id' ? 'Simulasikan pembayaran berhasil' : 'Simulate successful payment')}</button></div>`, (m, close) => {
    $('#konfirm-bayar', m).addEventListener('click', () => {
      const o = {
        id: 'RB-ORD-' + Math.floor(1000 + Math.random() * 9000), projectId: p.id, projectName: p.name, created: Date.now(), total: est.total, paid: payAmt,
        payType: coData.pay, method: coData.method, company: { ...coData }, stage: 0, country: p.ctx.country, units: est.units, kg: est.recycledKg,
        boq: est.boq.map((r) => ({ name: PMAP[r.it.pid].name, spec: specText(r.it), qty: r.qty, unit: r.unit, sub: r.sub })), lead: est.lead, transit: est.transit,
        schedule: makeSchedule(est.lead, est.transit, Date.now()), jalur,
      };
      lockOrderCur(o);
      S.orders.unshift(o); p.status = 'ordered';
      if (jalur === 'cart') S.cart.lines = [];
      save();
      catat('checkout_bayar', `${o.id}:${jalur}:${coData.pay}:${coData.method}:${money(payAmt)}`);
      close(); coStep = 3; render();
      tanyaSkor('checkout');
    });
  });
}
const STAGES = ['Deposit received', 'Production', 'Packing', 'Shipping', 'Delivered'];
const stageLabel = (i) => t('st' + Math.min(i, 4));
// Jadwal perkiraan dari lead time saat checkout: tanggal selesai (min–maks) per tahap.
function makeSchedule(ld, transit, start) {
  if (!ld) return null;
  const d = (n) => start + n * 864e5;
  const tr = transit || [0, 0];
  return {
    deposit: [d(0), d(0)],
    production: [d(ld.prod), d(ld.shipMax - ld.qc)],
    packing: [d(ld.shipMin), d(ld.shipMax)],
    shipping: [d(ld.shipMin + 1), d(ld.shipMax + 2)],
    delivered: [d(ld.shipMin + tr[0]), d(ld.shipMax + tr[1])],
  };
}
function schedText(r) {
  if (!r) return '—';
  const f = (x) => new Date(x).toLocaleDateString(LANG === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return r[0] === r[1] ? f(r[0]) : `${f(r[0])} – ${f(r[1])}`;
}
function printInvoice(o, kind) {
  if (!o) return;
  const due = kind === 'proforma' ? o.paid : o.total;
  printHTML(`${sheetHeader(kind === 'proforma' ? t('proforma') : t('order_conf'), `${o.id} · ${new Date(o.created).toLocaleDateString()}`)}
    <div class="dua-kolom"><div><strong>${LANG === 'id' ? 'Kepada' : 'Bill to'}</strong><p>${esc(o.company.company)}<br>${esc(o.company.tax)}<br>${esc(o.company.billing)}</p></div>
    <div><strong>${t('delivery')}</strong><p>${esc(o.company.delivery)}</p></div></div>
    <table class="tabel"><thead><tr><th>${t('qty')}</th><th>${t('spec')}</th><th>${t('unit')}</th><th>${t('subtotal')}</th></tr></thead><tbody>${o.boq.map((r) => `<tr><td>${r.qty}</td><td>${esc(r.name)} — ${esc(r.spec)}</td><td>${om(r.unit, o)}</td><td>${om(r.sub, o)}</td></tr>`).join('')}</tbody></table>
    <p><strong>${t('total')}:</strong> ${om(o.total, o)} (${LANG === 'id' ? 'termasuk pengemasan, ongkir, pajak sesuai estimasi' : 'incl. packaging, shipping, taxes as estimated'})</p>
    <p><strong>${kind === 'proforma' ? (LANG === 'id' ? 'Jumlah ditagih sekarang' : 'Amount due now') : (LANG === 'id' ? 'Dibayar' : 'Paid')}:</strong> ${om(due, o)} · ${esc(o.method)} · ${o.payType === 'deposit' ? `${t('pay_deposit')} ${R.depositPct}%, ${t('pay_balance')}` : t('pay_full')}</p>
    <p>Bank: Bank Contoh Indonesia · Acc. 000-000-0000 · a/n PT Robries (fictional)</p>
    ${o.schedule ? `<p><strong>${t('est_arrival')}:</strong> ${schedText(o.schedule.delivered)}</p>` : ''}
    <p class="ps-sus">♲ ${o.kg.toFixed(1)} ${t('sus_kg')}</p>`);
}

// ========== CONSULT SALES ==========
VIEWS.consult = (app, arg) => {
  const p = sourceFor(arg);
  const backHref = arg === 'cart' ? '#/cart' : '#/configure';
  const showP = hargaTampil() || (arg !== 'cart' && estSnapshot && estSnapshot.pid === p.id) || kondisi === 'B';
  const est = estimate(p, R);
  const route = routeLead(p.ctx.country, p.ctx.segment);
  const tzUser = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offs = { ID: 7, MY: 8, SG: 8, AU: 11, JP: 9 };
  const off = route.type === 'distributor' ? (offs[route.country] || 7) : 7;
  const slots = [];
  const d = new Date();
  for (let i = 1; slots.length < 8 && i < 14; i++) {
    const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + i));
    const wd = day.getUTCDay();
    if (wd === 0 || wd === 6) continue;
    [10, 14].forEach((h) => slots.push(new Date(day.getTime() + (h - off) * 3600e3)));
  }
  const fmtSlot = (s) => s.toLocaleString(LANG === 'id' ? 'id-ID' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: tzUser });
  const share = `${baseURL()}#/view/${encodeProject(p)}`;
  app.innerHTML = `<section class="checkout">
    <h1>${t('send_sales')}</h1>
    <div class="co-grid"><div class="kotak">
      <p>${LANG === 'id' ? 'Proyek lengkap (layout, BoQ, estimasi, catatan, gambar kerja) akan dilampirkan.' : 'The full project (layout, BoQ, estimate, notes, drawings) will be attached.'}</p>
      <p>${t('route_to')}: <strong>${esc(route.name)}</strong> <span class="chip">${route.type === 'distributor' ? (LANG === 'id' ? 'distributor regional' : 'regional distributor') : 'HQ'}</span></p>
      <form id="sales-form" class="form-grid">
        <label>${t('company_name')}<input id="sf-company" required value="${esc(coData.company)}"></label>
        <label>${t('contact_email')}<input id="sf-email" type="email" required value="${esc(coData.email || p.email || '')}"></label>
        <label>${t('segment')}<select id="sf-seg">${CUSTOMER_SEGMENTS.map((s) => `<option value="${s.id}" ${p.ctx.segment === s.id ? 'selected' : ''}>${esc(L(s))}</option>`).join('')}</select></label>
        <label>${t('destination')}<select id="sf-country">${COUNTRIES.map((c) => `<option value="${c.id}" ${p.ctx.country === c.id ? 'selected' : ''}>${esc(L(c))}</option>`).join('')}</select></label>
        <label class="span2">${t('notes')}<textarea id="sf-notes" rows="3">${esc(p.notes)}</textarea></label>
        <label class="span2">${t('upload')}<input id="sf-files" type="file" multiple accept=".pdf,.dwg,.dxf,.jpg,.png"></label>
      </form>
      <h3>${LANG === 'id' ? 'Saluran kontak' : 'Contact channel'}</h3>
      <div class="opsi">
        <label class="opsi-item"><input type="radio" name="ch" value="whatsapp" checked> ${t('contact_wa')}</label>
        <label class="opsi-item"><input type="radio" name="ch" value="email"> ${t('contact_email_btn')}</label>
        <label class="opsi-item"><input type="radio" name="ch" value="call"> ${t('book_call')}</label>
      </div>
      <div id="slot-box" hidden><p class="kecil-teks redup">${t('slots_tz')}: <strong>${esc(tzUser)}</strong></p>
        <div class="slot-grid">${slots.map((s, i) => `<label class="slot"><input type="radio" name="slot" value="${s.toISOString()}" ${i === 0 ? 'checked' : ''}><span>${fmtSlot(s)}</span></label>`).join('')}</div></div>
      <button type="button" class="primer besar" id="kirim-sales">${t('send_sales')}</button>
    </div>
    <aside class="kotak ringkas"><h3>${esc(p.name)}</h3>${p.thumb ? `<img src="${p.thumb}" alt="Layout" class="thumb-layout">` : ''}<p>${est.units} ${t('items')}${est.hasCustom ? ' · ⚑ custom' : ''}</p>${showP ? `<p class="harga besar">${money(est.total)}</p><p class="kecil-teks">${t('est_label')} · ♲ ${est.recycledKg.toFixed(1)} kg</p>` : `<p class="kecil-teks">${t('quote_cart_note')}</p>`}<a href="${backHref}" class="sekunder">${t('back')}</a></aside></div>
  </section>`;
  $$('input[name="ch"]', app).forEach((r) => r.addEventListener('change', () => { $('#slot-box').hidden = r.value !== 'call' || !r.checked; }));
  $('#kirim-sales').addEventListener('click', () => {
    const f = $('#sales-form');
    if (!f.reportValidity()) return;
    p.ctx.segment = $('#sf-seg').value; p.ctx.country = $('#sf-country').value; p.notes = $('#sf-notes').value;
    if (arg === 'cart') { S.cart.notes = p.notes; }
    p.files = [...$('#sf-files').files].map((x) => x.name);
    const rt = routeLead(p.ctx.country, p.ctx.segment);
    const ch = $('input[name="ch"]:checked').value;
    const slot = ch === 'call' ? $('input[name="slot"]:checked').value : null;
    const e2 = estimate(p, R);
    const lead = {
      id: 'RB-LD-' + Math.floor(1000 + Math.random() * 9000), projectId: p.id, projectName: p.name, created: Date.now(), company: $('#sf-company').value, email: $('#sf-email').value,
      country: p.ctx.country, segment: p.ctx.segment, routedTo: rt, channel: ch, slot, notes: p.notes, files: p.files, total: e2.total, units: e2.units, custom: e2.hasCustom,
      snapshot: encodeProject(p), status: 'new', salesNotes: '', followUp: '', overridePct: 0,
    };
    lead.jalur = arg === 'cart' ? 'cart' : 'konfigurator';
    S.leads.unshift(lead); p.status = 'with sales';
    if (arg === 'cart') S.cart.lines = [];
    save();
    catat('kirim_sales', `${lead.id}:${lead.jalur}:${rt.name}:${ch}${slot ? ':' + slot : ''}`);
    const msg = `Hi ROBRIES, I'd like to discuss project "${p.name}" (${e2.units} items${showP ? `, estimate ${money(e2.total)}` : ''}). Ref ${lead.id}. View: ${share}`;
    modal(`<div class="sukses"><h2>✓ ${t('lead_sent')} ${lead.id}</h2><p>${t('route_to')}: <strong>${esc(rt.name)}</strong></p>
      ${ch === 'call' ? `<p>${t('book_call')}: <strong>${fmtSlot(new Date(slot))}</strong> (${esc(tzUser)})</p>` : ''}
      <div class="baris-tombol">
        <a class="primer" target="_blank" rel="noopener" href="https://wa.me/${rt.wa}?text=${encodeURIComponent(msg)}" id="buka-wa">${t('contact_wa')} ↗</a>
        <a class="sekunder" href="mailto:${rt.email}?subject=${encodeURIComponent('Project ' + lead.id)}&body=${encodeURIComponent(msg)}">${t('contact_email_btn')}</a>
      </div><p class="kecil-teks redup">${LANG === 'id' ? 'Nomor & email tujuan adalah rekaan.' : 'Destination number & email are fictional.'}</p></div>`, (m, close) => {
      $('#buka-wa', m).addEventListener('click', () => catat('kontak_wa', lead.id));
      $('.tutup-modal', m).addEventListener('click', () => { close(); tanyaSkor('sales'); }, { once: true });
    });
  });
};

// ========== ACCOUNT ==========
VIEWS.account = (app) => {
  if (S.role === 'guest') {
    app.innerHTML = `<section class="kepala-halaman"><h1>${t('nav_account')}</h1>
      <p>${LANG === 'id' ? 'Anda sedang sebagai tamu. Proyek tetap tersimpan di browser ini, atau kirim tautan ke email Anda dari konfigurator.' : 'You are browsing as a guest. Projects are saved in this browser, or email yourself a link from the configurator.'}</p>
      <p class="label-sim">${LANG === 'id' ? 'Login simulasi' : 'Simulated login'}</p>
      <div class="baris-tombol">${['customer', 'distributor', 'sales', 'admin'].map((r) => `<button type="button" class="sekunder" data-login="${r}">${r}</button>`).join('')}</div></section>
      ${projectsHTML()}`;
    $$('[data-login]', app).forEach((b) => b.addEventListener('click', () => setRole(b.dataset.login)));
    bindProjects(app);
    return;
  }
  const myOrders = S.orders;
  app.innerHTML = `<section class="kepala-halaman"><p class="eyebrow">${esc(S.role)} · ${esc(S.account.name)}</p><h1>${t('nav_account')}</h1>
</section>
    ${projectsHTML()}
    <section class="blok"><h2>${t('my_quotes')}</h2>${S.quotes.length ? `<div class="tabel-scroll"><table class="tabel"><thead><tr><th>ID</th><th>${t('project_name')}</th><th>${t('total')}</th><th>${t('valid_until')}</th><th>${t('status')}</th><th></th></tr></thead><tbody>${S.quotes.map((q) => `<tr><td>${q.id}</td><td>${esc(q.projectName)}</td><td>${money(q.total)}</td><td>${new Date(q.valid).toLocaleDateString()}</td><td>${q.status}</td><td>${q.status === 'sent' ? `<a class="kecil primer" href="#/pay/${q.id}">${t('accept_pay')}</a>` : ''}</td></tr>`).join('')}</tbody></table></div>` : `<p class="redup">${t('no_data')}</p>`}</section>
    <section class="blok"><h2>${t('my_orders')}</h2>${myOrders.length ? myOrders.map(orderCard).join('') : `<p class="redup">${t('no_data')}</p>`}</section>
    <section class="blok"><h2>CAD & spec downloads</h2><div class="chip-baris">${[...new Set(S.projects.flatMap((p) => p.items.map((i) => i.pid)))].map((pid) => `<button type="button" class="chip" data-dxf="${pid}">⬇ ${esc(PMAP[pid].name)} .dxf</button>`).join('') || `<span class="redup">${t('no_data')}</span>`}</div></section>`;
  $$('[data-dxf]', app).forEach((b) => b.addEventListener('click', () => { const p = PMAP[b.dataset.dxf]; catat('unduh_cad', p.id); download(`${p.id}.dxf`, makeDXF(p), 'application/dxf'); }));
  bindProjects(app);
};
function orderCard(o) {
  const st = Math.min(o.stage || 0, STAGES.length - 1);
  const keys = ['deposit', 'production', 'packing', 'shipping', 'delivered'];
  const sc = o.schedule;
  return `<article class="order-kartu"><div class="judul-baris"><h3>${o.id} · ${esc(o.projectName)}</h3><span class="chip">${stageLabel(st)}</span></div>
    ${sc ? `<p class="kecil-teks"><strong>${t('est_arrival')}: ${schedText(sc.delivered)}</strong>${o.lead ? ` · ${weeks(o.lead.shipMin)}–${weeks(o.lead.shipMax)} ${t('weeks')} ${t('to_ship')}` : ''}</p>` : ''}
    <ol class="jadwal" aria-label="${t('est_dates')}">${STAGES.map((s, i) => `<li class="${i <= st ? 'lewat' : ''}"><strong>${stageLabel(i)}</strong>${sc ? (i === 0 ? schedText(sc.deposit) : `${LANG === 'id' ? 'perk.' : 'est.'} ${schedText(sc[keys[i]])}`) : ''}</li>`).join('')}</ol>
    <p class="kecil-teks">${om(o.total, o)} · ${LANG === 'id' ? 'dibayar' : 'paid'} ${om(o.paid, o)}${o.payType === 'deposit' ? ` (${t('pay_deposit')} ${o.depositPct || R.depositPct}%)` : ''} · ${esc(o.method)} · ♲ ${o.kg.toFixed(1)} kg${o.cur ? ` · ${o.cur} 🔒` : ''}</p>
    <p class="kecil-teks redup">${LANG === 'id' ? 'Status produksi dummy — nanti tersinkron dengan dashboard manufaktur/ERP.' : 'Dummy production status — future sync with manufacturing dashboard/ERP.'}</p></article>`;
}
function projectsHTML() {
  const folders = [...new Set(S.projects.map((p) => p.folder || 'General'))];
  return `<section class="blok"><h2>${t('my_projects')}</h2>${S.projects.length ? folders.map((f) => `<h3 class="folder">📁 ${esc(f)}</h3><div class="grid-proyek-saya">${S.projects.filter((p) => (p.folder || 'General') === f).map((p) => {
    const e = estimate(p, R);
    return `<article class="kotak proyek-saya">${p.thumb ? `<img src="${p.thumb}" alt="">` : ''}<h4>${esc(p.name)}</h4><p class="kecil-teks">${e.units} ${t('items')} · ${hargaTampil() ? money(e.total) : t('price_on_request')} · ${esc(p.status)}<br>${new Date(p.updated).toLocaleString()}</p>
      <div class="baris-tombol"><button type="button" class="kecil primer" data-open="${p.id}">${t('open')}</button><button type="button" class="kecil sekunder" data-folder="${p.id}">${t('folder')}</button><button type="button" class="kecil sekunder" data-share="${p.id}">🔗</button><button type="button" class="kecil sekunder" data-delp="${p.id}">${t('del')}</button></div></article>`;
  }).join('')}</div>`).join('') : `<p class="redup">${t('no_data')}</p>`}</section>`;
}
function bindProjects(app) {
  $$('[data-open]', app).forEach((b) => b.addEventListener('click', () => { S.current = b.dataset.open; save(); go('#/configure'); }));
  $$('[data-folder]', app).forEach((b) => b.addEventListener('click', () => { const p = S.projects.find((x) => x.id === b.dataset.folder); const f = prompt(t('folder'), p.folder); if (f) { p.folder = f; save(); render(); } }));
  $$('[data-share]', app).forEach((b) => b.addEventListener('click', () => shareModal(S.projects.find((x) => x.id === b.dataset.share))));
  $$('[data-delp]', app).forEach((b) => b.addEventListener('click', () => { if (!confirm('Delete project?')) return; S.projects = S.projects.filter((x) => x.id !== b.dataset.delp); if (S.current === b.dataset.delp) S.current = null; save(); render(); }));
}

// ========== DISTRIBUTOR ==========
VIEWS.distributor = (app) => {
  if (S.role !== 'distributor') { go('#/account'); return; }
  const c = S.account.distributorCountry;
  const dists = S.distributors || DEFAULT_DISTRIBUTORS;
  const d = dists.find((x) => x.country === c) || dists[0];
  const leads = S.leads.filter((l) => l.routedTo.type === 'distributor' && l.routedTo.country === d.country);
  app.innerHTML = `<section class="kepala-halaman"><p class="eyebrow">${esc(d.name)} · ${esc(d.city)}</p><h1>${t('nav_dist')} dashboard</h1>
    <label>${LANG === 'id' ? 'Wilayah (simulasi)' : 'Region (simulated)'} <select id="dist-c">${dists.map((x) => `<option value="${x.country}" ${x.country === c ? 'selected' : ''}>${countryLabel(x.country)}</option>`).join('')}</select></label></section>
    <section class="blok stat-baris"><div><strong>${leads.length}</strong><span>leads</span></div><div><strong>${leads.filter((l) => l.status === 'won').length}</strong><span>won</span></div><div><strong>−${R.priceLists.distributor}%</strong><span>${t('pricelist')}</span></div></section>
    <section class="blok"><div class="judul-baris"><h2>Leads</h2><button type="button" class="primer" id="quote-baru">+ ${LANG === 'id' ? 'Buat penawaran untuk pelanggan' : 'Create quote for a customer'}</button></div>${leadsTable(leads)}</section>
    <section class="blok"><h2>${t('pricelist')} · distributor (${S.cur})</h2><div class="tabel-scroll"><table class="tabel"><thead><tr><th>Product</th><th>Retail</th><th>Distributor</th><th>${t('lead')}</th></tr></thead><tbody>${PRODUCTS.map((p) => `<tr><td>${esc(p.name)}</td><td>${money(R.prices[p.id])}</td><td><strong>${money(R.prices[p.id] * (1 - R.priceLists.distributor / 100))}</strong></td><td>${R.days[p.id]} ${t('days')}</td></tr>`).join('')}</tbody></table></div></section>`;
  $('#dist-c').addEventListener('change', (e) => { S.account.distributorCountry = e.target.value; save(); render(); });
  $('#quote-baru').addEventListener('click', () => {
    const p = newProject(`Quote ${countryLabel(d.country)} ${new Date().toLocaleDateString()}`, 'cafe');
    p.ctx.country = d.country; p.ctx.priceList = 'distributor'; p.ctx.incoterm = 'CIF'; p.folder = 'Distributor quotes'; save();
    catat('distributor_buat_quote', d.country); go('#/configure');
  });
  bindLeads(app);
};
function leadsTable(leads) {
  if (!leads.length) return `<p class="redup">${t('no_data')}</p>`;
  return `<div class="tabel-scroll"><table class="tabel"><thead><tr><th>ID</th><th>${t('company_name')}</th><th>${t('country')}</th><th>${t('segment')}</th><th>${t('total')}</th><th>${LANG === 'id' ? 'Tujuan' : 'Routed to'}</th><th>${t('status')}</th><th></th></tr></thead><tbody>
    ${leads.map((l) => `<tr><td>${l.id}${l.custom ? ' ⚑' : ''}</td><td>${esc(l.company)}</td><td>${l.country}</td><td>${esc(l.segment)}</td><td>${money(l.total * (1 - (l.overridePct || 0) / 100))}</td><td class="kecil-teks">${esc(l.routedTo.name)}</td><td><span class="chip">${l.status}</span></td><td><button type="button" class="kecil primer" data-lead="${l.id}">${t('open')}</button></td></tr>`).join('')}</tbody></table></div>`;
}
function bindLeads(app) {
  $$('[data-lead]', app).forEach((b) => b.addEventListener('click', () => leadModal(S.leads.find((x) => x.id === b.dataset.lead))));
}
function leadModal(l) {
  const p = decodeProject(l.snapshot);
  const est = estimate({ ...p, override: { pct: l.overridePct } }, R);
  modal(`<h2>${l.id} · ${esc(l.company)}</h2>
    <p class="kecil-teks">${esc(l.email)} · ${countryLabel(l.country)} · ${esc(l.segment)} · ${l.channel}${l.slot ? ' · ' + new Date(l.slot).toLocaleString() : ''}</p>
    <p class="kecil-teks">${t('notes')}: ${esc(l.notes || '—')} · Files: ${esc((l.files || []).join(', ') || '—')}</p>
    ${boqTableHTML(est)}
    <div class="dua">
      <label>${LANG === 'id' ? 'Override estimasi (diskon %)' : 'Override estimate (discount %)'}<input type="number" id="ld-ovr" value="${l.overridePct || 0}" min="-50" max="50" step="0.5"></label>
      <label>${LANG === 'id' ? 'Pengingat follow-up' : 'Follow-up reminder'}<input type="date" id="ld-fu" value="${l.followUp || ''}"></label>
      <label class="span2">${LANG === 'id' ? 'Catatan sales' : 'Sales notes'}<textarea id="ld-notes" rows="2">${esc(l.salesNotes || '')}</textarea></label>
      <label>${t('status')}<select id="ld-status">${['new', 'contacted', 'quoted', 'won', 'lost'].map((s) => `<option ${l.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
    </div>
    <p class="harga besar">${money(est.total)} <small class="redup">${t('est_label')}</small></p>
    <div class="baris-tombol"><button type="button" class="sekunder" id="ld-save">${t('save')}</button><a class="sekunder" href="#/view/${l.snapshot}" target="_blank" rel="noopener">3D ↗</a>
      <button type="button" class="primer" id="ld-quote">${LANG === 'id' ? 'Jadikan penawaran resmi' : 'Convert to official quote'}</button></div>`, (m, close) => {
    const persist = () => { l.overridePct = Number($('#ld-ovr', m).value) || 0; l.followUp = $('#ld-fu', m).value; l.salesNotes = $('#ld-notes', m).value; l.status = $('#ld-status', m).value; save(); };
    $('#ld-save', m).addEventListener('click', () => { persist(); catat('sales_update_lead', `${l.id}:${l.status}:${l.overridePct}%`); close(); render(); });
    $('#ld-quote', m).addEventListener('click', () => {
      persist();
      const e2 = estimate({ ...p, override: { pct: l.overridePct } }, R);
      const q = { id: 'RB-Q-' + Math.floor(1000 + Math.random() * 9000), leadId: l.id, projectName: l.projectName, snapshot: l.snapshot, total: e2.total, valid: Date.now() + R.validityDays * 864e5, status: 'sent', company: l.company, kg: e2.recycledKg, country: l.country, units: e2.units,
        boq: e2.boq.map((r) => ({ name: PMAP[r.it.pid].name, spec: specText(r.it), qty: r.qty, unit: r.unit, sub: r.sub })) };
      S.quotes.unshift(q); l.status = 'quoted'; save();
      catat('sales_buat_quote', `${q.id}:${money(q.total)}`); close(); render(); toast(`${q.id} ✓`);
    });
  });
}
// Penawaran hanya menjadi pesanan setelah dibayar (minimal DP).
function quoteToOrder(q, pay) {
  if (!pay || !(pay.amount > 0)) throw new Error('Payment required before an order is created');
  let lead = null, transit = null;
  try { const e = estimate(decodeProject(q.snapshot), R); lead = e.lead; transit = e.transit; } catch (e) { /* abaikan */ }
  const now = Date.now();
  const o = { id: 'RB-ORD-' + Math.floor(1000 + Math.random() * 9000), projectId: null, projectName: q.projectName, created: now, total: q.total, paid: pay.amount, payType: pay.type, method: pay.method, company: { company: q.company, tax: '', billing: '', delivery: '' }, stage: 0, country: q.country, units: q.units, kg: q.kg, boq: q.boq, quoteId: q.id, lead, transit, schedule: makeSchedule(lead, transit, now), jalur: 'penawaran' };
  lockOrderCur(o);
  S.orders.unshift(o);
  const l = S.leads.find((x) => x.id === q.leadId); if (l) l.status = 'won';
  q.status = 'paid';
  save();
  return o;
}

// ========== BAYAR PENAWARAN ==========
let qpData = { pay: 'deposit', method: '' };
VIEWS.pay = (app, qid) => {
  const q = S.quotes.find((x) => x.id === qid);
  if (!q) { go('#/account'); return; }
  if (q.status !== 'sent') {
    app.innerHTML = `<section class="kepala-halaman"><h1>${q.id}</h1><p>${t('status')}: ${esc(q.status)}</p><a class="primer" href="#/account">${t('my_orders')}</a></section>`;
    return;
  }
  const isID = q.country === 'ID';
  const methods = isID ? ['Midtrans · Virtual Account (BCA/Mandiri/BNI)', 'Midtrans · QRIS', 'Xendit · Credit/debit card', 'Bank transfer · Proforma invoice'] : ['Stripe · Card', 'Bank transfer (SWIFT) · Proforma invoice'];
  if (!methods.includes(qpData.method)) qpData.method = methods[0];
  const amt = qpData.pay === 'deposit' ? (q.total * R.depositPct) / 100 : q.total;
  app.innerHTML = `<section class="checkout"><h1>${t('quote_pay_title')} · ${q.id}</h1>
    <p class="kecil-teks">${t('quote_pay_note')}</p>
    <div class="co-grid"><div class="kotak">
      <table class="tabel"><thead><tr><th>${t('qty')}</th><th>${t('spec')}</th><th>${t('unit')}</th><th>${t('subtotal')}</th></tr></thead><tbody>${q.boq.map((r) => `<tr><td>${r.qty}</td><td>${esc(r.name)} — ${esc(r.spec)}</td><td>${money(r.unit)}</td><td>${money(r.sub)}</td></tr>`).join('')}</tbody></table>
      <p class="label">${t('pay_method')}</p>
      <div class="opsi">${methods.map((m) => `<label class="opsi-item"><input type="radio" name="qmet" value="${esc(m)}" ${qpData.method === m ? 'checked' : ''}> ${esc(m)}</label>`).join('')}</div>
      <p class="label">${LANG === 'id' ? 'Skema pembayaran' : 'Payment terms'}</p>
      <div class="opsi">
        <label class="opsi-item"><input type="radio" name="qpay" value="deposit" ${qpData.pay === 'deposit' ? 'checked' : ''}> ${t('pay_deposit')} ${R.depositPct}% — ${money((q.total * R.depositPct) / 100)} <small>(${t('pay_balance')})</small></label>
        <label class="opsi-item"><input type="radio" name="qpay" value="full" ${qpData.pay === 'full' ? 'checked' : ''}> ${t('pay_full')} — ${money(q.total)}</label>
      </div>
      <p class="label-sim">${t('sim_payment')}</p>
    </div>
    <aside class="kotak ringkas"><h3>${esc(q.projectName)}</h3><p>${esc(q.company)} · ${countryLabel(q.country)}</p><p class="harga besar">${money(q.total)}</p>
      <p>${LANG === 'id' ? 'Dibayar sekarang' : 'Due now'}: <strong>${money(amt)}</strong></p><p class="kecil-teks redup">🔒 ${t('cur_locked')}</p>
      <div class="baris-tombol"><a class="sekunder" href="#/account">${t('back')}</a><button type="button" class="primer" id="qp-bayar">${t('pay_now')}</button></div></aside></div></section>`;
  $$('input[name="qmet"]', app).forEach((r) => r.addEventListener('change', () => { qpData.method = r.value; }));
  $$('input[name="qpay"]', app).forEach((r) => r.addEventListener('change', () => { qpData.pay = r.value; render(); }));
  $('#qp-bayar').addEventListener('click', () => {
    const transfer = qpData.method.includes('transfer');
    modal(`<div class="bayar-sim"><p class="label-sim">${t('sim_payment')}</p><h2>${esc(qpData.method.split('·')[0])}</h2><p class="harga besar">${money(amt)}</p>
      <button type="button" class="primer lebar" id="qp-konfirm">${transfer ? t('confirm_transfer') : (LANG === 'id' ? 'Simulasikan pembayaran berhasil' : 'Simulate successful payment')}</button></div>`, (m, close) => {
      $('#qp-konfirm', m).addEventListener('click', () => {
        const o = quoteToOrder(q, { amount: amt, type: qpData.pay, method: qpData.method });
        catat('bayar_penawaran', `${q.id}->${o.id}:${qpData.pay}:${money(amt)}`);
        close(); toast(`${o.id} ✓`); go('#/account');
        tanyaSkor('penawaran');
      });
    });
  });
};

// ========== SALES DESK ==========
VIEWS.sales = (app) => {
  if (S.role !== 'sales' && S.role !== 'admin') { go('#/account'); return; }
  const today = new Date().toISOString().slice(0, 10);
  const due = S.leads.filter((l) => l.followUp && l.followUp <= today && !['won', 'lost'].includes(l.status));
  app.innerHTML = `<section class="kepala-halaman"><p class="eyebrow">ROBRIES HQ</p><h1>${t('nav_sales')}</h1></section>
    ${due.length ? `<section class="blok"><p class="bendera custom">⏰ ${due.length} follow-up: ${due.map((l) => l.id).join(', ')}</p></section>` : ''}
    <section class="blok"><h2>Lead inbox (${S.leads.length})</h2>${leadsTable(S.leads)}</section>
    <section class="blok"><h2>${t('my_quotes')}</h2>${S.quotes.length ? `<div class="tabel-scroll"><table class="tabel"><thead><tr><th>ID</th><th>Lead</th><th>${t('company_name')}</th><th>${t('total')}</th><th>${t('status')}</th><th></th></tr></thead><tbody>${S.quotes.map((q) => `<tr><td>${q.id}</td><td>${q.leadId}</td><td>${esc(q.company)}</td><td>${money(q.total)}</td><td>${q.status}</td><td class="kecil-teks redup">${q.status === 'sent' ? (LANG === 'id' ? 'menunggu pembayaran pelanggan' : 'awaiting customer payment') : ''}</td></tr>`).join('')}</tbody></table></div>` : `<p class="redup">${t('no_data')}</p>`}</section>
    <section class="blok"><h2>${t('my_orders')} · production</h2>${S.orders.length ? S.orders.map((o) => orderCard(o) + `<div class="baris-tombol"><button type="button" class="kecil sekunder" data-stage="${o.id}">ERP sync (dummy) → ${LANG === 'id' ? 'tahap berikut' : 'next stage'}</button></div>`).join('') : `<p class="redup">${t('no_data')}</p>`}</section>`;
  bindLeads(app);
  $$('[data-stage]', app).forEach((b) => b.addEventListener('click', () => { const o = S.orders.find((x) => x.id === b.dataset.stage); o.stage = Math.min(STAGES.length - 1, Math.min(o.stage || 0, STAGES.length - 1) + 1); save(); catat('status_produksi', `${o.id}:${STAGES[o.stage]}`); render(); }));
};

// ========== ADMIN ==========
let adminTab = 'pricing';
VIEWS.admin = (app) => {
  if (S.role !== 'admin') { go('#/account'); return; }
  const tabs = { pricing: 'Pricing rules', products: 'Catalog & lead time', shipping: 'Shipping & FX', capacity: 'Production', distributors: 'Distributors & users', analytics: 'Analytics' };
  const num = (path, v, step = 1) => `<input type="number" step="${step}" data-rule="${path}" value="${v}">`;
  let body = '';
  if (adminTab === 'pricing') {
    body = `<div class="grid-admin">
      <div class="kotak"><h3>General</h3><label>Estimate validity (days)${num('validityDays', R.validityDays)}</label><label>Online checkout limit (USD)${num('checkoutThresholdUSD', R.checkoutThresholdUSD, 100)}</label><label>Deposit %${num('depositPct', R.depositPct)}</label><label>PPN %${num('taxPPN', R.taxPPN)}</label></div>
      <div class="kotak"><h3>Material multipliers</h3>${Object.keys(R.materials).map((k) => `<label>${k.toUpperCase()}${num(`materials.${k}.mult`, R.materials[k].mult, 0.01)}</label>`).join('')}
        <h3>Finish surcharge %</h3>${Object.keys(R.finishes).map((k) => `<label>${k}${num(`finishes.${k}.pct`, R.finishes[k].pct, 0.5)}</label>`).join('')}</div>
      <div class="kotak"><h3>Quantity tiers</h3>${R.qtyTiers.map((q, i) => `<div class="dua"><label>Min qty${num(`qtyTiers.${i}.min`, q.min)}</label><label>Disc %${num(`qtyTiers.${i}.pct`, q.pct, 0.5)}</label></div>`).join('')}
        <h3>Segment price lists (disc %)</h3>${Object.keys(R.priceLists).map((k) => `<label>${k}${num(`priceLists.${k}`, R.priceLists[k], 0.5)}</label>`).join('')}</div>
      <div class="kotak"><h3>Custom pricing</h3><label>Custom fee (IDR/pc)${num('custom.fee', R.custom.fee, 1000)}</label><label>Minimum charge (IDR)${num('custom.minCharge', R.custom.minCharge, 1000)}</label><label>Size exponent${num('custom.exponent', R.custom.exponent, 0.05)}</label><label>Extra custom days${num('custom.extraDays', R.custom.extraDays)}</label>
        <h3>Add-ons</h3>${Object.keys(R.addons).map((k) => R.addons[k].flat !== undefined ? `<label>${k} (IDR)${num(`addons.${k}.flat`, R.addons[k].flat, 1000)}</label>` : `<label>${k} (%)${num(`addons.${k}.pct`, R.addons[k].pct, 0.5)}</label>`).join('')}
        <h3>Packaging %</h3><label>Domestic${num('packagingPct.domestic', R.packagingPct.domestic, 0.5)}</label><label>Export${num('packagingPct.export', R.packagingPct.export, 0.5)}</label></div>
      <div class="kotak span-penuh"><h3>Colours</h3><div class="tabel-scroll"><table class="tabel"><thead><tr><th>Colour</th><th>Type</th><th>Surcharge IDR</th><th>In stock</th></tr></thead><tbody>${COLORS.map((c) => `<tr><td>${swatch(c, 'mini')} ${c.name}</td><td>${c.type}</td><td>${num(`colors.${c.id}.surcharge`, R.colors[c.id].surcharge, 1000)}</td><td><input type="checkbox" data-rulebool="colors.${c.id}.stock" ${R.colors[c.id].stock ? 'checked' : ''}></td></tr>`).join('')}</tbody></table></div><p class="kecil-teks">Sourcing days for out-of-stock colours: ${num('sourcingDays', R.sourcingDays)}</p></div>
    </div>`;
  } else if (adminTab === 'products') {
    body = `<div class="tabel-scroll"><table class="tabel"><thead><tr><th>Product</th><th>Category</th><th>Base price (IDR)</th><th>Production days</th><th>3D model</th></tr></thead><tbody>${PRODUCTS.map((p) => `<tr><td>${esc(p.name)}${p.dummy ? ' <em>dummy</em>' : ''}</td><td>${catLabel(p.cat)}</td><td>${num(`prices.${p.id}`, R.prices[p.id], 500)}</td><td>${num(`days.${p.id}`, R.days[p.id])}</td><td class="kecil-teks">parametric · <label class="tautan">GLB…<input type="file" accept=".glb" hidden data-glb="${p.id}"></label></td></tr>`).join('')}</tbody></table></div>
      <p class="kecil-teks redup">Content & copy editing, photo uploads and GLB replacement are placeholders in this static prototype.</p>`;
  } else if (adminTab === 'shipping') {
    body = `<div class="grid-admin"><div class="kotak"><h3>FX table (IDR per unit) — admin-managed, not live</h3>${CURRENCIES.filter((c) => c !== 'IDR').map((c) => `<label>${c}${num(`fx.${c}`, R.fx[c], 0.5)}</label>`).join('')}</div>
      <div class="kotak"><h3>Domestic zones</h3><div class="tabel-scroll"><table class="tabel"><thead><tr><th>Zone</th><th>IDR/kg</th><th>Min</th></tr></thead><tbody>${Object.entries(R.domesticZones).map(([k, z]) => `<tr><td>${z.en}</td><td>${num(`domesticZones.${k}.rateKg`, z.rateKg, 100)}</td><td>${num(`domesticZones.${k}.min`, z.min, 1000)}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="kotak span-penuh"><h3>Export by country</h3><div class="tabel-scroll"><table class="tabel"><thead><tr><th>Country</th><th>FOB fee</th><th>Freight IDR/kg</th><th>Duty %</th><th>VAT/GST %</th><th>Transit min</th><th>Transit max</th></tr></thead><tbody>${Object.entries(R.export).map(([k, e]) => `<tr><td>${countryLabel(k)}</td><td>${num(`export.${k}.fobFee`, e.fobFee, 1000)}</td><td>${num(`export.${k}.freightKg`, e.freightKg, 100)}</td><td>${num(`export.${k}.duty`, e.duty, 0.5)}</td><td>${num(`export.${k}.vat`, e.vat, 0.5)}</td><td>${num(`export.${k}.transit.0`, e.transit[0])}</td><td>${num(`export.${k}.transit.1`, e.transit[1])}</td></tr>`).join('')}</tbody></table></div>
      <label>Insurance %${num('insurancePct', R.insurancePct, 0.1)}</label><label>DDP clearance fee (IDR)${num('clearanceFee', R.clearanceFee, 1000)}</label></div></div>`;
  } else if (adminTab === 'capacity') {
    body = `<div class="grid-admin"><div class="kotak"><h3>Factory</h3>
      <label>Production load % <output id="load-out">${R.productionLoad}</output><input type="range" min="0" max="100" data-rule="productionLoad" value="${R.productionLoad}"></label>
      <label>Capacity (units/day)${num('capacityPerDay', R.capacityPerDay)}</label><label>QC days${num('qcDays', R.qcDays)}</label><label>Packing days${num('packDays', R.packDays)}</label>
      <p class="kecil-teks redup">Later: pulled automatically from the manufacturing dashboard / ERP.</p></div>
      <div class="kotak"><h3>Open orders</h3>${S.orders.length ? S.orders.map((o) => `<p class="kecil-teks">${o.id} · ${stageLabel(o.stage || 0)} · ${o.units} units</p>`).join('') : `<p class="redup">${t('no_data')}</p>`}</div></div>`;
  } else if (adminTab === 'distributors') {
    const ds = S.distributors || clone(DEFAULT_DISTRIBUTORS);
    body = `<div class="tabel-scroll"><table class="tabel"><thead><tr><th>Country</th><th>Name</th><th>City</th><th>WhatsApp</th><th>Email</th></tr></thead><tbody>${ds.map((d, i) => `<tr><td>${d.country}</td>${['name', 'city', 'wa', 'email'].map((k) => `<td><input data-dist="${i}.${k}" value="${esc(d[k])}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="kecil-teks">GB & US route to HQ export desk. Hospitality leads always route to HQ Key Accounts.</p>
      <h3>Users (simulated)</h3><table class="tabel"><tr><th>User</th><th>Role</th></tr><tr><td>demo.customer@example.com</td><td>customer</td></tr><tr><td>partner.my@example.com</td><td>distributor</td></tr><tr><td>sales.hq@example.com</td><td>sales</td></tr><tr><td>admin.hq@example.com</td><td>admin</td></tr></table>`;
    S.distributors = ds;
  } else {
    body = analyticsHTML();
  }
  app.innerHTML = `<section class="kepala-halaman"><p class="eyebrow">Super Admin</p><h1>${t('nav_admin')}</h1><p class="kecil-teks">${LANG === 'id' ? 'Aturan harga & lead time bisa diubah tanpa kode. Tersimpan di browser ini.' : 'Pricing and lead-time rules are editable without code. Saved in this browser.'}</p></section>
    <nav class="tab-baris">${Object.entries(tabs).map(([k, v]) => `<button type="button" class="${adminTab === k ? 'aktif' : ''}" data-tab="${k}">${v}</button>`).join('')}<button type="button" class="tautan" id="reset-rules">Reset to defaults</button></nav>
    <section class="blok">${body}</section>`;
  $$('[data-tab]', app).forEach((b) => b.addEventListener('click', () => { adminTab = b.dataset.tab; render(); }));
  $$('[data-rule]', app).forEach((inp) => inp.addEventListener('change', () => {
    setPath(R, inp.dataset.rule, Number(inp.value)); save(); catat('admin_ubah_aturan', `${inp.dataset.rule}=${inp.value}`);
    const o = $('#load-out'); if (o && inp.dataset.rule === 'productionLoad') o.textContent = inp.value;
    toast('Rule saved ✓');
  }));
  $$('[data-rulebool]', app).forEach((inp) => inp.addEventListener('change', () => { setPath(R, inp.dataset.rulebool, inp.checked); save(); catat('admin_ubah_aturan', `${inp.dataset.rulebool}=${inp.checked}`); }));
  $$('[data-dist]', app).forEach((inp) => inp.addEventListener('change', () => { const [i, k] = inp.dataset.dist.split('.'); S.distributors[i][k] = inp.value; save(); }));
  $$('[data-glb]', app).forEach((inp) => inp.addEventListener('change', () => toast('GLB upload is a placeholder in this prototype')));
  $('#reset-rules').addEventListener('click', () => { if (!confirm('Reset all rules?')) return; R = clone(DEFAULT_RULES); S.distributors = null; save(); render(); });
};
function setPath(o, path, v) {
  const ks = path.split('.');
  let x = o;
  ks.slice(0, -1).forEach((k) => { x = x[k]; });
  x[ks[ks.length - 1]] = v;
}

function analyticsHTML() {
  const L2 = typeof log !== 'undefined' ? log : [];
  const count = (ev) => L2.filter((r) => r.kejadian === ev);
  const top = (rows, f) => { const m = {}; rows.forEach((r) => { const k = f(r); if (k) m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8); };
  const prodTop = top(count('tambah_item'), (r) => (PMAP[r.detail.split(' ')[0]] || {}).name);
  const matTop = top(count('ubah_spesifikasi').concat(count('edit_massal')), (r) => { const m = r.detail.match(/color=([\w-]+)|:([\w-]+)\//); return m ? (CMAP[m[1] || m[2]] || {}).name : null; });
  // funnel per peserta
  const steps = [['Explore', ['lihat_produk', 'filter_katalog', 'lihat_halaman']], ['Cart / Configure', ['tambah_item', 'pilih_template', 'tambah_keranjang']], ['Specify', ['ubah_spesifikasi', 'edit_massal']], ['Estimate', ['hitung_estimasi', 'buka_rincian', 'ubah_tujuan']], ['Convert', ['checkout_bayar', 'kirim_sales', 'bayar_penawaran']]];
  const people = [...new Set(L2.map((r) => r.peserta))];
  const reached = steps.map(([n, evs]) => [n, people.filter((pp) => L2.some((r) => r.peserta === pp && evs.includes(r.kejadian))).length]);
  const max = Math.max(1, ...reached.map((x) => x[1]));
  let drop = null;
  for (let i = 1; i < reached.length; i++) { const d = reached[i - 1][1] - reached[i][1]; if (!drop || d > drop.d) drop = { d, at: reached[i][0] }; }
  const quotes = S.quotes.length, ordersFromQuotes = S.quotes.filter((q) => q.status === 'ordered').length;
  const bar = (rows) => rows.length ? rows.map(([k, v]) => `<div class="bar-baris"><span>${esc(k)}</span><div class="bar"><i style="width:${(v / rows[0][1]) * 100}%"></i></div><b>${v}</b></div>`).join('') : `<p class="redup">${t('no_data')}</p>`;
  const byCountry = top(S.leads, (l) => l.country), bySeg = top(S.leads, (l) => l.segment);
  return `<div class="grid-admin">
    <div class="kotak"><h3>Funnel (participants)</h3>${reached.map(([n, v]) => `<div class="bar-baris"><span>${n}</span><div class="bar"><i style="width:${(v / max) * 100}%"></i></div><b>${v}</b></div>`).join('')}
      <p class="kecil-teks">${drop && drop.d > 0 ? `Biggest drop-off before <strong>${drop.at}</strong> (−${drop.d})` : '—'}</p></div>
    <div class="kotak"><h3>Most configured products</h3>${bar(prodTop)}</div>
    <div class="kotak"><h3>Most chosen colours</h3>${bar(matTop)}</div>
    <div class="kotak"><h3>Quote → order</h3><p class="angka-besar">${quotes ? Math.round((ordersFromQuotes / quotes) * 100) : 0}%</p><p class="kecil-teks">${ordersFromQuotes}/${quotes} quotes · ${S.orders.length} orders total · ${S.leads.length} leads</p></div>
    <div class="kotak"><h3>Leads by country</h3>${bar(byCountry)}</div>
    <div class="kotak"><h3>Leads by segment</h3>${bar(bySeg)}</div>
    <div class="kotak"><h3>Sustainability</h3><p class="angka-besar">${S.orders.reduce((s, o) => s + o.kg, 0).toFixed(0)} kg</p><p class="kecil-teks">plastic recycled in orders placed</p></div>
  </div><p class="kecil-teks redup">Analytics are computed from the research log and data stored in this browser.</p>`;
}

// ========== Chat (Simulasi AI) ==========
const chatLog = [];
function aiReply(q) {
  const s = q.toLowerCase();
  const p = S.projects.find((x) => x.id === S.current);
  const est = p && p.items.length ? estimate(p, R) : null;
  const id = LANG === 'id';
  const has = (...w) => w.some((x) => s.includes(x));
  if (!hargaTampil() && has('harga', 'price', 'cost', 'berapa', 'quote')) {
    return id ? 'Harga disiapkan tim Sales dalam penawaran resmi. Tambahkan produk ke permintaan penawaran (ikon 🛒), lalu tekan "Minta penawaran".' : 'Prices are prepared by our Sales team in a formal quotation. Add products to your quote request (🛒) and press "Request quotation".';
  }
  if (has('harga', 'price', 'cost', 'berapa', 'estimate', 'estimasi', 'quote')) {
    return est ? (id ? `Estimasi proyek "${p.name}" saat ini ${money(est.total)} untuk ${est.units} item (berlaku ${R.validityDays} hari). Rinciannya ada di panel Estimasi.` : `Your project "${p.name}" is currently estimated at ${money(est.total)} for ${est.units} items (valid ${R.validityDays} days). Expand the breakdown in the Estimate panel.`)
      : (id ? `Harga mulai ${money(R.prices['arafuru-coaster'])} (coaster) hingga ${money(R.prices['trash-bin'])} (trash bin). Kursi Anyer ${money(R.prices['anyer-chair'])}. Tambahkan produk ke layout untuk estimasi lengkap.` : `Prices range from ${money(R.prices['arafuru-coaster'])} (coaster) to ${money(R.prices['trash-bin'])} (trash bin). Anyer chair is ${money(R.prices['anyer-chair'])}. Add products to a layout for a full estimate.`);
  }
  if (has('lead', 'lama', 'waktu', 'how long', 'when', 'kapan', 'delivery time')) {
    return est && est.lead ? (id ? `Proyek Anda sekitar ${weeks(est.lead.shipMin)}–${weeks(est.lead.shipMax)} minggu sampai siap kirim, ditambah ${weeks(est.transit[0])}–${weeks(est.transit[1])} minggu pengiriman. Beban pabrik saat ini ${R.productionLoad}%.` : `Your project is about ${weeks(est.lead.shipMin)}–${weeks(est.lead.shipMax)} weeks to ship, plus ${weeks(est.transit[0])}–${weeks(est.transit[1])} weeks transit. Current factory load is ${R.productionLoad}%.`)
      : (id ? 'Produksi standar 7–21 hari per produk; warna spesial +7 hari sourcing, ukuran custom +10 hari. Lalu QC & kemas ±5 hari.' : 'Standard production is 7–21 days per product; special colours add ~7 days sourcing, custom sizes ~10 days. Then ~5 days QC & packing.');
  }
  if (has('outdoor', 'uv', 'luar', 'hujan', 'rain', 'sun', 'matahari')) return id ? 'Untuk luar ruang pilih HDPE dengan finishing UV-guard. Produk seperti Mada Bench, Sawarna, Ambeng, Pantai Bench, dan Tegal Planter cocok untuk outdoor furniture. Plastik daur ulang tahan air dan tidak lapuk.' : 'For outdoor use choose HDPE with the UV-guard finish. Mada Bench, Sawarna, Ambeng, Pantai Bench and Tegal Planter work as outdoor furniture. Recycled plastic is waterproof and will not rot.';
  if (has('hdpe', 'ldpe', 'material', 'plastik', 'plastic', 'waste', 'sampah')) return id ? 'HDPE (kode 2) berasal dari tutup botol, krat, botol sampo — kekuatan impak 214 kg/cm². LDPE (kode 4) dari plastik fleksibel & botol remas — 93 kg/cm², cocok untuk dalam ruang. Lihat halaman Material.' : 'HDPE (code 2) comes from bottle caps, crates and shampoo bottles, 214 kg/cm² impact strength. LDPE (code 4) comes from flexible plastics and squeezable bottles, 93 kg/cm², best indoors. See the Materials page.';
  if (has('color', 'colour', 'warna', 'pattern', 'pola', 'pinhole')) return id ? `Ada ${COLORS.filter((c) => c.group === 'main').length} warna utama (stok) dan ${COLORS.filter((c) => c.group === 'special').length} warna spesial (+IDR 100rb, dibuat sesuai pesanan). Pola tiap item unik dan tone bisa bervariasi per batch — itu ciri material daur ulang.` : `There are ${COLORS.filter((c) => c.group === 'main').length} main colours (in stock) and ${COLORS.filter((c) => c.group === 'special').length} special colours (+IDR 100k, made to order). Each piece's pattern is unique and tone may vary per batch, which is a feature of recycled material.`;
  if (has('ship', 'kirim', 'export', 'ekspor', 'fob', 'cif', 'ddp', 'incoterm')) return id ? 'Kami mengirim domestik per zona dan ekspor ke MY, SG, AU, JP, UK, US dengan opsi FOB (Jakarta), CIF (pelabuhan tujuan), atau DDP (termasuk bea & pajak). Ubah di panel Estimasi.' : 'We ship domestically by zone and export to MY, SG, AU, JP, UK and US as FOB (Jakarta), CIF (destination port) or DDP (duties & taxes included). Change it in the Estimate panel.';
  if (has('custom', 'ukuran', 'size', 'dimension')) return id ? 'Ukuran custom boleh — harga dihitung dari luas/volume dengan biaya minimum. Ukuran di luar rentang ditandai "Custom – perlu review Sales" dan diarahkan ke konsultasi.' : 'Custom sizes are welcome — priced by area/volume with a minimum charge. Sizes outside the allowed range are flagged "Custom – requires Sales review" and routed to consultation.';
  if (has('distributor', 'malaysia', 'singapore', 'australia', 'japan', 'jepang')) return id ? 'Kami punya mitra distributor di Malaysia, Singapura, Australia, dan Jepang (nama fiktif di prototipe). Proyek dari negara tersebut otomatis diteruskan ke mereka.' : 'We have distributor partners in Malaysia, Singapore, Australia and Japan (fictional names in this prototype). Projects from those countries route to them automatically.';
  if (has('pay', 'bayar', 'deposit', 'dp', 'midtrans', 'xendit', 'stripe', 'invoice')) return id ? `Checkout online tersedia untuk konfigurasi standar di bawah USD ${R.checkoutThresholdUSD.toLocaleString()}: bayar penuh atau DP ${R.depositPct}% (Midtrans/Xendit di Indonesia, Stripe internasional, atau transfer bank dengan proforma).` : `Online checkout is available for standard configurations under USD ${R.checkoutThresholdUSD.toLocaleString()}: full payment or a ${R.depositPct}% deposit (Midtrans/Xendit in Indonesia, Stripe internationally, or bank transfer with proforma).`;
  if (has('sample', 'sampel', 'swatch')) return id ? 'Sampel warna bisa diminta lewat Sales. Klik "Bicara dengan manusia" dan sebutkan warna yang Anda inginkan.' : 'Colour samples can be requested through Sales. Tap "Talk to a human" and list the colours you want.';
  return id ? 'Saya bisa bantu soal produk, material, warna, harga, waktu produksi, dan pengiriman. Untuk hal lain, tekan "Bicara dengan manusia" — proyek Anda ikut terlampir.' : 'I can help with products, materials, colours, prices, lead time and shipping. For anything else, tap "Talk to a human" and your project comes along.';
}
function chatAdd(who, text) {
  chatLog.push({ who, text });
  const box = $('#chat-isi');
  box.insertAdjacentHTML('beforeend', `<p class="msg ${who}">${esc(text)}</p>`);
  box.scrollTop = box.scrollHeight;
}
function initChat() {
  $('#chat-fab').addEventListener('click', () => {
    const c = $('#chat');
    c.hidden = !c.hidden;
    if (!c.hidden && !chatLog.length) chatAdd('bot', LANG === 'id' ? 'Halo! Saya asisten ROBRIES (simulasi). Tanya apa saja soal produk, material, atau estimasi Anda — 24/7.' : 'Hi! I’m the ROBRIES assistant (simulated). Ask me about products, materials or your estimate, any time zone.');
    catat('chat_buka');
  });
  $('#chat-tutup').addEventListener('click', () => { $('#chat').hidden = true; });
  $('#chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('#chat-input').value.trim();
    if (!q) return;
    chatAdd('user', q);
    $('#chat-input').value = '';
    setTimeout(() => chatAdd('bot', aiReply(q)), 350);
    catat('chat_ai', q.slice(0, 80));
  });
  $('#chat-handoff').addEventListener('click', () => {
    const p = cur();
    p.notes = (p.notes ? p.notes + '\n' : '') + 'Chat transcript:\n' + chatLog.map((m) => `${m.who}: ${m.text}`).join('\n');
    touch(p);
    catat('chat_handoff', chatLog.length);
    $('#chat').hidden = true;
    go('#/consult');
  });
}

// ========== Header controls ==========
function setRole(r) {
  S.role = r; save(); catat('ganti_peran', r);
  if (r === 'admin') go('#/admin'); else if (r === 'sales') go('#/sales'); else if (r === 'distributor') go('#/distributor'); else render();
}
function initHeader() {
  $('#pilih-mata-uang').innerHTML = CURRENCIES.map((c) => `<option>${c}</option>`).join('');
  $('#pilih-bahasa').addEventListener('change', (e) => setLang(e.target.value));
  $('#pilih-mata-uang').addEventListener('change', (e) => { S.cur = e.target.value; save(); catat('ubah_mata_uang', S.cur); render(); });
  $('#pilih-peran').addEventListener('change', (e) => setRole(e.target.value));
  $('#tombol-lokasi').addEventListener('click', () => localeModal(false));
  $('#menu-toggle').addEventListener('click', () => {
    const n = $('#nav-utama'); n.classList.toggle('buka');
    $('#menu-toggle').setAttribute('aria-expanded', n.classList.contains('buka'));
  });
}

window.App = {
  render,
  mulaiTugas() {
    // tugas riset: mulai dari halaman utama dengan proyek kafe kosong
    S.cart = { lines: [], ctx: null, notes: '' };
    S.locale = null;
    newProject(LANG === 'id' ? 'Tugas: layout kafe' : 'Task: café layout', null);
    estSnapshot = null; breakdownOpen = false; coStep = 0;
    go('#/home');
    render();
    localeModal(true);
  },
};

initHeader();
initChat();
route = parseRoute();
render();
if (!S.locale && !['view'].includes(route.name)) localeModal(true);
