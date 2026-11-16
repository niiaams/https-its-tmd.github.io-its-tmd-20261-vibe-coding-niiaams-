# Jurnal Prompt

Catat setiap prompt penting dan keputusan Anda atas rencana agen. Jurnal ini menunjukkan bahwa Anda yang mengarahkan agen, bukan sebaliknya, menjadi bahan untuk `REFLEKSI.md`, dan dinilai sebagai jejak proses (komponen A3).

Salin blok di bawah untuk setiap entri baru. Entri terbaru di atas.

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
