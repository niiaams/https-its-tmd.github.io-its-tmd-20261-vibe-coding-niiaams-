# Aturan kerja untuk agen AI

File ini dibaca otomatis oleh agen Antigravity (dan agen lain yang mendukung `AGENTS.md`) setiap kali sesi dimulai. Mahasiswa boleh menambah aturan di bagian **Konteks proyek saya**.

## Peran dan cara kerja

- Anda membantu mahasiswa S-2 Desain yang bukan programmer membangun **prototipe riset**. Tujuan prototipe adalah menghasilkan bukti untuk sebuah klaim, bukan tampil sempurna.
- Selalu **tampilkan rencana kerja lebih dulu** dan tunggu persetujuan sebelum menulis atau mengubah kode.
- Jelaskan rencana dan perubahan dalam **Bahasa Indonesia** yang sederhana.
- Kerjakan perubahan sekecil mungkin yang memenuhi permintaan. Jangan menambah fitur yang tidak diminta, seperti login, database, akun pengguna, atau animasi berlebihan.

## Batasan teknis

- Prototipe harus **statis** dan bisa ditayangkan di GitHub Pages: HTML, CSS, dan JavaScript biasa. Tanpa server, tanpa proses build, tanpa `npm install`.
- `index.html` harus tetap berada di tingkat teratas repositori.
- Gunakan **alamat file relatif** (`./gambar/logo.png`), jangan alamat lokal seperti `C:/Users/...`.
- Nama file dan folder: huruf kecil, tanpa spasi, tidak diawali garis bawah.
- Pustaka luar boleh dimuat dari CDN dengan **versi yang dikunci**, misalnya `three@0.160.0` atau `aframe 1.6.0`.
- Jangan pernah menulis **kunci API** atau rahasia apa pun ke dalam file. Bila fitur AI dibutuhkan, buat **simulasi**: jawaban tertulis yang dipilih berdasarkan kata kunci, dengan label "Simulasi AI" di layar.

## Pencatatan data (wajib dipertahankan)

- Pertahankan fungsi `catat(kejadian, detail)` dan `unduhCSV()` di `script.js`, beserta tabel log dan tombol **Unduh CSV**.
- Setiap interaksi penting dalam prototipe harus memanggil `catat()`, sesuai kolom "Data yang dicatat" di `GULUNGAN-MISI.md`.
- Pertahankan pilihan **kondisi pembanding** sesuai `GULUNGAN-MISI.md`.
- Data hanya disimpan di browser pengguna. Jangan mengirim data ke layanan luar dan jangan menyimpan file CSV ke repositori.

## Etika

- Gunakan **data rekaan** untuk semua contoh isi. Jangan memasukkan data pribadi responden.
- Jangan memakai karakter, logo, atau aset berhak cipta. Buat ilustrasi atau placeholder orisinal.
- Untuk topik sensitif (kekerasan, anak, kesehatan), gunakan bahasa yang hati-hati dan sertakan keterangan bahwa isi bersifat fiktif.

## Sebelum menyatakan selesai

1. Pastikan `index.html` terbuka tanpa galat di browser.
2. Pastikan kedua kondisi bisa dipilih dan data tercatat di tabel.
3. Pastikan tombol **Unduh CSV** menghasilkan file.
4. Ringkas perubahan dalam satu kalimat yang bisa dipakai sebagai catatan commit.

## Konteks proyek saya

<!-- Mahasiswa: isi bagian ini. Contoh:
- Klaim: ...
- Pengguna sasaran: ...
- Warna utama: #..., font: ...
- Hal yang tidak boleh diubah: ...
-->

- Proyek: prototipe platform B2B **ROBRIES** (recycle sheet & recycle furniture dari 100% plastik daur ulang). Alur: Explore → Configure 3D → Place & Specify → Estimate → Convert (checkout/DP atau kirim ke Sales).
- Struktur: `index.html`, `style.css`, `script.js` (catat/unduhCSV + panel riset), `js/data.js` (katalog & aturan default), `js/i18n.js` (EN/ID, siap JA), `js/engine.js` (harga & lead time), `js/app.js` (halaman), `js/configurator.js` (three.js 0.160.0 via importmap unpkg).
- Kondisi pembanding: A = estimasi atas permintaan, B = estimasi real-time. Dipilih di "Panel riset" (pojok kiri bawah).
- Brand: ocean blue (#0f5e8c) + terracotta (#c4623a), font Roboto. Warna material mengikuti RPS Material Colorways (`gambar/warna/`).
- Harga produk dari Pricelist Nov 2024; data lain (spesifikasi, ongkir, distributor, proyek bertanda fiktif) adalah rekaan.

