# Plan Pelengkap Akuntansi + Enrichment Customer & Group

Tanggal: 2026-04-19

Dokumen ini melengkapi rencana MVP yang sudah berjalan dengan fokus:
1. Akuntansi praktis berbasis transaksi (kas, pembayaran, pencairan) yang bisa diaudit, direkonsiliasi, dan menghasilkan laporan standar.
2. Enrichment data nasabah (customer) dan kelompok (group) untuk operasional (monitoring, risiko, produktivitas, dan kualitas data).

Stack target tetap: Next.js App Router + Server Actions + Prisma PostgreSQL.

---

## A. Pelengkap Akuntansi (Tahap Operasional)

### A1. Konsep yang dipakai (ringkas)
- Sumber kebenaran transaksi tetap `KasTransaksi` + event transaksi pinjaman/pembayaran.
- `KasTransaksi.kategori` diperlakukan sebagai "kategori pembukuan" dan akan dihubungkan ke "akun" (COA) agar laporan konsisten.
- Rekonsiliasi memisahkan saldo "book" (di sistem) dengan saldo "bank statement" (manual input) per akun kas/bank.

---

## A2. Target Fitur

### 1) Chart of Accounts (COA) + Mapping kategori
- Tujuan: setiap `KasKategori` bisa dipetakan ke akun pendapatan/beban/asset/liability agar laporan laba-rugi dan neraca bisa dirapikan.
- Implementasi minimal:
  - Buat akun standar: Kas Tunai, Kas Bank, Piutang Pinjaman, Pendapatan Bunga/Jasa, Pendapatan Admin, Pendapatan Denda, Beban Operasional, Beban Gaji, dan akun lain sesuai kebutuhan.
  - Mapping: `KasKategori` -> `Account` (+ normalisasi tampilan label).

**DB changes**
- [ ] Tambah model `Account` (COA) + enum tipe akun (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE).
- [ ] Tambah field relasi/mapping dari `KasKategori` ke akun: misalnya `accountId` (wajib untuk kategori aktif).
- [ ] Seed COA default + mapping default kategori yang sudah ada.

**Files**
- [ ] Update: [schema.prisma](/home/kotacom/projects/koperasi-pinjam/dashboard/prisma/schema.prisma)
- [ ] Add migration: `dashboard/prisma/migrations/<timestamp>_coa_mapping/*`
- [ ] Update seed bila perlu: [seed.ts](/home/kotacom/projects/koperasi-pinjam/dashboard/prisma/seed.ts)

---

### 2) Rekonsiliasi Kas/Bank
- Tujuan: memastikan saldo sistem sesuai saldo nyata, minimal untuk akun kas/bank.
- Implementasi minimal:
  - Buat entitas `Rekonsiliasi` per periode (bulanan) per akun kas/bank.
  - Input saldo statement (manual) + catatan + lampiran (opsional).
  - Sistem hitung selisih: statement - book.
  - Opsional: buat transaksi "Penyesuaian" (kategori khusus) untuk menutup selisih (approval required).

**DB changes**
- [ ] Tambah model `RekonsiliasiKas` (accountId, month, year, saldoStatement, saldoBook, selisih, status).
- [ ] Tambah model `RekonsiliasiKasLampiran` bila butuh multi-file, atau pakai `buktiUrl` tunggal.

**UI**
- [ ] Halaman: `/laporan/rekonsiliasi` (list + create + detail)
- [ ] Tombol "Buat Penyesuaian" menghasilkan `KasTransaksi` kategori `PENYESUAIAN` yang masuk approval.

**Files**
- [ ] Add actions: `dashboard/src/actions/rekonsiliasi.ts`
- [ ] Add pages: `dashboard/src/app/(dashboard)/laporan/rekonsiliasi/*`
- [ ] Reuse upload: `/api/upload/kas` untuk lampiran.

---

### 3) Approval kas yang lebih rapih (rule-based)
Saat ini sudah ada pending approval untuk input teller. Pelengkapnya:
- Tujuan: aturan kapan transaksi butuh approval (bukan hanya berdasarkan role input).
- Aturan minimal:
  - Transaksi `KELUAR` di atas ambang batas -> pending.
  - Kategori tertentu (misal `PENYESUAIAN`, `GAJI`) -> pending.

**Implementation**
- [ ] Tambah `AppSetting` untuk threshold approval kas (per jenis/kategori).
- [ ] Update logic di [kas.ts](/home/kotacom/projects/koperasi-pinjam/dashboard/src/actions/kas.ts) untuk menentukan `isApproved`.
- [ ] Tambah UI setting di halaman settings.

---

### 4) Laporan Keuangan Standar (Praktis)
Tujuan: laporan tidak hanya kas + laba-rugi, tapi juga:
- Buku Besar per akun (ledger)
- Neraca (balance sheet) sederhana
- Arus kas bulanan lebih jelas (opsional pisah kas tunai vs bank)

**Implementation minimal**
- [ ] Endpoint report:
  - `getLedger({ accountId, month, year })`
  - `getBalanceSheet({ month, year })`
- [ ] Halaman:
  - `/laporan/buku-besar`
  - `/laporan/neraca`

Catatan:
- Neraca awal bisa "sederhana": Kas (tunai+bank) + Piutang (outstanding pinjaman) + Ekuitas (selisih).
- Nanti bisa diperluas kalau COA sudah penuh.

---

### 5) Export / Print
- Tujuan: laporan siap dibawa rapat dan audit sederhana.
- Output minimal:
  - PDF: Laba-rugi, Arus kas, Rekonsiliasi, Buku besar.
  - CSV: transaksi kas harian.

**Implementation**
- [ ] Tambah tombol export (PDF/CSV) per halaman laporan utama.

---

## B. Enrichment Customer & Group

### B1. Enrichment Data Nasabah (Customer)
Target pengayaan data untuk operasional:
- Profil tambahan: wilayah lebih detail (kelurahan/kecamatan sudah ada), titik lokasi (opsional), foto rumah/usaha (sudah lewat dokumen), data penjamin lengkap.
- Catatan lapangan: catatan survey/kunjungan (timeline).
- Skor kualitas data: kelengkapan dokumen + validasi field penting.

**DB changes**
- [ ] Tambah model `NasabahActivity` (visit/survey/call) dengan field: jenis, catatan, tanggal, actorId, lampiranUrls.
- [ ] Tambah field `Nasabah` yang sering dipakai operasional (opsional): `pekerjaan`/`namaUsaha` sudah ada, tambah `penghasilanEstimasi`, `alamatUsaha`, `rtRw`, `kodePos` bila diperlukan.

**UI**
- [ ] Di detail nasabah: tab "Aktivitas" (list + add).
- [ ] Badge "Data Lengkap" vs "Perlu Lengkapi" berdasarkan skor.

**Files**
- [ ] Add actions: `dashboard/src/actions/nasabah-activity.ts`
- [ ] Update page: [nasabah detail](/home/kotacom/projects/koperasi-pinjam/dashboard/src/app/(dashboard)/nasabah/%5Bid%5D/page.tsx)

---

### B2. Enrichment Kelompok (Group)
Target pengayaan kelompok untuk monitoring & keputusan:
- Penugasan kolektor eksplisit di kelompok (bukan hanya turunan dari nasabah).
- Target kelompok (tagihan per bulan, target kunjungan, target tunggakan).
- Skor kesehatan kelompok: distribusi ranking A/B/C/D, total tunggakan, NPL kelompok.
- Jadwal pertemuan/penagihan yang bisa dipakai untuk rute kolektor.

**DB changes**
- [ ] Tambah field `Kelompok.kolektorId` (relasi ke `User` role KOLEKTOR).
- [ ] Tambah model `KelompokTarget` (month, year, targetTagihan, targetKunjungan, toleransiTunggakan).

**UI**
- [ ] Halaman kelompok: tampilkan kolektor penanggung jawab + ringkasan KPI.
- [ ] Laporan per kelompok: agregasi ranking + tunggakan + outstanding + NPL.

**Files**
- [ ] Update: [schema.prisma](/home/kotacom/projects/koperasi-pinjam/dashboard/prisma/schema.prisma)
- [ ] Update actions: [kelompok.ts](/home/kotacom/projects/koperasi-pinjam/dashboard/src/actions/kelompok.ts), [dashboard.ts](/home/kotacom/projects/koperasi-pinjam/dashboard/src/actions/dashboard.ts)
- [ ] Update pages: [kelompok page](/home/kotacom/projects/koperasi-pinjam/dashboard/src/app/(dashboard)/kelompok/page.tsx), [per-kelompok report](/home/kotacom/projects/koperasi-pinjam/dashboard/src/app/(dashboard)/laporan/per-kelompok/page.tsx)

---

### B3. Customer + Group “Enrich Report”
Tujuan: 1 layar untuk tindakan operasional:
- Filter by kelompok/kolektor/wilayah
- Sort by risiko (ranking D, telat tinggi, tunggakan besar)
- Rekomendasi tindakan: “follow up hari ini”, “jadwalkan kunjungan”, “minta dokumen”

**Implementation**
- [ ] Buat report: `/monitoring/enrichment`
- [ ] Tambah kolom: kelengkapan data, aktivitas terakhir, risiko, dan CTA.

---

## C. Urutan Eksekusi (disarankan)
1. COA + mapping kategori (A2.1)
2. Rekonsiliasi (A2.2)
3. Rule-based approval kas + setting (A2.3)
4. Ledger + Neraca sederhana (A2.4)
5. Enrichment Kelompok (B2) lalu Enrichment Nasabah (B1)
6. Enrich Report (B3)
7. Export/Print (A2.5)

---

## D. Acceptance Criteria
- COA tersimpan dan tiap kategori aktif punya mapping akun.
- Rekonsiliasi bulanan bisa dibuat, tampil selisih, dan penyesuaian (bila dipakai) harus lewat approval.
- Buku besar dan neraca minimal tampil untuk periode bulanan.
- Kelompok punya kolektor penanggung jawab yang bisa diatur.
- Detail nasabah punya aktivitas (minimal catatan + tanggal + actor).
- Build + lint aman (`npm run build`, `npm run lint`, `npx tsc --noEmit`).

