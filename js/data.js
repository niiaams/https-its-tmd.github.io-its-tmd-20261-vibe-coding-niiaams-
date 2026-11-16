// ROBRIES · data katalog dan aturan default.
// Harga produk & lembaran RPS diambil dari Pricelist (Nov 2024). Data lain (spesifikasi teknis,
// hari produksi, ongkir, distributor, kurs) adalah DATA REKAAN untuk prototipe.
// Admin dapat mengubah aturan di panel Admin; perubahan disimpan di browser (localStorage).

const SEGMENTS = [
  { id: 'cafe', en: 'Café & F&B', idn: 'Kafe & F&B' },
  { id: 'hotel', en: 'Hotel & Resort', idn: 'Hotel & Resort' },
  { id: 'office', en: 'Office', idn: 'Kantor' },
  { id: 'school', en: 'School & Institution', idn: 'Sekolah & Institusi' },
  { id: 'outdoor', en: 'Outdoor & Public', idn: 'Luar ruang & Publik' },
  { id: 'retail', en: 'Retail', idn: 'Ritel' },
];

const CUSTOMER_SEGMENTS = [
  { id: 'fnb', en: 'F&B', idn: 'F&B' },
  { id: 'architect', en: 'Architect / Interior Designer', idn: 'Arsitek / Desainer Interior' },
  { id: 'institution', en: 'Institution', idn: 'Institusi' },
  { id: 'hospitality', en: 'Hospitality', idn: 'Hospitality' },
  { id: 'wholesale', en: 'Wholesale / Retailer', idn: 'Grosir / Peritel' },
];

const CATEGORIES = [
  { id: 'sheet', en: 'Recycled sheet', idn: 'Lembaran daur ulang' },
  { id: 'table', en: 'Table', idn: 'Meja' },
  { id: 'chair', en: 'Chair', idn: 'Kursi' },
  { id: 'stool', en: 'Stool', idn: 'Bangku' },
  { id: 'bench', en: 'Bench', idn: 'Bangku panjang' },
  { id: 'planter', en: 'Planter', idn: 'Pot tanaman' },
  { id: 'wallpanel', en: 'Wall panel', idn: 'Panel dinding' },
  { id: 'decor', en: 'Home decor', idn: 'Dekorasi' },
  { id: 'custom', en: 'Custom', idn: 'Custom' },
];

// dims: [panjang, lebar, tinggi] dalam mm. g = gram plastik daur ulang. w = berat produk (gram).
const PRODUCTS = [
  { id: 'raw-chair', name: 'Raw Chair', cat: 'chair', segs: ['cafe', 'hotel', 'office'], io: 'indoor', dims: [500, 510, 765], g: 5184, w: 8700, price: 2152500, days: 14, shape: 'chair', frame: true,
    en: 'Sculptural lounge chair with organic recycled-plastic seat and back on a hand-forged steel frame.', idn: 'Kursi santai berbentuk organik dengan dudukan dan sandaran plastik daur ulang di atas rangka baja.' },
  { id: 'anyer-chair', name: 'Anyer Dining Chair', cat: 'chair', segs: ['cafe', 'hotel', 'office', 'school'], io: 'indoor', dims: [430, 500, 785], g: 6840, w: 9500, price: 1753500, days: 14, shape: 'chair', frame: true,
    en: 'Stackable-profile dining chair. A durable recycle furniture classic for cafés and canteens.', idn: 'Kursi makan dengan profil ramping. Recycle furniture yang awet untuk kafe dan kantin.' },
  { id: 'klayar-table', name: 'Klayar Round Table', cat: 'table', segs: ['cafe', 'hotel', 'office'], io: 'indoor', dims: [600, 600, 750], round: true, g: 6785, w: 17654, price: 2152500, days: 18, shape: 'roundtable', frame: true,
    en: 'Ø60 cm bistro table: recycled sheet top on a powder-coated pedestal.', idn: 'Meja bistro Ø60 cm: top lembaran daur ulang dengan kaki pedestal powder coat.' },
  { id: 'glagah-counter-stool', name: 'Glagah Counter Stool', cat: 'stool', segs: ['cafe', 'hotel'], io: 'indoor', dims: [400, 360, 950], seat: 600, round: true, g: 5160, w: 10000, price: 2047500, days: 14, shape: 'stoolback', frame: true,
    en: 'Counter-height stool (seat 60 cm) with backrest and footrest.', idn: 'Stool setinggi meja counter (dudukan 60 cm) dengan sandaran dan pijakan kaki.' },
  { id: 'glagah-bar-stool', name: 'Glagah Bar Stool', cat: 'stool', segs: ['cafe', 'hotel'], io: 'indoor', dims: [480, 410, 870], seat: 740, round: true, g: 2873, w: 8600, price: 1564500, days: 12, shape: 'stoolframe', frame: true,
    en: 'Bar-height stool (seat 74 cm) with footrest ring.', idn: 'Stool setinggi bar (dudukan 74 cm) dengan pijakan kaki.' },
  { id: 'glagah-stool', name: 'Glagah Stool', cat: 'stool', segs: ['cafe', 'school', 'office'], io: 'indoor', dims: [300, 360, 420], seat: 420, round: true, g: 1697, w: 3700, price: 1018500, days: 12, shape: 'stoolframe', frame: true,
    en: 'Low stool on a slim steel frame. Light, stackable, and easy to move.', idn: 'Stool rendah dengan rangka baja ramping. Ringan dan mudah dipindah.' },
  { id: 'sawarna-stool', name: 'Sawarna Stool', cat: 'stool', segs: ['cafe', 'school', 'outdoor', 'hotel'], io: 'both', dims: [280, 400, 438], round: true, g: 7800, w: 5500, price: 1249500, days: 12, shape: 'crossstool',
    en: 'Fully recycled stool with slotted cross legs. No metal, 100% recycled plastic.', idn: 'Stool full plastik daur ulang dengan kaki silang. Tanpa logam, 100% plastik daur ulang.' },
  { id: 'sawarna-low-table', name: 'Sawarna Low Table', cat: 'table', segs: ['hotel', 'cafe', 'outdoor'], io: 'both', dims: [700, 700, 440], round: true, g: 18000, w: 15000, price: 2751000, days: 18, shape: 'crosstable',
    en: 'Ø70 cm coffee table, flat-packed with slotted legs. Ideal outdoor furniture for terraces.', idn: 'Meja kopi Ø70 cm, bisa dibongkar pasang. Outdoor furniture ideal untuk teras.' },
  { id: 'mada-bench', name: 'Mada Bench', cat: 'bench', segs: ['school', 'outdoor', 'office', 'hotel'], io: 'both', dims: [950, 450, 400], g: 13200, w: 11800, price: 2436000, days: 16, shape: 'bench',
    en: 'Monolithic folded bench made from thick recycled sheet. Indoor or outdoor.', idn: 'Bangku panjang monolitik dari lembaran tebal daur ulang. Untuk dalam atau luar ruang.' },
  { id: 'ambeng-table', name: 'Ambeng Table', cat: 'table', segs: ['school', 'cafe', 'outdoor'], io: 'both', dims: [400, 400, 450], g: 8400, w: 7000, price: 1270500, days: 16, shape: 'crosstable',
    en: 'Square side table with interlocking legs. A kid-friendly, school-ready height.', idn: 'Meja samping persegi dengan kaki saling kunci. Tinggi ramah anak untuk sekolah.' },
  { id: 'ambeng-stool', name: 'Ambeng Stool', cat: 'stool', segs: ['school', 'cafe', 'outdoor'], io: 'both', dims: [400, 400, 450], round: true, g: 8400, w: 6500, price: 1293600, days: 12, shape: 'crossstool',
    en: 'Round companion stool to the Ambeng table.', idn: 'Stool bundar pasangan meja Ambeng.' },
  { id: 'trash-bin', name: 'Recycled Trash Bin', cat: 'custom', segs: ['outdoor', 'school', 'office', 'retail'], io: 'both', dims: [800, 400, 1000], g: 22000, w: 20000, price: 5000000, days: 21, shape: 'box',
    en: 'Two-compartment waste station with signage panel. Height is an estimate (not in pricelist).', idn: 'Tempat sampah dua kompartemen dengan panel informasi. Tinggi adalah perkiraan (tidak ada di pricelist).' },
  // Lembaran RPS (Pricelist Material)
  { id: 'rps-95-10', name: 'RPS Sheet 95×40×1 cm', cat: 'sheet', segs: ['retail', 'office', 'cafe'], io: 'both', dims: [950, 400, 10], g: 3610, w: 3610, price: 610000, days: 10, shape: 'sheet', sheet: true,
    en: 'Recycle sheet, 1 cm. Recommended for cladding and layering over framework.', idn: 'Recycle sheet 1 cm. Disarankan untuk pelapis dan rangka.' },
  { id: 'rps-95-20', name: 'RPS Sheet 95×40×2 cm', cat: 'sheet', segs: ['retail', 'office', 'cafe'], io: 'both', dims: [950, 400, 20], g: 7220, w: 7220, price: 787500, days: 10, shape: 'sheet', sheet: true,
    en: 'Recycle sheet, 2 cm. Recommended for table and stool tops.', idn: 'Recycle sheet 2 cm. Disarankan untuk top meja dan stool.' },
  { id: 'rps-100-10', name: 'RPS Sheet 100×50×1 cm', cat: 'sheet', segs: ['retail', 'office', 'cafe'], io: 'both', dims: [1000, 500, 10], g: 4750, w: 4750, price: 682500, days: 10, shape: 'sheet', sheet: true,
    en: 'Recycle sheet, 1 cm.', idn: 'Recycle sheet 1 cm.' },
  { id: 'rps-100-20', name: 'RPS Sheet 100×50×2 cm', cat: 'sheet', segs: ['retail', 'office', 'cafe'], io: 'both', dims: [1000, 500, 20], g: 9500, w: 9500, price: 950000, days: 10, shape: 'sheet', sheet: true,
    en: 'Recycle sheet, 2 cm.', idn: 'Recycle sheet 2 cm.' },
  { id: 'rps-120-10', name: 'RPS Sheet 120×60×1 cm', cat: 'sheet', segs: ['retail', 'office', 'cafe', 'hotel'], io: 'both', dims: [1200, 600, 10], g: 6840, w: 6840, price: 866000, days: 10, shape: 'sheet', sheet: true,
    en: 'Largest standard recycle sheet, 1 cm. Larger sizes are made with joints.', idn: 'Recycle sheet standar terbesar, 1 cm. Ukuran lebih besar dibuat dengan sambungan.' },
  { id: 'rps-120-20', name: 'RPS Sheet 120×60×2 cm', cat: 'sheet', segs: ['retail', 'office', 'cafe', 'hotel'], io: 'both', dims: [1200, 600, 20], g: 13680, w: 13680, price: 1312500, days: 10, shape: 'sheet', sheet: true,
    en: 'Largest standard recycle sheet, 2 cm.', idn: 'Recycle sheet standar terbesar, 2 cm.' },
  // Produk rekaan (dummy) agar kategori lengkap
  { id: 'wall-panel', name: 'Wall Panel 120×60', cat: 'wallpanel', segs: ['retail', 'hotel', 'cafe', 'office'], io: 'indoor', dims: [1200, 10, 600], g: 6840, w: 7400, price: 1050000, days: 12, shape: 'panel', dummy: true,
    en: 'RPS cladding panel with concealed mounting kit (dummy product based on the 120×60×1 sheet).', idn: 'Panel pelapis dinding RPS dengan kit pemasangan tersembunyi (produk dummy berbasis sheet 120×60×1).' },
  { id: 'tegal-planter', name: 'Tegal Planter', cat: 'planter', segs: ['outdoor', 'hotel', 'cafe', 'office'], io: 'outdoor', dims: [500, 500, 600], round: true, g: 9800, w: 10500, price: 1850000, days: 14, shape: 'planter', dummy: true,
    en: 'Tapered planter with drainage, UV-stabilised HDPE (dummy product).', idn: 'Pot tanaman meruncing dengan drainase, HDPE stabil UV (produk dummy).' },
  { id: 'pantai-bench', name: 'Pantai Outdoor Bench', cat: 'bench', segs: ['outdoor', 'hotel', 'school'], io: 'outdoor', dims: [1600, 450, 450], g: 24000, w: 26000, price: 4650000, days: 18, shape: 'bench', dummy: true,
    en: 'Long outdoor bench for parks, pool decks and school yards (dummy product).', idn: 'Bangku panjang luar ruang untuk taman, tepi kolam, dan halaman sekolah (produk dummy).' },
  { id: 'custom-block', name: 'Custom Element', cat: 'custom', segs: ['retail', 'hotel', 'cafe', 'office', 'school'], io: 'both', dims: [1000, 500, 750], g: 15000, w: 16000, price: 3500000, days: 21, shape: 'box', alwaysCustom: true,
    en: 'Counter, step, cabinet or installation built to your drawing. Always reviewed by Sales.', idn: 'Counter, anak tangga, kabinet, atau instalasi sesuai gambar Anda. Selalu ditinjau Sales.' },
  // Home decor
  { id: 'arafuru-coaster', name: 'Arafuru Coaster', cat: 'decor', segs: ['cafe', 'hotel', 'retail'], io: 'indoor', dims: [100, 100, 10], round: true, g: 120, w: 100, price: 54600, days: 7, shape: 'decor',
    en: 'Round coaster (square version IDR 56,700).', idn: 'Tatakan gelas bundar (versi kotak IDR 56.700).' },
  { id: 'rote-tray', name: 'Rote Mini Tray', cat: 'decor', segs: ['hotel', 'retail'], io: 'indoor', dims: [90, 90, 15], g: 146, w: 122, price: 65100, days: 7, shape: 'decor', en: 'Mini amenity tray.', idn: 'Nampan mini untuk amenitas.' },
  { id: 'nihi-incense', name: 'Nihi Incense Holder', cat: 'decor', segs: ['hotel', 'retail'], io: 'indoor', dims: [250, 70, 15], g: 315, w: 263, price: 126000, days: 7, shape: 'decor', en: 'Three-stick incense holder.', idn: 'Tempat dupa tiga batang.' },
  { id: 'watu-incense', name: 'Watu Incense Holder', cat: 'decor', segs: ['hotel', 'retail'], io: 'indoor', dims: [120, 120, 15], round: true, g: 173, w: 144, price: 88200, days: 7, shape: 'decor', en: 'Pebble-shaped incense holder.', idn: 'Tempat dupa berbentuk batu.' },
  { id: 'jimbaran-board', name: 'Jimbaran Chopping Board', cat: 'decor', segs: ['cafe', 'hotel', 'retail'], io: 'indoor', dims: [300, 200, 10], g: 720, w: 600, price: 210000, days: 7, shape: 'decor', en: 'Serving & chopping board.', idn: 'Talenan dan papan saji.' },
  { id: 'mola-tissue', name: 'Mola Tissue Box', cat: 'decor', segs: ['cafe', 'hotel', 'office'], io: 'indoor', dims: [240, 120, 140], g: 1050, w: 700, price: 262500, days: 7, shape: 'box', en: 'Tissue box cover.', idn: 'Kotak tisu.' },
];

PRODUCTS.forEach((p) => {
  const img = { 'rps-95-10': 'sheet', 'rps-95-20': 'sheet', 'rps-100-10': 'sheet', 'rps-100-20': 'sheet', 'rps-120-10': 'sheet', 'rps-120-20': 'sheet' }[p.id];
  p.img = p.dummy || p.id === 'custom-block' || img ? null : `./gambar/produk/${p.id}.jpg`;
  p.minDims = p.dims.map((d) => Math.round(d * 0.6));
  p.maxDims = p.dims.map((d) => Math.round(d * (p.sheet ? 2.5 : 1.6)));
  if (p.sheet) { p.minDims[2] = 10; p.maxDims[2] = 20; }
  // spesifikasi teknis indikatif (rekaan)
  p.specs = {
    load: { chair: '120 kg', stool: '110 kg', table: '60 kg (top)', bench: '240 kg', sheet: '—', wallpanel: '—', planter: '—', decor: '—', custom: 'per design' }[p.cat],
    uv: p.io === 'indoor' ? 'Indoor (UV-stabiliser optional)' : 'UV-stabilised HDPE, ~1,000 h QUV (indicative)',
    water: 'Waterproof, non-porous',
    fire: p.sheet || p.cat === 'wallpanel' ? 'Fire rating on request (untested)' : 'n/a',
  };
});

// Warna dari RPS Material Colorways. surcharge = tambahan per item (IDR), stock = tersedia / perlu sourcing.
const COLORS = [
  { id: 'grape', name: 'Grape', type: 'HDPE', group: 'main', hex: '#e6ebe4', stock: true },
  { id: 'marigold', name: 'Marigold', type: 'HDPE', group: 'main', hex: '#c69a2c', stock: true },
  { id: 'chesnut', name: 'Chesnut', type: 'HDPE', group: 'main', hex: '#a9452a', stock: true, pinhole: true },
  { id: 'damson', name: 'Damson', type: 'HDPE', group: 'main', hex: '#dfe7ee', stock: true },
  { id: 'light-terrarium', name: 'Light Terrarium', type: 'HDPE', group: 'main', hex: '#e5ddd2', stock: true },
  { id: 'juniper', name: 'Juniper', type: 'HDPE', group: 'main', hex: '#d7dfe2', stock: true },
  { id: 'white-seed', name: 'White Seed', type: 'HDPE', group: 'main', hex: '#e9ebe8', stock: true, pinhole: true },
  { id: 'bilberry', name: 'Bilberry', type: 'LDPE', group: 'special', hex: '#2a3f86', stock: false },
  { id: 'dark-fungi', name: 'Dark Fungi', type: 'HDPE', group: 'special', hex: '#1e2422', stock: false, pinhole: true },
  { id: 'sage', name: 'Sage', type: 'HDPE', group: 'special', hex: '#a5b77a', stock: false, pinhole: true },
  { id: 'gray-fungi', name: 'Gray Fungi', type: 'LDPE', group: 'special', hex: '#5f676b', stock: false },
  { id: 'peach', name: 'Peach', type: 'HDPE', group: 'special', hex: '#d0705f', stock: false, pinhole: true },
  { id: 'seaweed', name: 'Seaweed', type: 'HDPE', group: 'special', hex: '#1d4a43', stock: false, pinhole: true },
];
COLORS.forEach((c) => { c.img = `./gambar/warna/${c.id}.jpg`; });

const MATERIALS = [
  { id: 'hdpe', name: 'HDPE', code: 2, impact: '214 kg/cm²',
    en: { full: 'High Density Polyethylene', from: 'Bottle caps, crates, shampoo bottles, gallon caps', story: 'Rigid household packaging collected through waste banks and drop points is sorted by colour, washed, shredded and hot-pressed into dense, tough sheets.' },
    idn: { full: 'High Density Polyethylene', from: 'Tutup botol, krat, botol sampo, tutup galon', story: 'Kemasan rumah tangga yang kaku dikumpulkan lewat bank sampah dan titik drop, dipilah per warna, dicuci, dicacah, lalu dipres panas menjadi lembaran padat yang kuat.' },
    divertedKg: 182400 },
  { id: 'ldpe', name: 'LDPE', code: 4, impact: '93 kg/cm²',
    en: { full: 'Low Density Polyethylene', from: 'Flexible plastics, gallon caps, squeezable bottles', story: 'Soft, flexible plastics that are rarely recycled get a second life. LDPE gives a softer, marbled surface and is best for indoor pieces and cladding.' },
    idn: { full: 'Low Density Polyethylene', from: 'Plastik fleksibel, tutup galon, botol remas', story: 'Plastik lunak yang jarang didaur ulang mendapat hidup kedua. LDPE menghasilkan permukaan bermotif marmer, paling cocok untuk produk dalam ruang dan pelapis.' },
    divertedKg: 64700 },
];

const FINISHES = [
  { id: 'matte', en: 'Matte (standard)', idn: 'Matte (standar)' },
  { id: 'satin', en: 'Satin sanded', idn: 'Satin amplas' },
  { id: 'gloss', en: 'Polished gloss', idn: 'Glossy dipoles' },
  { id: 'uv', en: 'Outdoor UV-guard coat', idn: 'Lapisan UV-guard luar ruang' },
];

const ADDONS = [
  { id: 'felt', en: 'Felt floor pads', idn: 'Bantalan kaki felt' },
  { id: 'engrave', en: 'Logo engraving', idn: 'Grafir logo' },
  { id: 'install', en: 'On-site installation (ID only)', idn: 'Pemasangan di lokasi (ID saja)' },
];

const CURRENCIES = ['IDR', 'USD', 'SGD', 'EUR', 'JPY'];

const COUNTRIES = [
  { id: 'ID', en: 'Indonesia', idn: 'Indonesia', tz: 'Asia/Jakarta' },
  { id: 'MY', en: 'Malaysia', idn: 'Malaysia', tz: 'Asia/Kuala_Lumpur' },
  { id: 'SG', en: 'Singapore', idn: 'Singapura', tz: 'Asia/Singapore' },
  { id: 'AU', en: 'Australia', idn: 'Australia', tz: 'Australia/Sydney' },
  { id: 'JP', en: 'Japan', idn: 'Jepang', tz: 'Asia/Tokyo' },
  { id: 'GB', en: 'United Kingdom', idn: 'Inggris', tz: 'Europe/London' },
  { id: 'US', en: 'United States', idn: 'Amerika Serikat', tz: 'America/Los_Angeles' },
];

// Distributor fiktif per negara.
const DEFAULT_DISTRIBUTORS = [
  { id: 'd-my', country: 'MY', name: 'Hijau Living Sdn Bhd (fictional)', city: 'Kuala Lumpur', wa: '60100000000', email: 'sales@hijauliving.example' },
  { id: 'd-sg', country: 'SG', name: 'Circular Spaces Pte Ltd (fictional)', city: 'Singapore', wa: '6580000000', email: 'hello@circularspaces.example' },
  { id: 'd-au', country: 'AU', name: 'Southern Loop Furniture (fictional)', city: 'Sydney', wa: '61400000000', email: 'trade@southernloop.example' },
  { id: 'd-jp', country: 'JP', name: 'Kurumi Design Supply (fictional)', city: 'Tokyo', wa: '81900000000', email: 'info@kurumi.example' },
];

const HQ = { name: 'ROBRIES HQ Sales', city: 'Jakarta', wa: '6281200000000', email: 'sales@robries.example', tz: 'Asia/Jakarta' };

// Aturan default — bisa diubah Admin tanpa mengubah kode.
const DEFAULT_RULES = {
  version: 3,
  validityDays: 14,
  checkoutThresholdUSD: 5000,
  depositPct: 50,
  fx: { IDR: 1, USD: 16200, SGD: 12100, EUR: 17400, JPY: 106 }, // IDR per 1 unit mata uang
  prices: Object.fromEntries(PRODUCTS.map((p) => [p.id, p.price])),
  days: Object.fromEntries(PRODUCTS.map((p) => [p.id, p.days])),
  materials: { hdpe: { mult: 1.0 }, ldpe: { mult: 0.94 } },
  colors: Object.fromEntries(COLORS.map((c) => [c.id, { surcharge: c.group === 'special' ? 100000 : 0, stock: c.stock }])),
  finishes: { matte: { pct: 0 }, satin: { pct: 4 }, gloss: { pct: 10 }, uv: { pct: 8 } },
  addons: { felt: { flat: 25000 }, engrave: { flat: 150000 }, install: { pct: 8 } },
  custom: { fee: 100000, minCharge: 750000, exponent: 0.85, extraDays: 10 },
  sourcingDays: 7,
  qtyTiers: [{ min: 10, pct: 5 }, { min: 25, pct: 8 }, { min: 50, pct: 12 }],
  priceLists: { retail: 0, trade: 10, wholesale: 20, distributor: 30 },
  packagingPct: { domestic: 3, export: 7 },
  capacityPerDay: 18, // unit per hari
  productionLoad: 65, // % beban pabrik saat ini (diisi admin; nanti dari dashboard manufaktur)
  qcDays: 3,
  packDays: 2,
  taxPPN: 11,
  domesticZones: {
    jawa: { en: 'Java', rateKg: 4500, min: 150000, transit: [2, 5] },
    bali: { en: 'Bali & Nusa Tenggara', rateKg: 7500, min: 250000, transit: [4, 8] },
    sumatra: { en: 'Sumatra', rateKg: 8500, min: 300000, transit: [5, 10] },
    kalsul: { en: 'Kalimantan & Sulawesi', rateKg: 11000, min: 350000, transit: [7, 12] },
    timur: { en: 'Maluku & Papua', rateKg: 18000, min: 600000, transit: [12, 21] },
  },
  export: {
    MY: { port: 'Port Klang', fobFee: 3500000, freightKg: 9000, transit: [7, 12], duty: 0, vat: 10 },
    SG: { port: 'Singapore', fobFee: 3500000, freightKg: 8000, transit: [5, 9], duty: 0, vat: 9 },
    AU: { port: 'Sydney', fobFee: 3500000, freightKg: 16000, transit: [14, 21], duty: 5, vat: 10 },
    JP: { port: 'Tokyo', fobFee: 3500000, freightKg: 15000, transit: [12, 18], duty: 0, vat: 10 },
    GB: { port: 'Felixstowe', fobFee: 3500000, freightKg: 24000, transit: [28, 38], duty: 2, vat: 20 },
    US: { port: 'Los Angeles', fobFee: 3500000, freightKg: 22000, transit: [24, 32], duty: 3, vat: 0 },
  },
  insurancePct: 0.5,
  clearanceFee: 2500000,
};

// Template ruang + layout referensi (posisi mm dari sudut ruang, rot derajat).
const TEMPLATES = [
  { id: 'cafe', en: 'Café / Resto', idn: 'Kafe / Resto', room: [8000, 6000, 3000], color: 'chesnut',
    items: [
      ...[[1500, 1500], [3500, 1500], [5500, 1500], [1500, 3800], [3500, 3800], [5500, 3800]].flatMap(([x, z]) => [
        { pid: 'klayar-table', x, z, rot: 0 },
        { pid: 'anyer-chair', x: x - 550, z, rot: 90 },
        { pid: 'anyer-chair', x: x + 550, z, rot: -90 },
      ]),
      { pid: 'mada-bench', x: 7400, z: 2600, rot: 90 },
      { pid: 'tegal-planter', x: 7500, z: 500, rot: 0 },
      { pid: 'trash-bin', x: 7500, z: 5600, rot: 180 },
    ] },
  { id: 'hotel', en: 'Hotel lobby / Resort deck', idn: 'Lobi hotel / Dek resort', room: [10000, 7000, 3500], color: 'seaweed',
    items: [
      ...[[2500, 2500], [6500, 2500], [4500, 5000]].flatMap(([x, z]) => [
        { pid: 'sawarna-low-table', x, z, rot: 0 },
        { pid: 'sawarna-stool', x: x - 700, z, rot: 0 },
        { pid: 'sawarna-stool', x: x + 700, z, rot: 0 },
        { pid: 'raw-chair', x, z: z - 750, rot: 0 },
      ]),
      { pid: 'mada-bench', x: 9300, z: 3500, rot: 90 },
      { pid: 'tegal-planter', x: 500, z: 500, rot: 0 },
      { pid: 'tegal-planter', x: 9500, z: 500, rot: 0 },
      { pid: 'wall-panel', x: 3000, z: 6, rot: 0 }, { pid: 'wall-panel', x: 4200, z: 6, rot: 0 }, { pid: 'wall-panel', x: 5400, z: 6, rot: 0 },
    ] },
  { id: 'classroom', en: 'Classroom', idn: 'Ruang kelas', room: [8000, 7000, 3000], color: 'marigold',
    items: [
      ...[1500, 3000, 4500, 6000].flatMap((x) => [2200, 4200].flatMap((z) => [
        { pid: 'ambeng-table', x, z, rot: 0 },
        { pid: 'ambeng-stool', x, z: z + 550, rot: 0 },
        { pid: 'ambeng-stool', x, z: z - 550, rot: 0 },
      ])),
      { pid: 'mada-bench', x: 4000, z: 6300, rot: 0 },
      { pid: 'trash-bin', x: 7400, z: 6500, rot: 180 },
    ] },
  { id: 'office', en: 'Office / Pantry', idn: 'Kantor / Pantry', room: [9000, 6000, 3000], color: 'damson',
    items: [
      { pid: 'custom-block', x: 4500, z: 600, rot: 0, dims: [3000, 600, 1050] },
      ...[3300, 3900, 4500, 5100, 5700].map((x) => ({ pid: 'glagah-counter-stool', x, z: 1250, rot: 180 })),
      ...[[2000, 3800], [5000, 3800], [7500, 3800]].flatMap(([x, z]) => [
        { pid: 'klayar-table', x, z, rot: 0 },
        { pid: 'glagah-stool', x: x - 520, z, rot: 0 },
        { pid: 'glagah-stool', x: x + 520, z, rot: 0 },
      ]),
      { pid: 'mada-bench', x: 8400, z: 1500, rot: 90 },
      { pid: 'tegal-planter', x: 500, z: 5500, rot: 0 },
    ] },
];

// Galeri proyek (foto 1–4 dari Robries; sisanya ilustrasi tekstur, data rekaan).
const CASE_STUDIES = [
  { id: 'cs1', img: './gambar/proyek/cabinet-wall.jpg', seg: 'school', country: 'ID', year: 2024, color: 'seaweed',
    en: { t: 'Cabinet wall for a learning centre', d: 'Speckled green recycled sheet partitions hold a collection of cultural objects. 2 cm RPS fins on a plywood carcass.' },
    idn: { t: 'Dinding kabinet pusat belajar', d: 'Sirip lembaran daur ulang hijau berbintik menampung koleksi benda budaya. Sirip RPS 2 cm di atas rangka plywood.' }, kg: 420 },
  { id: 'cs2', img: './gambar/proyek/wall-panel-retail.jpg', seg: 'retail', country: 'ID', year: 2023, color: 'damson',
    en: { t: 'Flagship fashion store: wall panels & ring installation', d: 'Column cladding and a circular seating installation made from 100% recycled plastic in blue-speckle Damson.' },
    idn: { t: 'Toko fashion flagship: panel dinding & instalasi cincin', d: 'Pelapis kolom dan instalasi duduk melingkar dari 100% plastik daur ulang warna Damson.' }, kg: 1350 },
  { id: 'cs3', img: './gambar/proyek/tribun-sekolah.jpg', seg: 'school', country: 'ID', year: 2024, color: 'light-terrarium',
    en: { t: 'Reading tribune with bent recycled cover', d: 'Thermo-bent RPS covers and stair steps turn a plywood tribune into a durable reading corner.' },
    idn: { t: 'Tribun baca dengan penutup lengkung daur ulang', d: 'Penutup RPS yang dibengkokkan panas dan anak tangga mengubah tribun plywood menjadi pojok baca yang awet.' }, kg: 610 },
  { id: 'cs4', img: './gambar/proyek/bathroom-tiles.jpg', seg: 'hotel', country: 'ID', year: 2025, color: 'sage',
    en: { t: 'Guest bathroom in recycled tiles', d: 'A patchwork of Seaweed, Sage, Marigold, Damson and Dark Fungi tiles, plus a recycled mirror frame.' },
    idn: { t: 'Kamar mandi tamu dengan ubin daur ulang', d: 'Susunan ubin Seaweed, Sage, Marigold, Damson, dan Dark Fungi, serta bingkai cermin daur ulang.' }, kg: 280 },
  { id: 'cs5', img: null, seg: 'cafe', country: 'SG', year: 2025, color: 'chesnut',
    en: { t: 'Neighbourhood café, Tiong Bahru (fictional)', d: '24 Anyer chairs and 12 Klayar tables in Chesnut, supplied via our Singapore partner.' },
    idn: { t: 'Kafe lingkungan, Tiong Bahru (fiktif)', d: '24 kursi Anyer dan 12 meja Klayar warna Chesnut, dipasok lewat mitra Singapura.' }, kg: 245 },
  { id: 'cs6', img: null, seg: 'outdoor', country: 'AU', year: 2025, color: 'bilberry',
    en: { t: 'Beachfront park furniture, NSW (fictional)', d: 'Pantai benches and Tegal planters in UV-guard HDPE for a coastal council.' },
    idn: { t: 'Furnitur taman tepi pantai, NSW (fiktif)', d: 'Bangku Pantai dan pot Tegal HDPE UV-guard untuk pemerintah daerah pesisir.' }, kg: 1980 },
  { id: 'cs7', img: null, seg: 'office', country: 'JP', year: 2025, color: 'white-seed',
    en: { t: 'Co-working pantry, Tokyo (fictional)', d: 'Custom counter in White Seed with Glagah counter stools.' },
    idn: { t: 'Pantry co-working, Tokyo (fiktif)', d: 'Counter custom warna White Seed dengan stool counter Glagah.' }, kg: 390 },
];
