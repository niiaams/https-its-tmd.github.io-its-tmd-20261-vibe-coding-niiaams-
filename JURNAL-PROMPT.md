# Jurnal Prompt

Catat setiap prompt penting dan keputusan Anda atas rencana agen. Jurnal ini menunjukkan bahwa Anda yang mengarahkan agen, bukan sebaliknya, menjadi bahan untuk `REFLEKSI.md`, dan dinilai sebagai jejak proses (komponen A3).

Salin blok di bawah untuk setiap entri baru. Entri terbaru di atas.

---

### Entri 2

- **Tanggal:** 2026-11-19
- **Alat:** Claude Code (plan dulu, lalu eksekusi)
- **Prompt:**

```
Hal yang disalahpahami: fitur konfigurasi adalah fitur tambahan, bukan jalur utama pembelian.
Update: tombol "add to cart" di produk; produk di konfigurator 3D tidak bisa keluar dinding; penawaran harus dibayar (min. DP) sebelum jadi pesanan;
negara & mata uang dipilih lewat popup di awal dan dikunci saat checkout; tanggal estimasi muncul di tracking order;
status pesanan: deposit received, produksi, packing, shipping, delivered; hapus opsi akun trade & grosir.
Kondisi A: tetap seperti sekarang tanpa memunculkan harga produk sama sekali. Kondisi B: bisa langsung checkout tanpa dan melalui konfigurasi.
```

- **Ringkasan rencana agen:** keranjang sebagai jalur utama, batas dinding di 3D, pembayaran penawaran, popup negara/mata uang + kunci mata uang, jadwal perkiraan per tahap, 5 tahap status, hapus opsi trade/grosir; kondisi A/B disesuaikan.
- **Keputusan saya:** setuju, dengan definisi ulang kondisi A/B.
- **Alasan dan koreksi yang saya berikan:** konfigurator bukan jalur wajib; harga adalah variabel yang dibandingkan.
- **Hasil:** keranjang & checkout tanpa konfigurasi, kondisi A tanpa harga, penawaran wajib bayar, mata uang terkunci, tracking dengan tanggal.
- **Hal yang disalahpahami agen:** menjadikan konfigurator 3D sebagai jalur utama pembelian.
- **Catatan commit:** Tambah keranjang & checkout tanpa konfigurasi, kondisi A tanpa harga, batas dinding 3D, pembayaran penawaran, popup negara/mata uang terkunci, dan jadwal di tracking pesanan.

---

### Entri 1

- **Tanggal:** 2026-11-16
- **Alat:** Claude Code (plan dulu, lalu eksekusi)
- **Prompt:**

```
Build an end-to-end web platform for ROBRIES, a premium B2B manufacturer of recycled-material building products and furniture ...
(explore → configure 3D → place & specify → estimate → convert; akun & peran; admin; analitik; desain ocean blue/terracotta, Roboto; EN/ID)
Lampiran: Pricelist Product (Retail) & Pricelist Material (PDF), 5 foto proyek, gambar RPS Material Colorways.
```

- **Ringkasan rencana agen:** situs statis satu halaman, three.js untuk layout 3D, mesin harga/lead time yang aturannya bisa diedit Admin, pembayaran/login/AI disimulasikan, kondisi A/B = estimasi atas permintaan vs real-time.
- **Keputusan saya:** setuju; warna mengikuti gambar Colorways; robries.com dijadikan acuan (tidak bisa diakses dari sesi agen).
- **Alasan dan koreksi yang saya berikan:** (isi sendiri)
- **Hasil:** prototipe v0.1 platform B2B ROBRIES dengan konfigurator 3D, BoQ, estimasi, checkout simulasi, kirim ke Sales, dashboard peran, dan log CSV.
- **Hal yang disalahpahami agen:** (isi sendiri)
- **Catatan commit:** Bangun prototipe platform B2B ROBRIES (katalog, material, konfigurator 3D, estimasi harga & lead time real-time, checkout/Sales, peran & admin) dengan kondisi A/B dan log CSV.
