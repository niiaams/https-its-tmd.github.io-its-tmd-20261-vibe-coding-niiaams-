# Gulungan Misi (Kartu Prototipe)

Isi keenam kolom sebelum meminta agen menulis kode. Kolom 4 adalah jantungnya: data harus **tercatat oleh layar**, bukan dicatat manual oleh peneliti.

| No | Kolom | Isi Anda |
| --- | --- | --- |
| 1 | **Klaim** (dari Tugas 1, satu kalimat) | Estimasi harga, waktu produksi, dan jumlah sampah plastik terdaur ulang yang tampil langsung saat merancang layout 3D meningkatkan keyakinan calon pembeli B2B untuk melanjutkan proyek furnitur daur ulang (checkout atau konsultasi Sales). |
| 2 | **Interaksi inti** (yang wajib ada agar klaim bisa diuji) | Peserta merancang layout kafe di konfigurator 3D (template atau ruang kosong), memilih material/warna/finishing, membaca estimasi, lalu memilih Checkout atau Kirim ke Sales dan memberi skor keyakinan 1–5. |
| 3 | **Kondisi pembanding** (A dan B, sebelum dan sesudah, atau dengan dan tanpa satu fitur kunci) | A: estimasi atas permintaan (harga, lead time, keberlanjutan baru muncul setelah tombol "Hitung estimasi"). B: estimasi real-time di setiap perubahan. |
| 4 | **Data yang dicatat** (waktu, klik, pilihan, kesalahan, skor) | Kondisi, waktu (ms) sejak mulai, halaman dilihat, template, item ditambah/dipindah/diputar/dihapus, perubahan spesifikasi & edit massal, peringatan tabrakan, permintaan estimasi (A), buka rincian, ganti tujuan/mata uang, simpan/bagikan, pilihan konversi (checkout_bayar / kirim_sales), skor keyakinan 1–5. |
| 5 | **Yang boleh palsu** (login, pembayaran, server, AI, katalog) | Login & peran, pembayaran (Midtrans/Xendit/Stripe), email, routing distributor, chat AI (Simulasi AI), ongkir, kurs, spesifikasi teknis, model 3D (geometri parametrik), status produksi/ERP. Harga produk dari pricelist Nov 2024. |
| 6 | **Prompt pertama** (ditulis setelah kolom 1 sampai 5 terisi) | Lihat `JURNAL-PROMPT.md` entri 1 (platform B2B ROBRIES end-to-end). |

## Lima pertanyaan Penjaga Segel

Ajukan sebelum menyetujui rencana agen:

1. Apakah interaksi inti dari klaim ada di rencana?
2. Apakah kedua kondisi bisa dipilih dan benar-benar berbeda?
3. Apakah setiap data di kolom 4 tercatat oleh layar dan bisa diunduh?
4. Apakah agen menambahkan fitur yang tidak diminta?
5. Apa satu hal yang disalahpahami agen dari klaim?

## Contoh terisi (contoh rekaan, sesuai starter)

| Kolom | Isi |
| --- | --- |
| Klaim | Cerita asal bahan meningkatkan kepercayaan konsumen pada jamu kemasan |
| Interaksi inti | Peserta mencari asal bahan utama, lalu memberi skor kepercayaan |
| Kondisi pembanding | A: halaman ringkas. B: halaman dengan cerita asal bahan |
| Data yang dicatat | Kondisi, waktu sampai menemukan, membuka detail bahan atau tidak, skor kepercayaan 1 sampai 5 |
| Yang boleh palsu | Foto produk, harga, pembayaran |
| Prompt pertama | Lihat `prompts/templat-prompt.md` |
