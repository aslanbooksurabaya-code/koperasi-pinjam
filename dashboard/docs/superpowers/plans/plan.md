Berikut breakdown fitur sistem untuk **koperasi simpan pinjam** berdasarkan kebutuhan yang  sebutkan.

## 1. Master Nasabah

Fitur inti untuk menyimpan data anggota/debitur.

**Data utama**

* Nomor anggota / ID nasabah
* Nama lengkap
* NIK
* Alamat lengkap
* No. HP
* Pekerjaan
* Tanggal bergabung
* Status anggota: aktif, nonaktif, keluar
* Kelompok nasabah
* Kolektor / petugas lapangan
* Data penjamin
* Upload dokumen: KTP, KK, foto rumah, surat usaha

**Fungsi**

* Tambah, ubah, nonaktifkan data nasabah
* Pencarian cepat
* Filter berdasarkan kelompok, wilayah, kolektor, status
* Riwayat pinjaman per nasabah
* Riwayat pembayaran per nasabah
* Catatan survey / catatan lapangan

---

## 2. Master Kelompok

Kalau sistem koperasi berjalan per kelompok.

**Data utama**

* Nama kelompok
* Kode kelompok
* Ketua kelompok
* Wilayah / cabang
* Jadwal pertemuan / penagihan
* Kolektor yang menangani

**Fungsi**

* Daftar anggota per kelompok
* Total pinjaman aktif per kelompok
* Total tunggakan per kelompok
* Rekap pembayaran kelompok
* Ranking kelompok sehat / bermasalah

---

## 3. Pengajuan Pinjaman

Untuk proses pengajuan sampai persetujuan.

**Data utama**

* Nomor pengajuan
* Tanggal pengajuan
* Nasabah
* Kelompok
* Jenis pinjaman
* Plafon pinjaman
* Jangka waktu / tenor
* Bunga / margin / jasa
* Tujuan pinjaman
* Agunan / jaminan
* Hasil survey
* Status pengajuan

**Alur proses**

* Input pengajuan
* Verifikasi dokumen
* Survey lapangan
* Analisa kelayakan
* Persetujuan / penolakan
* Pencairan

**Status**

* Draft
* Diajukan
* Disurvey
* Disetujui
* Ditolak
* Dicairkan
* Selesai

**Output**

* Surat pengajuan
* Surat persetujuan
* Jadwal angsuran otomatis
* Akad pinjaman

---

## 4. Pencairan Pinjaman

Setelah pengajuan disetujui.

**Fitur**

* Generate nomor kontrak pinjaman
* Tanggal pencairan
* Potongan administrasi
* Potongan simpanan wajib
* Potongan provisi / asuransi jika ada
* Nilai bersih diterima nasabah
* Metode pencairan: tunai / transfer
* Cetak bukti pencairan

**Hasil otomatis**

* Membentuk saldo pinjaman
* Membentuk jadwal angsuran
* Masuk ke arus kas keluar
* Masuk ke piutang pinjaman

---

## 5. Pembayaran Angsuran

Untuk transaksi cicilan nasabah.

**Komponen pembayaran**

* Pokok
* Bunga / jasa
* Denda
* Simpanan wajib / sukarela bila dibayar bersamaan
* Biaya lain jika ada

**Fitur**

* Input pembayaran harian
* Pembayaran per nasabah
* Pembayaran kolektif per kelompok
* Pembayaran sebagian / kurang bayar
* Pelunasan dipercepat
* Cetak kuitansi
* Riwayat pembayaran
* Koreksi / pembatalan transaksi dengan approval

**Sistem otomatis**

* Hitung sisa pinjaman
* Hitung tunggakan
* Hitung denda telat
* Update status pinjaman: lancar, menunggak, lunas

---

## 6. Data Tunggakan

Untuk monitoring keterlambatan pembayaran.

**Informasi utama**

* Nasabah menunggak
* Kelompok
* Kolektor
* Jumlah angsuran tertunggak
* Hari keterlambatan
* Total pokok tertunggak
* Total bunga tertunggak
* Total denda
* Last payment date

**Filter yang penting**

* Per tanggal
* Per kolektor
* Per kelompok
* Per cabang / wilayah
* Berdasarkan aging: 1–7 hari, 8–30 hari, 31–60 hari, >60 hari

**Output**

* Daftar tunggakan harian
* Aging tunggakan
* Tunggakan tertinggi
* Rasio NPL / pinjaman bermasalah
* Rekap penagihan

---

## 7. Rekap Kolektor

Untuk memantau kinerja petugas lapangan / penagih.

**Data yang direkap**

* Jumlah nasabah yang ditangani
* Jumlah kelompok yang ditangani
* Target tagihan
* Realisasi tagihan
* Persentase pencapaian
* Jumlah tunggakan
* Jumlah kunjungan
* Setoran harian kolektor
* Selisih setoran bila ada

**Laporan**

* Rekap harian kolektor
* Rekap mingguan / bulanan
* Produktivitas kolektor
* Kolektor dengan tunggakan tertinggi
* Kolektor dengan realisasi terbaik

---

## 8. Arus Kas

Untuk pencatatan uang masuk dan keluar koperasi.

**Kas masuk**

* Pembayaran angsuran
* Denda
* Simpanan anggota
* Pendapatan administrasi
* Pendapatan lain

**Kas keluar**

* Pencairan pinjaman
* Biaya operasional
* Gaji / insentif kolektor
* Biaya kantor
* Pengeluaran lain

**Fitur**

* Buku kas harian
* Kategori pemasukan / pengeluaran
* Kas tunai dan kas bank
* Mutasi kas
* Saldo awal dan saldo akhir
* Approval transaksi tertentu
* Lampiran bukti transaksi

**Laporan**

* Arus kas harian
* Arus kas bulanan
* Kas per cabang
* Rekonsiliasi kas

---

## 9. Laba Rugi

Untuk melihat performa usaha koperasi.

**Sumber pendapatan**

* Pendapatan bunga / jasa pinjaman
* Pendapatan administrasi
* Denda keterlambatan
* Pendapatan lain-lain

**Beban**

* Beban gaji
* Beban operasional
* Beban transport kolektor
* Beban penyusutan jika ada
* Beban lain

**Fitur**

* Mapping akun pendapatan dan beban
* Periode laporan bulanan / tahunan
* Perbandingan periode
* Drill down ke transaksi

**Output**

* Laporan laba rugi bulanan
* Laporan laba rugi tahunan
* Per cabang / per unit jika dibutuhkan

---

## 10. Laporan Per Kelompok

Karena kamu butuh “per kelompok”, modul ini penting.

**Isi laporan**

* Jumlah anggota
* Jumlah pinjaman aktif
* Total outstanding
* Total pembayaran
* Total tunggakan
* Kolektibilitas kelompok
* Ranking kelompok

**Kegunaan**

* Menilai kesehatan kelompok
* Menentukan kelompok prioritas penagihan
* Evaluasi ketua kelompok / area

---

## 11. Dashboard Pimpinan

Ringkasan cepat untuk manajemen.

**Widget utama**

* Total nasabah aktif
* Total pinjaman aktif
* Total outstanding
* Total pembayaran hari ini
* Total tunggakan
* Top 10 nasabah menunggak
* Kinerja kolektor
* Arus kas hari ini
* Laba rugi bulan berjalan

---

## 12. Hak Akses Pengguna

Agar sistem aman dan rapi.

**Role yang umum**

* Admin
* Teller / kasir
* Kolektor
* Surveyor
* Manager
* Pimpinan / owner
* Akuntansi

**Pengaturan akses**

* Siapa yang bisa input pengajuan
* Siapa yang bisa approve pinjaman
* Siapa yang bisa edit pembayaran
* Siapa yang bisa lihat laporan keuangan
* Audit trail aktivitas user

---

## 13. Notifikasi & Reminder

Supaya operasional lebih tertib.

**Notifikasi yang berguna**

* Jatuh tempo angsuran
* Tunggakan nasabah
* Pengajuan menunggu approval
* Kas tidak balance
* Target kolektor belum tercapai

---

## 14. Dokumen & Cetak

Supaya siap operasional.

**Dokumen yang bisa dicetak**

* Form pendaftaran nasabah
* Form pengajuan pinjaman
* Bukti pencairan
* Kartu angsuran
* Kuitansi pembayaran
* Surat tunggakan
* Rekap kolektor
* Laporan arus kas
* Laporan laba rugi

---

# Saran struktur menu aplikasi

## A. Master Data

* Nasabah
* Kelompok
* Kolektor
* Jenis pinjaman
* Tarif bunga / jasa
* Cabang / wilayah
* User & role

## B. Transaksi

* Pengajuan pinjaman
* Survey & approval
* Pencairan
* Pembayaran angsuran
* Pelunasan
* Kas masuk
* Kas keluar

## C. Monitoring

* Pinjaman aktif
* Jatuh tempo
* Tunggakan
* Rekap kolektor
* Monitoring per kelompok

## D. Laporan

* Laporan nasabah
* Laporan pengajuan
* Laporan pencairan
* Laporan pembayaran
* Laporan tunggakan
* Laporan per kelompok
* Arus kas
* Laba rugi

---

# Prioritas MVP

Kalau mau dibuat bertahap, urutan paling penting:

**Tahap 1**

* Master nasabah
* Master kelompok
* Pengajuan pinjaman
* Pencairan
* Pembayaran angsuran
* Data tunggakan
* Rekap kolektor sederhana

**Tahap 2**

* Arus kas
* Laba rugi
* Dashboard
* Approval berjenjang
* Notifikasi

**Tahap 3**

* Mobile kolektor
* Tanda tangan digital
* Integrasi WhatsApp reminder
* Export Excel / PDF
* Analitik performa

---

# Output laporan yang wajib ada

Minimal sistem ini sebaiknya punya:

* Daftar nasabah aktif
* Daftar pinjaman aktif
* Jadwal angsuran
* Riwayat pembayaran
* Daftar tunggakan
* Rekap tunggakan per kelompok
* Rekap kolektor
* Buku kas harian
* Laporan arus kas bulanan
* Laporan laba rugi bulanan