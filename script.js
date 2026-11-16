// Starter prototipe Hokage XR Academy.
// Pola utamanya: kondisi pembanding, interaksi inti, lalu catat(kejadian, detail).
// Saat mengubah prototipe, pertahankan fungsi catat() dan unduhCSV().

const KUNCI_SIMPAN = 'vibe-coding-log';
const stage = document.getElementById('stage');
const isiLog = document.getElementById('isi-log');
const inputPeserta = document.getElementById('kode-peserta');

let kondisi = 'A';
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

// === Kontrol sesi ===

document.querySelectorAll('.seg').forEach((tombol) => {
  tombol.addEventListener('click', () => {
    document.querySelectorAll('.seg').forEach((t) => t.classList.remove('aktif'));
    tombol.classList.add('aktif');
    kondisi = tombol.dataset.kondisi;
  });
});

document.getElementById('tombol-mulai').addEventListener('click', () => {
  waktuMulai = performance.now();
  catat('mulai_tugas');
  tampilkanPrototipe();
});

document.getElementById('tombol-unduh').addEventListener('click', unduhCSV);

document.getElementById('tombol-hapus').addEventListener('click', () => {
  if (!confirm('Hapus semua data yang tercatat di browser ini?')) return;
  log = [];
  simpanLog();
  isiLog.innerHTML = '';
});

// === Area prototipe (ganti bagian ini dengan prototipe Anda) ===

function tampilkanPrototipe() {
  const cerita = kondisi === 'B'
    ? `<div class="cerita">
         <strong>Cerita bahan</strong>
         <p>Kunyit kami dipanen petani di lereng Gunung Wilis, lalu dijemur dan digiling dalam 48 jam.</p>
       </div>`
    : '';

  stage.innerHTML = `
    <article class="produk">
      <h3>Jamu Kita: Kunyit Asam</h3>
      <p class="harga">Rp18.000 per botol</p>
      ${cerita}
      <button type="button" class="sekunder" id="lihat-bahan">Lihat bahan</button>
      <div id="wadah-bahan"></div>
      <button type="button" class="primer" id="sudah-temukan">Saya sudah menemukan asal bahan</button>
    </article>`;

  document.getElementById('lihat-bahan').addEventListener('click', () => {
    catat('buka_bahan');
    document.getElementById('wadah-bahan').innerHTML =
      '<div class="detail-bahan">Bahan utama: kunyit dari Gunung Wilis, asam jawa, gula aren.</div>';
  });

  document.getElementById('sudah-temukan').addEventListener('click', () => {
    catat('temukan_asal_bahan');
    tanyaSkor();
  });
}

function tanyaSkor() {
  stage.innerHTML = `
    <p><strong>Seberapa percaya Anda pada produk ini?</strong> (1 = tidak percaya, 5 = sangat percaya)</p>
    <div class="skala">
      ${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-skor="${n}">${n}</button>`).join('')}
    </div>`;
  stage.querySelectorAll('[data-skor]').forEach((tombol) => {
    tombol.addEventListener('click', () => {
      catat('skor_kepercayaan', tombol.dataset.skor);
      catat('selesai_tugas');
      stage.innerHTML = '<p class="selesai">Terima kasih. Tugas selesai dan data sudah tercatat.</p>';
      waktuMulai = null;
    });
  });
}

// Tampilkan log yang tersimpan sebelumnya.
log.forEach(tambahBarisTabel);
