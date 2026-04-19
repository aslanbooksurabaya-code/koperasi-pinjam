-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('ADMIN', 'TELLER', 'KOLEKTOR', 'SURVEYOR', 'MANAGER', 'PIMPINAN', 'AKUNTANSI');

-- CreateEnum
CREATE TYPE "StatusNasabah" AS ENUM ('AKTIF', 'NON_AKTIF', 'KELUAR');

-- CreateEnum
CREATE TYPE "JenisPinjaman" AS ENUM ('REGULAR', 'MIKRO', 'USAHA');

-- CreateEnum
CREATE TYPE "StatusPengajuan" AS ENUM ('DRAFT', 'DIAJUKAN', 'DISURVEY', 'DISETUJUI', 'DITOLAK', 'DICAIRKAN', 'SELESAI');

-- CreateEnum
CREATE TYPE "StatusPinjaman" AS ENUM ('AKTIF', 'MENUNGGAK', 'MACET', 'LUNAS');

-- CreateEnum
CREATE TYPE "MetodeBayar" AS ENUM ('TUNAI', 'TRANSFER');

-- CreateEnum
CREATE TYPE "JenisKas" AS ENUM ('MASUK', 'KELUAR');

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "RoleType" NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nasabah" (
    "id" TEXT NOT NULL,
    "nomorAnggota" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "tempatLahir" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "alamat" TEXT NOT NULL,
    "kelurahan" TEXT,
    "kecamatan" TEXT,
    "kotaKab" TEXT,
    "noHp" TEXT NOT NULL,
    "pekerjaan" TEXT,
    "namaUsaha" TEXT,
    "status" "StatusNasabah" NOT NULL DEFAULT 'AKTIF',
    "tanggalGabung" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fotoUrl" TEXT,
    "dokumenUrls" TEXT[],
    "kolektorId" TEXT,
    "kelompokId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nasabah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penjamin" (
    "id" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "hubungan" TEXT NOT NULL,
    "noHp" TEXT NOT NULL,
    "alamat" TEXT,
    "nasabahId" TEXT NOT NULL,

    CONSTRAINT "penjamin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelompok" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "ketua" TEXT,
    "wilayah" TEXT,
    "jadwalPertemuan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kelompok_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengajuan" (
    "id" TEXT NOT NULL,
    "nomorPengajuan" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "kelompokId" TEXT,
    "jenisPinjaman" "JenisPinjaman" NOT NULL DEFAULT 'REGULAR',
    "plafonDiajukan" DECIMAL(15,2) NOT NULL,
    "plafonDisetujui" DECIMAL(15,2),
    "tenor" INTEGER NOT NULL,
    "bungaPerBulan" DECIMAL(5,4) NOT NULL,
    "tujuanPinjaman" TEXT,
    "agunan" TEXT,
    "hasilSurvey" TEXT,
    "catatanApproval" TEXT,
    "status" "StatusPengajuan" NOT NULL DEFAULT 'DRAFT',
    "tanggalPengajuan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalSurvey" TIMESTAMP(3),
    "tanggalApproval" TIMESTAMP(3),
    "surveyorId" TEXT,
    "approverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengajuan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pinjaman" (
    "id" TEXT NOT NULL,
    "nomorKontrak" TEXT NOT NULL,
    "pengajuanId" TEXT NOT NULL,
    "pokokPinjaman" DECIMAL(15,2) NOT NULL,
    "tenor" INTEGER NOT NULL,
    "bungaPerBulan" DECIMAL(5,4) NOT NULL,
    "angsuranPokok" DECIMAL(15,2) NOT NULL,
    "angsuranBunga" DECIMAL(15,2) NOT NULL,
    "totalAngsuran" DECIMAL(15,2) NOT NULL,
    "potonganAdmin" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "potonganProvisi" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "nilaiCair" DECIMAL(15,2) NOT NULL,
    "tanggalCair" TIMESTAMP(3) NOT NULL,
    "tanggalJatuhTempo" TIMESTAMP(3) NOT NULL,
    "sisaPinjaman" DECIMAL(15,2) NOT NULL,
    "status" "StatusPinjaman" NOT NULL DEFAULT 'AKTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pinjaman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jadwal_angsuran" (
    "id" TEXT NOT NULL,
    "pinjamanId" TEXT NOT NULL,
    "angsuranKe" INTEGER NOT NULL,
    "tanggalJatuhTempo" TIMESTAMP(3) NOT NULL,
    "pokok" DECIMAL(15,2) NOT NULL,
    "bunga" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "sudahDibayar" BOOLEAN NOT NULL DEFAULT false,
    "tanggalBayar" TIMESTAMP(3),
    "dendaHarian" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "jadwal_angsuran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pembayaran" (
    "id" TEXT NOT NULL,
    "nomorTransaksi" TEXT NOT NULL,
    "pinjamanId" TEXT NOT NULL,
    "tanggalBayar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pokok" DECIMAL(15,2) NOT NULL,
    "bunga" DECIMAL(15,2) NOT NULL,
    "denda" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalBayar" DECIMAL(15,2) NOT NULL,
    "metode" "MetodeBayar" NOT NULL DEFAULT 'TUNAI',
    "catatan" TEXT,
    "inputOlehId" TEXT NOT NULL,
    "isBatalkan" BOOLEAN NOT NULL DEFAULT false,
    "alasanBatal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simpanan" (
    "id" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simpanan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kas_transaksi" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jenis" "JenisKas" NOT NULL,
    "kategori" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "kasJenis" TEXT NOT NULL DEFAULT 'TUNAI',
    "buktiUrl" TEXT,
    "inputOlehId" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "referensiId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kas_transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_role_key" ON "user_roles"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "nasabah_nomorAnggota_key" ON "nasabah"("nomorAnggota");

-- CreateIndex
CREATE UNIQUE INDEX "nasabah_nik_key" ON "nasabah"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "kelompok_kode_key" ON "kelompok"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "pengajuan_nomorPengajuan_key" ON "pengajuan"("nomorPengajuan");

-- CreateIndex
CREATE UNIQUE INDEX "pinjaman_nomorKontrak_key" ON "pinjaman"("nomorKontrak");

-- CreateIndex
CREATE UNIQUE INDEX "pinjaman_pengajuanId_key" ON "pinjaman"("pengajuanId");

-- CreateIndex
CREATE UNIQUE INDEX "pembayaran_nomorTransaksi_key" ON "pembayaran"("nomorTransaksi");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nasabah" ADD CONSTRAINT "nasabah_kolektorId_fkey" FOREIGN KEY ("kolektorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nasabah" ADD CONSTRAINT "nasabah_kelompokId_fkey" FOREIGN KEY ("kelompokId") REFERENCES "kelompok"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penjamin" ADD CONSTRAINT "penjamin_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan" ADD CONSTRAINT "pengajuan_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan" ADD CONSTRAINT "pengajuan_kelompokId_fkey" FOREIGN KEY ("kelompokId") REFERENCES "kelompok"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan" ADD CONSTRAINT "pengajuan_surveyorId_fkey" FOREIGN KEY ("surveyorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan" ADD CONSTRAINT "pengajuan_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinjaman" ADD CONSTRAINT "pinjaman_pengajuanId_fkey" FOREIGN KEY ("pengajuanId") REFERENCES "pengajuan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_angsuran" ADD CONSTRAINT "jadwal_angsuran_pinjamanId_fkey" FOREIGN KEY ("pinjamanId") REFERENCES "pinjaman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_pinjamanId_fkey" FOREIGN KEY ("pinjamanId") REFERENCES "pinjaman"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_inputOlehId_fkey" FOREIGN KEY ("inputOlehId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simpanan" ADD CONSTRAINT "simpanan_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kas_transaksi" ADD CONSTRAINT "kas_transaksi_inputOlehId_fkey" FOREIGN KEY ("inputOlehId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
