# Koperasi MVP Gap Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menutup gap fitur utama berdasarkan `../plan.md` sampai operasional Tahap 1 + fondasi Tahap 2 berjalan stabil di production.

**Architecture:** Aplikasi tetap menggunakan Next.js App Router + Server Actions + Prisma PostgreSQL. Implementasi dilakukan bertahap per domain (master data, transaksi, monitoring, laporan, akses), dengan tiap tahap menghasilkan fitur yang siap dipakai dan tervalidasi build/lint.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Prisma 7, PostgreSQL, NextAuth, Base UI + Tailwind.

---

## 1) Baseline Saat Ini (As-Is)

### Sudah tersedia
- Master Nasabah (list, detail, create).
- Pengajuan pinjaman (create, list, detail, approve sederhana).
- Pencairan pinjaman (kontrak + jadwal angsuran + kas keluar).
- Pembayaran angsuran dasar + denda + kas masuk.
- Monitoring tunggakan (aging sederhana).
- Rekap kolektor dan laporan per kelompok berbasis data DB (versi awal).
- Dashboard ringkasan awal.

### Masih kurang utama
- Master data lanjutan (`kolektor`, `jenis pinjaman`, `tarif bunga`, `cabang/wilayah`, `user-role` CRUD).
- Approval berjenjang + audit trail aktivitas.
- Pembayaran lanjutan: parsial, pelunasan dipercepat, pembatalan dengan approval, pembayaran kolektif.
- Kas: approval transaksi, bukti lampiran, rekonsiliasi, kas per cabang.
- Laba rugi masih placeholder, belum akuntansi dari transaksi real.
- Dokumen cetak (kuitansi, bukti pencairan, surat tunggakan, kartu angsuran).
- Notifikasi/reminder jatuh tempo dan approval.

---

## 2) Prioritas Implementasi (To-Be)

### Gelombang A (Wajib Operasional Tahap 1)
1. Master Kelompok full CRUD + penugasan kolektor.
2. Pembayaran lanjutan (parsial, pembatalan approval, pelunasan dipercepat).
3. Monitoring tunggakan lengkap (filter kolektor/kelompok/wilayah, NPL ratio).
4. Rekap kolektor lengkap (target vs realisasi + setoran).
5. Dokumen transaksi minimal: kuitansi pembayaran + bukti pencairan.

### Gelombang B (Tahap 2 Fondasi)
1. Arus kas lanjutan (approval, bukti, rekonsiliasi).
2. Laporan laba-rugi real dari transaksi.
3. Role-based access end-to-end + audit trail.
4. Notifikasi internal (in-app) untuk jatuh tempo dan approval pending.

---

## 3) Gap Matrix (Plan vs Implementasi)

| Domain | Status | Keterangan |
|---|---|---|
| Master Nasabah | Partial | Sudah create/list/detail, belum edit/nonaktif lengkap + dokumen upload |
| Master Kelompok | Partial | Sudah overview data, belum CRUD lengkap |
| Pengajuan | Partial | Alur dasar ada, belum survey workflow detail + approval berjenjang |
| Pencairan | Partial | Dasar ada, dokumen cetak belum ada |
| Pembayaran | Partial | Dasar ada, belum parsial/pelunasan/pembatalan approval |
| Tunggakan | Partial | Aging ada, filter dan KPI NPL lengkap belum |
| Rekap Kolektor | Partial | Dasar ada, target/setoran/kunjungan belum |
| Arus Kas | Partial | Input dasar ada, approval + rekonsiliasi belum |
| Laba Rugi | Not Started (real) | Masih statis/placeholder |
| Laporan Per Kelompok | Partial | Sudah ada ranking awal, belum export/cetak |
| Hak Akses | Partial | Guard basic ada, RBAC menyeluruh belum |
| Notifikasi | Not Started | Belum ada modul |
| Dokumen & Cetak | Not Started | Belum ada template print/PDF |

---

## 4) File Structure Plan

### Domain actions
- Modify: `src/actions/nasabah.ts`
- Modify: `src/actions/pengajuan.ts`
- Modify: `src/actions/pembayaran.ts`
- Modify: `src/actions/kas.ts`
- Modify: `src/actions/dashboard.ts`
- Create: `src/actions/kelompok.ts`
- Create: `src/actions/user-role.ts`
- Create: `src/actions/notifikasi.ts`

### Validation + utils
- Create: `src/lib/validations/kelompok.ts`
- Create: `src/lib/validations/kas.ts`
- Create: `src/lib/validations/role.ts`
- Create: `src/lib/roles.ts`
- Create: `src/lib/audit.ts`

### UI pages/components
- Modify: `src/app/(dashboard)/kelompok/page.tsx`
- Create: `src/app/(dashboard)/kelompok/baru/page.tsx`
- Create: `src/app/(dashboard)/kelompok/[id]/edit/page.tsx`
- Modify: `src/app/(dashboard)/pembayaran/page.tsx`
- Create: `src/app/(dashboard)/pembayaran/[id]/pembatalan/page.tsx`
- Modify: `src/app/(dashboard)/kas/page.tsx`
- Modify: `src/app/(dashboard)/laporan/laba-rugi/page.tsx`
- Create: `src/app/(dashboard)/dokumen/kuitansi/[id]/page.tsx`
- Create: `src/app/(dashboard)/dokumen/pencairan/[id]/page.tsx`

### DB schema + migration
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_phase_a_gap_closure/migration.sql`

### Documentation
- Modify: `README.md`
- Create: `docs/feature-matrix.md`
- Create: `docs/operational-runbook.md`

---

## 5) Execution Tasks (Bite-Sized)

### Task 1: Tambah model data untuk approval, audit, dan target kolektor

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_phase_a_gap_closure/migration.sql`

- [ ] Tambah tabel `AuditLog`, `ApprovalLog`, `KolektorTarget`, `Notifikasi`.
- [ ] Tambah relasi ke `User`, `Pengajuan`, `Pembayaran`, `KasTransaksi`.
- [ ] Jalankan `npm run db:generate` dan validasi schema compile.
- [ ] Commit: `feat(db): add approval audit and collector target models`.

### Task 2: RBAC utility dan audit helper

**Files:**
- Create: `src/lib/roles.ts`
- Create: `src/lib/audit.ts`

- [ ] Buat helper `requireRoles(session, allowedRoles)`.
- [ ] Buat helper `writeAuditLog({...})`.
- [ ] Integrasi ke action sensitif (`approve`, `cairkan`, `input kas`).
- [ ] Commit: `feat(security): add RBAC and audit helpers`.

### Task 3: Master Kelompok full CRUD

**Files:**
- Create: `src/actions/kelompok.ts`
- Create: `src/lib/validations/kelompok.ts`
- Modify: `src/app/(dashboard)/kelompok/page.tsx`
- Create: `src/app/(dashboard)/kelompok/baru/page.tsx`
- Create: `src/app/(dashboard)/kelompok/[id]/edit/page.tsx`

- [ ] Tambah create/update/delete kelompok + validasi kode unik.
- [ ] Tambah assign kolektor default per kelompok.
- [ ] Lengkapi UI list dengan aksi create/edit/nonaktif.
- [ ] Commit: `feat(kelompok): implement full CRUD and assignment`.

### Task 4: Pembayaran lanjutan

**Files:**
- Modify: `src/actions/pembayaran.ts`
- Modify: `src/lib/validations/pembayaran.ts`
- Modify: `src/app/(dashboard)/pembayaran/page.tsx`
- Create: `src/app/(dashboard)/pembayaran/[id]/pembatalan/page.tsx`

- [ ] Tambah mode bayar parsial + alokasi ke pokok/bunga/denda.
- [ ] Tambah pelunasan dipercepat.
- [ ] Tambah pembatalan pembayaran dengan approval manager.
- [ ] Tulis log audit tiap perubahan pembayaran.
- [ ] Commit: `feat(pembayaran): add partial, early payoff, and cancel approval flow`.

### Task 5: Tunggakan & rekap kolektor versi operasional

**Files:**
- Modify: `src/actions/dashboard.ts`
- Modify: `src/app/(dashboard)/monitoring/tunggakan/page.tsx`
- Modify: `src/app/(dashboard)/monitoring/kolektor/page.tsx`

- [ ] Tambah filter query: tanggal, kolektor, kelompok, wilayah.
- [ ] Tambah metrik NPL formal + bucket aging detail.
- [ ] Tambah KPI rekap kolektor: target, realisasi, tunggakan, setoran.
- [ ] Commit: `feat(monitoring): complete delinquency and collector KPI reporting`.

### Task 6: Dokumen transaksi (print-ready)

**Files:**
- Create: `src/app/(dashboard)/dokumen/kuitansi/[id]/page.tsx`
- Create: `src/app/(dashboard)/dokumen/pencairan/[id]/page.tsx`
- Modify: `src/app/(dashboard)/pembayaran/page.tsx`
- Modify: `src/app/(dashboard)/pencairan/pencairan-form.tsx`

- [ ] Buat template kuitansi pembayaran (print CSS).
- [ ] Buat template bukti pencairan (print CSS).
- [ ] Tambah tombol cetak di flow pembayaran dan pencairan.
- [ ] Commit: `feat(docs): add printable receipt and disbursement documents`.

### Task 7: Arus kas lanjutan + laba rugi real

**Files:**
- Modify: `src/actions/kas.ts`
- Modify: `src/app/(dashboard)/kas/page.tsx`
- Modify: `src/app/(dashboard)/laporan/laba-rugi/page.tsx`
- Create: `src/lib/validations/kas.ts`

- [ ] Tambah approval transaksi kas tertentu (`isApproved=false` flow).
- [ ] Tambah lampiran bukti URL transaksi kas.
- [ ] Hitung laba rugi dari kategori kas + transaksi pembayaran/denda.
- [ ] Commit: `feat(finance): add cash approval flow and real profit-loss report`.

### Task 8: Notifikasi internal

**Files:**
- Create: `src/actions/notifikasi.ts`
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/components/layout/app-sidebar.tsx`

- [ ] Simpan notifikasi jatuh tempo, approval pending, kas pending.
- [ ] Tampilkan badge jumlah notifikasi belum dibaca.
- [ ] Tambah halaman daftar notifikasi sederhana.
- [ ] Commit: `feat(notifications): add in-app reminder and pending alerts`.

### Task 9: Hardening, docs, dan UAT checklist

**Files:**
- Modify: `README.md`
- Create: `docs/feature-matrix.md`
- Create: `docs/operational-runbook.md`

- [ ] Update README sesuai modul yang sudah aktif.
- [ ] Tambah matrix fitur Done/Partial/Not Started.
- [ ] Tambah runbook operasional harian (kas, tagihan, approval).
- [ ] Commit: `docs: add feature matrix and operational runbook`.

---

## 6) Acceptance Criteria

- Build production sukses (`npm run build`).
- Lint tanpa error (`npm run lint`).
- Semua flow inti Tahap 1 bisa dieksekusi end-to-end:
  - Nasabah -> Pengajuan -> Approval -> Pencairan -> Pembayaran -> Tunggakan -> Rekap Kolektor.
- Dokumen kuitansi dan bukti pencairan bisa dicetak dengan format rapi.
- Role restriction berjalan konsisten di server action kritikal.

---

## 7) Test & Verification Command Set

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `npm run db:generate`
- `npm run dev`

UAT minimum:
- Buat 1 nasabah, 1 pengajuan, approve, cairkan, bayar, cek tunggakan dan laporan.
- Uji role `ADMIN` vs `TELLER` vs `MANAGER` terhadap action sensitif.

---

## 8) Risiko dan Mitigasi

- **Perubahan schema berdampak data existing**
  - Mitigasi: migration bertahap + backup DB.
- **Perhitungan keuangan tidak konsisten lintas modul**
  - Mitigasi: sentralisasi fungsi hitung di `src/lib`.
- **Scope creep**
  - Mitigasi: implementasi wajib hanya Gelombang A dahulu.

---

## 9) Rekomendasi Eksekusi

Urutan aman implementasi:
1. Task 1 -> 2 (fondasi data + RBAC/audit)
2. Task 3 -> 4 -> 5 (core operasional)
3. Task 6 -> 7 -> 8 (dokumen + finance + notifikasi)
4. Task 9 (stabilisasi & dokumentasi)

