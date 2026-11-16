// Pencatatan data riset (WAJIB dipertahankan): catat(kejadian, detail) dan unduhCSV().
// Kondisi pembanding:
//   A = konfigurator tanpa estimasi real-time (harga & lead time baru muncul setelah "Hitung estimasi")
//   B = estimasi harga, lead time, dan penghitung keberlanjutan tampil langsung di setiap perubahan
// Data hanya disimpan di browser ini (localStorage), tidak dikirim ke mana pun.

const KUNCI_SIMPAN = 'vibe-coding-log';
const KUNCI_KONDISI = 'robries-kondisi';
const isiLog = document.getElementById('isi-log');
const inputPeserta = document.getElementById('kode-peserta');

let kondisi = (() => { try { return localStorage.getItem(KUNCI_KONDISI) || 'B'; } catch (e) { return 'B'; } })();
let waktuMulai = null;
let log = muatLog();

// === Pencatatan data ===

function catat(kejadian, detail = '') {
  const baris = {
    waktu: new Date().toISOString(),
    peserta: inputPeserta.value.trim() || 'tanpa-kode',
    kondisi,
    kejadian,
    detail: String(detail),
    ms: waktuMulai ? Math.round(performance.now() - waktuMulai) : 0,
  };
  log.push(baris);
  simpanLog();
  tambahBarisTabel(baris);
}
window.catat = catat; // agar bisa dipanggil dari kode lain

function tambahBarisTabel(b) {
  const tr = document.createElement('tr');
  [b.waktu.slice(11, 19), b.peserta, b.kondisi, b.kejadian, b.detail, b.ms].forEach((nilai) => {
    const td = document.createElement('td');
    td.textContent = nilai;
    tr.appendChild(td);
  });
  isiLog.prepend(tr);
}

function muatLog() {
  try {
    return JSON.parse(localStorage.getItem(KUNCI_SIMPAN)) || [];
  } catch (e) {
    return [];
  }
}

function simpanLog() {
  try {
    localStorage.setItem(KUNCI_SIMPAN, JSON.stringify(log));
  } catch (e) {
    // Penyimpanan browser tidak tersedia; data tetap ada selama halaman terbuka.
  }
}

function unduhCSV() {
  const kolom = ['waktu', 'peserta', 'kondisi', 'kejadian', 'detail', 'ms'];
  const aman = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const isi = [kolom.join(',')]
    .concat(log.map((b) => kolom.map((k) => aman(b[k])).join(',')))
    .join('\n');
  const blob = new Blob([isi], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `data-prototipe-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// === Kontrol sesi (panel riset) ===

function tandaiKondisi() {
  document.querySelectorAll('.seg').forEach((t) => t.classList.toggle('aktif', t.dataset.kondisi === kondisi));
  document.body.dataset.kondisi = kondisi;
}
tandaiKondisi();

document.querySelectorAll('.seg').forEach((tombol) => {
  tombol.addEventListener('click', () => {
    kondisi = tombol.dataset.kondisi;
    try { localStorage.setItem(KUNCI_KONDISI, kondisi); } catch (e) { /* abaikan */ }
    tandaiKondisi();
    catat('ganti_kondisi', kondisi);
    if (window.App) window.App.render();
  });
});

document.getElementById('tombol-mulai').addEventListener('click', () => {
  waktuMulai = performance.now();
  catat('mulai_tugas', 'Rancang kafe 8×6 m, lalu checkout atau kirim ke Sales');
  document.getElementById('panel-riset').classList.remove('buka');
  if (window.App) window.App.mulaiTugas();
});

document.getElementById('tombol-unduh').addEventListener('click', unduhCSV);

document.getElementById('tombol-hapus').addEventListener('click', () => {
  if (!confirm('Hapus semua data yang tercatat di browser ini?')) return;
  log = [];
  simpanLog();
  isiLog.innerHTML = '';
});

document.getElementById('buka-riset').addEventListener('click', () => {
  document.getElementById('panel-riset').classList.toggle('buka');
});
document.getElementById('tutup-riset').addEventListener('click', () => {
  document.getElementById('panel-riset').classList.remove('buka');
});

// Skor keyakinan setelah konversi (dipanggil dari app.js)
function tanyaSkor(konteks) {
  const wadah = document.getElementById('skor-wadah');
  wadah.innerHTML = `
    <div class="skor-kartu" role="dialog" aria-label="Skor keyakinan">
      <p><strong>Seberapa yakin Anda melanjutkan proyek ini dengan informasi yang tersedia?</strong><br>
      <small>How confident are you to proceed with this project? (1 = not at all, 5 = very)</small></p>
      <div class="skala">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-skor="${n}">${n}</button>`).join('')}</div>
    </div>`;
  wadah.hidden = false;
  wadah.querySelectorAll('[data-skor]').forEach((b) => b.addEventListener('click', () => {
    catat('skor_keyakinan', `${b.dataset.skor} (${konteks})`);
    catat('selesai_tugas', konteks);
    waktuMulai = null;
    wadah.hidden = true;
    wadah.innerHTML = '';
  }));
}
window.tanyaSkor = tanyaSkor;

// Tampilkan log yang tersimpan sebelumnya.
log.forEach(tambahBarisTabel);
