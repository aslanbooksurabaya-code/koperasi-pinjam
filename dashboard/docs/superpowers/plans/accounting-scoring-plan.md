# Rencana Ekspansi: Akuntansi Owner & Detailing/Scoring Nasabah

Dokumen ini adalah *blueprint* spesifikasi untuk fase pengembangan lanjutan sistem Koperasi, berfokus pada Tata Kelola Keuangan (Akuntansi) tingkat Pimpinan/Owner dan Profiling Risiko Kredit Nasabah.

---

## 🏗️ BAGIAN 1: Modul Akuntansi Lanjutan (Untuk Admin & Owner)

Sistem saat ini sudah memiliki aliran kas (*Cashflow*) dan Laba-Rugi sederhana. Untuk memberikan visibilitas penuh bagi Owner/Pemodal, sistem perlu di-upgrade menjadi Akuntansi *Double-Entry* (Buku Besar) yang terotomatisasi.

### 1.1 Bagan Akun Standar (Chart of Accounts - COA)
Struktur COA dasar yang harus dibuat di dalam sistem:
- **(1) Aset / Harta**: Kas Tunai, Bank Koperasi, Piutang Pokok, Piutang Bunga.
- **(2) Kewajiban**: Hutang Usaha, Titipan Simpanan Anggota.
- **(3) Modal (Ekuitas)**: Modal Owner, Laba Ditahan, SHU Tahun Berjalan.
- **(4) Pendapatan**: Pendapatan Bunga, Pendapatan Denda, Pendapatan Provisi/Admin.
- **(5) Beban/Pengeluaran**: Beban Gaji Kolektor, Beban Operasional, Beban Piutang Tak Tertagih (*Bad Debt*).

### 1.2 Pembentukan Jurnal Otomatis
Pimpinan tidak perlu melakukan *input* akuntansi secara teknis. Sistem akan membuat jurnal secara berjalan *di belakang* untuk setiap aktivitas:
- **Pencairan Pinjaman**: (D) Piutang Anggota | (K) Kas/Bank, (K) Pendapatan Admin/Provisi.
- **Pembayaran Angsuran**: (D) Kas/Bank | (K) Piutang Anggota, (K) Pendapatan Bunga, (K) Pendapatan Denda.

### 1.3 Laporan Manajerial Utama (Owner's Dashboard)
Modul Laporan khusus Owner yang dapat ditarik (*export* PDF/Excel) per akhir bulan:
1. **Laba Rugi Komprehensif (Income Statement)**: Analisis Gross Margin dan Net Margin bulanan.
2. **Neraca Keuangan (Balance Sheet)**: Keseimbangan antara Aset yang beredar (uang di tangan nasabah) vs Modal Owner.
3. **Pembagian SHU (Sisa Hasil Usaha)**: Perhitungan rasio dividen untuk pemegang saham/owner berdasarkan *Net Income*.
4. **Analisis Rasio Keuangan Utama**: 
   - *Return on Equity (ROE)*
   - *Return on Asset (ROA)*

---

## 🎯 BAGIAN 2: Credit Scoring, Detailing Profiling, & Laporan Nasabah

Untuk menekan angka kredit macet (NPL), "feeling" atau insting persetujuan pengajuan pinjaman harus diganti dengan **Sistem Matriks Skor (Credit Scoring System)** berbasis data demografi, kapasitas, dan rekam jejak.

### 2.1 Detailing Custom Profile (Data KYC & Kalkulasi Kelayakan)
Formulir nasabah akan diberlakukan *Deep Profiling* yang memegang variabel kalkulasi kelayakan kredit:
- **Capacity (Kapasitas)**: 
  - Gaji/Omset Bulanan, Pengeluaran Rutin, Jumlah Tanggungan (Anak/Keluarga).
  - *Debt Service Ratio (DSR)*: Rasio batas maksimal angsuran (Misalnya: Maks beban hutang 30% dari Gaji Bersih).
- **Condition (Kondisi/Pekerjaan)**:
  - Durasi Usaha / Lama Bekerja, Status Kepegawaian (Tetap/Kontrak).
- **Collateral (Agunan/Jaminan)**: 
  - Estimasi Nilai Jaminan vs Plafon yang Diajukan (*Loan-to-Value / LTV Ratio*).
- **Character (Rekam Jejak Internal/Eksternal)**:
  - Cek SLIK OJK / BI Checking (status Kol 1 s/d Kol 5 diisikan oleh surveyor saat evaluasi).
  - Histori *Late Payment* di internal Koperasi dari pinjaman-pinjaman sebelumnya (menggunakan Algoritma Ranking yang sudah ada).

### 2.2 Mesin Credit Scoring & Auto-Plafon (Sistem Verifikasi Risiko)
Sistem akan menjalankan algoritma *skoring kredit* secara otomatis ketika pinjaman "Di-Survey":
- **Skor 80 - 100 (Sangat Layak - Tier A)**: Plafon masksimal tervalidasi penuh, Bunga Normal, *Auto-Recommend* persetujuan.
- **Skor 60 - 79 (Beresiko Sedang - Tier B)**: Sistem memberikan *Warning*, butuh pertambahan nilai jaminan, atau *Auto-Adjust* (sistem merekomendasikan plafon dipotong 50% dari pengajuan awal).
- **Skor < 60 (Tidak Direkomendasikan)**: Penolakan otomatis direkomendasikan sistem (DSR > 50% atau Riwayat Macet Tinggi).

### 2.3 Manajemen Kolektibilitas Historis (Laporan Portofolio Kualitas Aset)
Sistem laporan nasabah & tagihan akan memetakan dan membagi status portofolio pinjaman Koperasi menjadi kategori baku perbankan:
- **KOL 1 (Lancar)**: Bayar tepat waktu atau 0 hari telat.
- **KOL 2 (Dalam Perhatian Khusus/DPK)**: Menunggak 1 - 90 hari (Target patroli lapangan ketat).
- **KOL 3 (Kurang Lancar)**: Menunggak 91 - 120 hari.
- **KOL 4 (Diragukan)**: Menunggak 121 - 180 hari.
- **KOL 5 (Macet / Bad Debt)**: > 180 Hari tak ada pembayaran. Pada titik ini kredit dihapusbukukan (Write-Off) secara sistem terhadap Laba Rugi.

### 2.4 Sistem Blokir Otomatis (Peringatan & Blacklist)
- **Blacklist Database**: Jika nasabah telah menginjak status `KOL 5` atau lari/tidak berniat melunasi, NIK KTP-nya otomatis di-*blacklist*. Sistem akan menolak di garis depan form jika ada Nomor KTP/NIK yang sama terdaftar lagi.
- **Warning Pembiayaan Kelompok (Group Risk Control)**: Sistem memblokir sementara persetujuan pembiayaan pengajuan baru untuk sebuah *Kelompok* jika di *Group* tersebut tingkat NPL / Penunggaknya (KOL 2 ke atas) menembus batas persentase wajar (Misal >25% anggota menunggak).
