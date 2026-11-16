// Mesin harga & waktu produksi. Semua angka dari RULES (bisa diubah Admin).
const PMAP = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
const CMAP = Object.fromEntries(COLORS.map((c) => [c.id, c]));

function itemDims(it) {
  const p = PMAP[it.pid];
  return it.size === 'custom' && it.dims ? it.dims : p.dims;
}

// Status custom: 'standard' | 'custom' (dalam rentang, harga rumus) | 'review' (di luar rentang / custom element)
function itemCustomState(it) {
  const p = PMAP[it.pid];
  if (p.alwaysCustom) return 'review';
  if (it.size !== 'custom' || !it.dims) return 'standard';
  const out = it.dims.some((d, i) => d < p.minDims[i] || d > p.maxDims[i]);
  return out ? 'review' : 'custom';
}

function itemUnitPrice(it, R) {
  const p = PMAP[it.pid];
  const base = R.prices[p.id] ?? p.price;
  let core = base;
  const state = itemCustomState(it);
  if (state !== 'standard') {
    const d = itemDims(it);
    const ratio = p.sheet || p.cat === 'wallpanel'
      ? (d[0] * d[1]) / (p.dims[0] * p.dims[1]) * (p.sheet ? d[2] / p.dims[2] : 1)
      : (d[0] * d[1] * d[2]) / (p.dims[0] * p.dims[1] * p.dims[2]);
    core = Math.max(base * Math.pow(ratio, R.custom.exponent), R.custom.minCharge) + R.custom.fee;
  }
  const matMult = (R.materials[it.mat] || { mult: 1 }).mult;
  const finPct = (R.finishes[it.finish] || { pct: 0 }).pct;
  const colorS = (R.colors[it.color] || { surcharge: 0 }).surcharge;
  // tambahan warna spesial: maks 15% harga dasar untuk produk kecil
  const colorAdd = Math.min(colorS, base * 0.15);
  let unit = core * matMult * (1 + finPct / 100) + colorAdd;
  (it.addons || []).forEach((a) => {
    const r = R.addons[a];
    if (!r) return;
    unit += r.flat ? r.flat : (unit * r.pct) / 100;
  });
  return Math.round(unit);
}

function itemWeightKg(it) {
  const p = PMAP[it.pid];
  const d = itemDims(it);
  const f = (d[0] * d[1] * d[2]) / (p.dims[0] * p.dims[1] * p.dims[2]);
  return (p.w * f) / 1000;
}
function itemRecycledKg(it) {
  const p = PMAP[it.pid];
  const d = itemDims(it);
  const f = (d[0] * d[1] * d[2]) / (p.dims[0] * p.dims[1] * p.dims[2]);
  return (p.g * f) / 1000;
}

function specKey(it) {
  return [it.pid, it.size === 'custom' ? (it.dims || []).join('x') : 'std', it.mat, it.color, it.finish, (it.addons || []).slice().sort().join('+')].join('|');
}

function buildBoQ(items, R) {
  const rows = {};
  items.forEach((it) => {
    const k = specKey(it);
    if (!rows[k]) rows[k] = { key: k, it, qty: 0, unit: itemUnitPrice(it, R), state: itemCustomState(it) };
    rows[k].qty++;
  });
  return Object.values(rows).map((r) => ({ ...r, sub: r.unit * r.qty }));
}

// ctx: { country, zone, incoterm, priceList, override:{pct} }
function estimate(project, R) {
  const items = project.items;
  const ctx = project.ctx;
  const boq = buildBoQ(items, R);
  const goods = boq.reduce((s, r) => s + r.sub, 0);

  // diskon jumlah per produk
  const perProduct = {};
  boq.forEach((r) => { perProduct[r.it.pid] = perProduct[r.it.pid] || { qty: 0, sub: 0 }; perProduct[r.it.pid].qty += r.qty; perProduct[r.it.pid].sub += r.sub; });
  let qtyDisc = 0;
  Object.values(perProduct).forEach((pp) => {
    const tier = R.qtyTiers.filter((tr) => pp.qty >= tr.min).pop();
    if (tier) qtyDisc += (pp.sub * tier.pct) / 100;
  });
  const listPct = R.priceLists[ctx.priceList] || 0;
  const listDisc = ((goods - qtyDisc) * listPct) / 100;
  const net = goods - qtyDisc - listDisc;

  const domestic = ctx.country === 'ID';
  const packaging = (net * (domestic ? R.packagingPct.domestic : R.packagingPct.export)) / 100;
  const kg = items.reduce((s, it) => s + itemWeightKg(it), 0) * 1.25; // + kemasan
  let shipping = 0, insurance = 0, duty = 0, tax = 0, transit = [0, 0], shipNote = '';
  if (domestic) {
    const z = R.domesticZones[ctx.zone] || Object.values(R.domesticZones)[0];
    shipping = items.length ? Math.max(z.min, kg * z.rateKg) : 0;
    tax = ((net + packaging + shipping) * R.taxPPN) / 100;
    transit = z.transit;
    shipNote = z.en;
  } else {
    const e = R.export[ctx.country];
    const fob = items.length ? e.fobFee : 0;
    shipping = fob;
    if (ctx.incoterm !== 'FOB') {
      shipping += kg * e.freightKg;
      insurance = ((net + packaging + shipping) * R.insurancePct) / 100;
    }
    if (ctx.incoterm === 'DDP') {
      const cif = net + packaging + shipping + insurance;
      duty = (cif * e.duty) / 100 + (items.length ? R.clearanceFee : 0);
      tax = ((cif + duty) * e.vat) / 100;
    }
    transit = e.transit;
    shipNote = `${ctx.incoterm} ${ctx.incoterm === 'FOB' ? 'Jakarta' : e.port}`;
  }
  let total = net + packaging + shipping + insurance + duty + tax;
  const overridePct = (project.override && Number(project.override.pct)) || 0;
  const override = (-total * overridePct) / 100;
  total += override;

  const hasReview = boq.some((r) => r.state === 'review');
  const hasCustom = boq.some((r) => r.state !== 'standard');
  const valid = new Date(Date.now() + R.validityDays * 864e5);
  return {
    boq, goods, qtyDisc, listDisc, listPct, net, packaging, shipping, insurance, duty, tax, override, overridePct, total,
    kgShip: kg, transit, shipNote, hasReview, hasCustom, valid,
    units: items.length,
    recycledKg: items.reduce((s, it) => s + itemRecycledKg(it), 0),
    lead: leadTime(items, R, transit),
  };
}

function leadTime(items, R, transit) {
  if (!items.length) return null;
  let maxItem = 0;
  items.forEach((it) => {
    let d = R.days[it.pid] ?? PMAP[it.pid].days;
    const col = R.colors[it.color];
    if (col && !col.stock) d += R.sourcingDays;
    if (itemCustomState(it) !== 'standard') d += R.custom.extraDays;
    maxItem = Math.max(maxItem, d);
  });
  const loadDays = Math.ceil(items.length / R.capacityPerDay);
  const prod = Math.round((maxItem + loadDays) * (1 + (R.productionLoad / 100) * 0.6));
  const qc = R.qcDays + R.packDays;
  const shipMin = prod + qc;
  const shipMax = Math.round(shipMin * 1.25);
  return { maxItem, loadDays, prod, qc, shipMin, shipMax, transit };
}

function toCur(idr, cur, R) {
  return idr / (R.fx[cur] || 1);
}
function fmt(idr, cur, R) {
  const v = toCur(idr, cur, R);
  const dig = cur === 'IDR' || cur === 'JPY' ? 0 : 0;
  try {
    return new Intl.NumberFormat(LANG === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: cur, maximumFractionDigits: dig }).format(v);
  } catch (e) {
    return cur + ' ' + Math.round(v).toLocaleString();
  }
}
function weeks(days) { return Math.max(1, Math.round(days / 7)); }
