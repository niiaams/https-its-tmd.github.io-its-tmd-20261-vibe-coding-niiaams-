# Templat prompt pertama

Salin, isi bagian dalam kurung siku dari `GULUNGAN-MISI.md`, lalu kirim di **Plan mode**. Karena `AGENTS.md` sudah memuat aturan teknis, prompt Anda cukup berfokus pada isi prototipe.

```
Ubah starter di repositori ini menjadi prototipe untuk menguji klaim:
[KLAIM].
Pengguna melakukan: [INTERAKSI INTI].
Sediakan dua kondisi yang bisa dipilih: [KONDISI A] dan [KONDISI B].
Catat dengan fungsi catat(): [DATA YANG DICATAT].
Bagian yang boleh palsu: [YANG BOLEH PALSU].
Gunakan warna [WARNA] dan font [FONT].
Tampilkan rencana kerja dulu dan tunggu persetujuan saya.
```

## Tambahan sesuai jalur prototipe

**Fitur AI** (asisten, rekomendasi, ringkasan):

```
Fitur AI disimulasikan: siapkan lima jawaban tertulis yang dipilih
berdasarkan kata kunci dari input pengguna, dan beri label "Simulasi AI" di layar.
```

**Imersif dan spasial** (AR, MR, ruang interaktif, proyeksi, soundscape):

```
Simulasikan di browser: foto atau video lokasi dengan titik informasi
yang bisa diketuk, atau adegan 3D sederhana dengan three.js.
Gerak tubuh diwakili kursor.
```

**WebXR** (setelah versi browser berjalan):

```
Buat versi WebXR dari prototipe ini dengan A-Frame 1.6.0 di folder xr/,
dengan pola seperti eksplorasi/webxr/index.html. Pertahankan pencatatan data.
```

## Prompt perbaikan (Fast mode)

Satu prompt, satu perbaikan. Contoh:

```
Data skor belum tercatat saat tombol skor ditekan. Perbaiki hanya bagian itu.
```
