# Refleksi Kritis

> Draf disusun bersama agen dari riwayat kerja (`JURNAL-PROMPT.md`, commit, dan masukan uji coba). Periksa, sesuaikan dengan suara Anda sendiri, dan lengkapi bagian bertanda *[isi]*.

## Klaim

- **Versi awal (v0.1):** estimasi harga, waktu produksi, dan jumlah sampah plastik terdaur ulang yang tampil langsung saat merancang layout 3D meningkatkan keyakinan calon pembeli B2B untuk melanjutkan proyek.
- **Versi akhir (v0.2):** transparansi harga, yaitu harga tampil dan bisa checkout langsung, meningkatkan keyakinan calon pembeli B2B untuk membeli produk furnitur daur ulang dibandingkan model "harga atas permintaan" lewat Sales.
- **Mengapa berubah:** uji coba internal menunjukkan bahwa konfigurator 3D bukan jalur utama pembelian. Konfigurator hanyalah fitur tambahan, sehingga variabel yang dibandingkan dipindah dari konfigurator ke tampilan harga di seluruh situs.

## Bukti

**Data yang tercatat oleh layar (CSV):**
- kondisi dan waktu (ms) sejak tugas dimulai;
- negara dan mata uang awal;
- halaman yang dilihat;
- tambah, ubah, dan hapus isi keranjang;
- aktivitas konfigurator;
- permintaan estimasi dan pembukaan rincian harga;
- jalur konversi, yaitu `checkout_bayar` (jalur `cart` atau `konfigurator`), `kirim_sales`, atau `bayar_penawaran`;
- skor keyakinan 1–5.

**Kondisi yang dibandingkan:**
- **A:** harga tidak ditampilkan dan keranjang hanya bisa "Minta penawaran".
- **B:** harga tampil dan checkout bisa dilakukan langsung.

**Yang sudah terbukti:** kedua kondisi berjalan, data tercatat, dan CSV terunduh. Ini sudah diuji otomatis dengan browser di desktop dan ukuran iPhone.

**Yang belum terbukti:** apakah kondisi B benar-benar menaikkan keyakinan. Uji peserta P01 dan P02 belum dilakukan. *[isi temuan setelah uji coba]*

### Masukan uji coba internal (review pemilik proyek atas v0.1)

| Masukan | Tindak lanjut di v0.2 |
| --- | --- |
| Konfigurasi 3D adalah fitur tambahan, bukan jalur utama pembelian | Tombol **Add to cart** di produk; checkout langsung dari keranjang |
| Produk di konfigurator 3D bisa keluar dari dinding ruangan | Posisi produk dibatasi di dalam ruangan |
| Penawaran yang disetujui Sales berubah menjadi pesanan tanpa pembayaran | Pesanan baru terbentuk setelah customer membayar (minimal DP) |
| Mata uang masih berubah setelah checkout | Popup negara dan mata uang di awal; mata uang dikunci saat checkout dan tersimpan di pesanan |
| Lead time tidak muncul di tracking pesanan | Perkiraan tanggal per tahap dan perkiraan tiba disimpan dari saat checkout |
| Status pesanan terlalu detail | Disederhanakan: DP diterima → Produksi → Pengemasan → Pengiriman → Diterima |
| Opsi akun trade dan grosir tidak perlu | Dihapus dari menu Akun |

### Uji coba peserta

| Peserta | Kondisi | Jalur konversi | Waktu | Skor keyakinan | Catatan |
| --- | --- | --- | --- | --- | --- |
| P01 | *[isi]* | | | | |
| P02 | *[isi]* | | | | |

## Keterbatasan prototipe

- Login, pembayaran (Midtrans/Xendit/Stripe), email, chat AI, dan ERP hanya simulasi.
- Ongkir, kurs, spesifikasi teknis, dan distributor adalah data rekaan.
- Model 3D memakai bentuk sederhana, bukan model produk asli.
- Di kondisi A, harga masih bisa muncul lewat "Hitung estimasi" di konfigurator. Ini bisa mencampur efek kedua kondisi.
- Dua peserta belum cukup untuk menarik kesimpulan. Hasilnya hanya temuan sementara.

## Peran AI

Agen membangun kode, data dummy dari pricelist, dan pengujian otomatis. Saya yang menentukan klaim, kondisi pembanding, dan prioritas fitur.

**Hal yang disalahpahami agen:** agen menjadikan konfigurator 3D sebagai jalur utama pembelian (lihat `JURNAL-PROMPT.md` entri 1 dan 2). Agen juga sempat menafsirkan kondisi A sebagai "estimasi atas permintaan" di konfigurator. Kondisi A dan B lalu saya definisikan ulang di entri 2.

**Fitur di luar permintaan yang perlu dicermati:** peran Distributor dan Admin, analitik, dan chat AI ikut dibuat karena tercantum di brief awal. Fitur-fitur ini menambah kompleksitas bagi peserta uji. *[isi: pertahankan atau sembunyikan?]*

## Implikasi desain

Bagi produk B2B premium, kejelasan harga dan jalur beli yang pendek (katalog → keranjang → bayar) bisa lebih penting daripada fitur visual yang canggih. Fitur visual seperti konfigurator 3D lebih berguna sebagai alat bantu presentasi ke klien.

*[isi: hubungkan dengan minimal satu konsep dari materi kuliah]*

## Langkah berikutnya

1. Sembunyikan "Hitung estimasi" di konfigurator pada kondisi A, agar perbedaan A dan B murni soal tampilan harga.
2. Uji P01 dan P02 dengan tugas yang sama, lalu bandingkan jalur konversi dan skor keyakinan.
