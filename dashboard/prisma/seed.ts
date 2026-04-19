import "dotenv/config"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, Prisma, RoleType, StatusPinjaman, StatusPengajuan, JenisPinjaman } from "@prisma/client"
import bcrypt from "bcryptjs"
import { addMonths, subMonths } from "date-fns"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function createUser(params: {
  email: string
  name: string
  password: string
  roles: RoleType[]
}) {
  const hashedPassword = await bcrypt.hash(params.password, 12)
  return prisma.user.create({
    data: {
      email: params.email,
      name: params.name,
      password: hashedPassword,
      isActive: true,
      roles: {
        create: params.roles.map((role) => ({ role })),
      },
    },
  })
}

async function cleanDatabase() {
  await prisma.auditLog.deleteMany()
  await prisma.approvalLog.deleteMany()
  await prisma.kolektorTarget.deleteMany()
  await prisma.notifikasi.deleteMany()
  await prisma.pembayaran.deleteMany()
  await prisma.jadwalAngsuran.deleteMany()
  await prisma.pinjaman.deleteMany()
  await prisma.pengajuan.deleteMany()
  await prisma.simpanan.deleteMany()
  await prisma.penjamin.deleteMany()
  await prisma.nasabah.deleteMany()
  await prisma.kelompok.deleteMany()
  await prisma.kasTransaksi.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.user.deleteMany()
}

async function main() {
  await cleanDatabase()

  const admin = await createUser({
    email: "admin@koperasi.id",
    name: "Administrator",
    password: "admin123",
    roles: ["ADMIN", "PIMPINAN"],
  })

  const teller = await createUser({
    email: "teller@koperasi.id",
    name: "Teller Satu",
    password: "teller123",
    roles: ["TELLER"],
  })

  const kolektorA = await createUser({
    email: "kolektor1@koperasi.id",
    name: "Budi Santoso",
    password: "kolektor123",
    roles: ["KOLEKTOR"],
  })

  const kolektorB = await createUser({
    email: "kolektor2@koperasi.id",
    name: "Dewi Rahayu",
    password: "kolektor123",
    roles: ["KOLEKTOR"],
  })

  const manager = await createUser({
    email: "manager@koperasi.id",
    name: "Manager Koperasi",
    password: "manager123",
    roles: ["MANAGER", "SURVEYOR"],
  })

  const kelompokData = [
    { kode: "KL-001", nama: "Kelompok Mentari", ketua: "Pak Suryo", wilayah: "Wonosobo", jadwalPertemuan: "Senin" },
    { kode: "KL-002", nama: "Mitra Sejahtera", ketua: "Bu Siti", wilayah: "Kertek", jadwalPertemuan: "Selasa" },
    { kode: "KL-003", nama: "Guyub Rukun", ketua: "Pak Slamet", wilayah: "Garung", jadwalPertemuan: "Rabu" },
  ]

  const kelompok = await Promise.all(
    kelompokData.map((item) =>
      prisma.kelompok.create({
        data: item,
      })
    )
  )

  const nasabahSeed = [
    ["N-26-0001", "3273010000000001", "Slamet Riyadi", "Pedagang Sayur", "081210000001", "Wonosobo", kolektorA.id, kelompok[0].id],
    ["N-26-0002", "3273010000000002", "Siti Aminah", "Pemilik Warung", "081210000002", "Wonosobo", kolektorA.id, kelompok[0].id],
    ["N-26-0003", "3273010000000003", "Joko Pramono", "Petani", "081210000003", "Kertek", kolektorB.id, kelompok[1].id],
    ["N-26-0004", "3273010000000004", "Dewi Lestari", "Penjahit", "081210000004", "Kertek", kolektorB.id, kelompok[1].id],
    ["N-26-0005", "3273010000000005", "Rina Marlina", "Pedagang Kelontong", "081210000005", "Garung", kolektorA.id, kelompok[2].id],
    ["N-26-0006", "3273010000000006", "Agus Setiawan", "Montir", "081210000006", "Garung", kolektorB.id, kelompok[2].id],
    ["N-26-0007", "3273010000000007", "Nanik Kusuma", "Ibu Rumah Tangga", "081210000007", "Wonosobo", kolektorA.id, kelompok[0].id],
    ["N-26-0008", "3273010000000008", "Bambang Tri", "Pedagang Bakso", "081210000008", "Kertek", kolektorB.id, kelompok[1].id],
    ["N-26-0009", "3273010000000009", "Maya Sari", "UMKM Kue", "081210000009", "Garung", kolektorA.id, kelompok[2].id],
    ["N-26-0010", "3273010000000010", "Yanto Prasetyo", "Peternak", "081210000010", "Wonosobo", kolektorB.id, kelompok[0].id],
    ["N-26-0011", "3273010000000011", "Tutik Handayani", "Pedagang", "081210000011", "Kertek", kolektorA.id, kelompok[1].id],
    ["N-26-0012", "3273010000000012", "Rudi Hartono", "Servis Elektronik", "081210000012", "Garung", kolektorB.id, kelompok[2].id],
  ] as const

  const nasabah = await Promise.all(
    nasabahSeed.map((row, idx) =>
      prisma.nasabah.create({
        data: {
          nomorAnggota: row[0],
          nik: row[1],
          namaLengkap: row[2],
          pekerjaan: row[3],
          noHp: row[4],
          alamat: `Jl. Kampung ${idx + 1} RT 01/RW 03`,
          kecamatan: row[5],
          kotaKab: "Wonosobo",
          kolektorId: row[6],
          kelompokId: row[7],
          status: "AKTIF",
          penjamin: {
            create: {
              namaLengkap: `Penjamin ${row[2]}`,
              nik: `33730100000010${(idx + 1).toString().padStart(2, "0")}`,
              hubungan: "Keluarga",
              noHp: `0821100000${(idx + 1).toString().padStart(2, "0")}`,
              alamat: "Alamat penjamin",
            },
          },
          simpanan: {
            create: [
              { jenis: "POKOK", jumlah: new Prisma.Decimal(250000) },
              { jenis: "WAJIB", jumlah: new Prisma.Decimal(50000) },
            ],
          },
        },
      })
    )
  )

  const plafonTemplate = [5000000, 7000000, 9000000, 12000000, 15000000, 8000000]
  const tenorTemplate = [10, 12, 8, 14, 16, 10]
  const bungaTemplate = [0.015, 0.0175, 0.015, 0.02, 0.018, 0.016]

  for (let i = 0; i < 8; i += 1) {
    const n = nasabah[i]
    const plafon = plafonTemplate[i % plafonTemplate.length]
    const tenor = tenorTemplate[i % tenorTemplate.length]
    const bunga = bungaTemplate[i % bungaTemplate.length]
    const tanggalCair = subMonths(new Date(), 4 + (i % 3))
    const pokokPerBulan = Math.round(plafon / tenor)
    const bungaPerBulan = Math.round(plafon * bunga)
    const totalPerBulan = pokokPerBulan + bungaPerBulan
    const jumlahLunas = Math.max(2, Math.min(tenor - 1, 3 + (i % 3)))
    const sisaPinjaman = Math.max(0, plafon - pokokPerBulan * jumlahLunas)
    const pinjamanStatus: StatusPinjaman = i % 3 === 0 ? "MENUNGGAK" : "AKTIF"
    const pengajuan = await prisma.pengajuan.create({
      data: {
        nasabahId: n.id,
        kelompokId: n.kelompokId,
        jenisPinjaman: i % 2 === 0 ? JenisPinjaman.USAHA : JenisPinjaman.REGULAR,
        plafonDiajukan: new Prisma.Decimal(plafon),
        plafonDisetujui: new Prisma.Decimal(plafon),
        tenor,
        bungaPerBulan: new Prisma.Decimal(bunga),
        tujuanPinjaman: "Modal usaha harian",
        agunan: "BPKB Motor",
        hasilSurvey: "Layak",
        catatanApproval: "Disetujui sesuai plafon",
        status: StatusPengajuan.DICAIRKAN,
        tanggalPengajuan: subMonths(tanggalCair, 1),
        tanggalSurvey: subMonths(tanggalCair, 1),
        tanggalApproval: subMonths(tanggalCair, 1),
        surveyorId: manager.id,
        approverId: admin.id,
      },
    })

    const kontrak = `KNT-26-${(i + 1).toString().padStart(4, "0")}`
    const pinjaman = await prisma.pinjaman.create({
      data: {
        nomorKontrak: kontrak,
        pengajuanId: pengajuan.id,
        pokokPinjaman: new Prisma.Decimal(plafon),
        tenor,
        bungaPerBulan: new Prisma.Decimal(bunga),
        angsuranPokok: new Prisma.Decimal(pokokPerBulan),
        angsuranBunga: new Prisma.Decimal(bungaPerBulan),
        totalAngsuran: new Prisma.Decimal(totalPerBulan),
        potonganAdmin: new Prisma.Decimal(100000),
        potonganProvisi: new Prisma.Decimal(50000),
        nilaiCair: new Prisma.Decimal(plafon - 150000),
        tanggalCair,
        tanggalJatuhTempo: addMonths(tanggalCair, tenor),
        sisaPinjaman: new Prisma.Decimal(sisaPinjaman),
        status: pinjamanStatus,
      },
    })

    await prisma.kasTransaksi.create({
      data: {
        jenis: "KELUAR",
        kategori: "PENCAIRAN",
        deskripsi: `Pencairan pinjaman ${kontrak}`,
        jumlah: new Prisma.Decimal(plafon - 150000),
        kasJenis: "BANK",
        inputOlehId: teller.id,
        tanggal: tanggalCair,
        referensiId: pinjaman.id,
      },
    })

    for (let angsuranKe = 1; angsuranKe <= tenor; angsuranKe += 1) {
      const jatuhTempo = addMonths(tanggalCair, angsuranKe)
      const sudahDibayar = angsuranKe <= jumlahLunas
      await prisma.jadwalAngsuran.create({
        data: {
          pinjamanId: pinjaman.id,
          angsuranKe,
          tanggalJatuhTempo: jatuhTempo,
          pokok: new Prisma.Decimal(pokokPerBulan),
          bunga: new Prisma.Decimal(bungaPerBulan),
          total: new Prisma.Decimal(totalPerBulan),
          sudahDibayar,
          tanggalBayar: sudahDibayar ? jatuhTempo : null,
          dendaHarian: new Prisma.Decimal(0),
        },
      })

      if (sudahDibayar) {
        await prisma.pembayaran.create({
          data: {
            pinjamanId: pinjaman.id,
            tanggalBayar: jatuhTempo,
            pokok: new Prisma.Decimal(pokokPerBulan),
            bunga: new Prisma.Decimal(bungaPerBulan),
            denda: new Prisma.Decimal(0),
            totalBayar: new Prisma.Decimal(totalPerBulan),
            metode: "TRANSFER",
            catatan: `Pembayaran angsuran ke-${angsuranKe}`,
            inputOlehId: teller.id,
          },
        })

        await prisma.kasTransaksi.create({
          data: {
            jenis: "MASUK",
            kategori: "ANGSURAN",
            deskripsi: `Pembayaran ${kontrak} angsuran ke-${angsuranKe}`,
            jumlah: new Prisma.Decimal(totalPerBulan),
            kasJenis: "BANK",
            inputOlehId: teller.id,
            tanggal: jatuhTempo,
            referensiId: pinjaman.id,
          },
        })
      }
    }
  }

  // Tambah pengajuan yang belum selesai untuk demo status workflow
  await prisma.pengajuan.create({
    data: {
      nasabahId: nasabah[9].id,
      kelompokId: nasabah[9].kelompokId,
      jenisPinjaman: JenisPinjaman.MIKRO,
      plafonDiajukan: new Prisma.Decimal(6000000),
      tenor: 10,
      bungaPerBulan: new Prisma.Decimal(0.015),
      tujuanPinjaman: "Renovasi kios",
      status: StatusPengajuan.DIAJUKAN,
      tanggalPengajuan: subMonths(new Date(), 1),
      surveyorId: manager.id,
    },
  })

  await prisma.pengajuan.create({
    data: {
      nasabahId: nasabah[10].id,
      kelompokId: nasabah[10].kelompokId,
      jenisPinjaman: JenisPinjaman.REGULAR,
      plafonDiajukan: new Prisma.Decimal(8000000),
      plafonDisetujui: new Prisma.Decimal(7500000),
      tenor: 12,
      bungaPerBulan: new Prisma.Decimal(0.0175),
      tujuanPinjaman: "Tambah stok dagangan",
      hasilSurvey: "Layak",
      status: StatusPengajuan.DISETUJUI,
      tanggalPengajuan: subMonths(new Date(), 1),
      tanggalSurvey: subMonths(new Date(), 1),
      tanggalApproval: subMonths(new Date(), 1),
      surveyorId: manager.id,
      approverId: admin.id,
    },
  })

  // Tambah kas operasional bulanan
  for (let i = 0; i < 6; i += 1) {
    const tanggal = subMonths(new Date(), i)
    await prisma.kasTransaksi.createMany({
      data: [
        {
          jenis: "KELUAR",
          kategori: "OPERASIONAL",
          deskripsi: `Biaya operasional bulan ${i + 1}`,
          jumlah: new Prisma.Decimal(1500000 + i * 120000),
          kasJenis: "BANK",
          inputOlehId: teller.id,
          tanggal,
        },
        {
          jenis: "KELUAR",
          kategori: "GAJI",
          deskripsi: `Insentif kolektor bulan ${i + 1}`,
          jumlah: new Prisma.Decimal(1800000 + i * 100000),
          kasJenis: "BANK",
          inputOlehId: admin.id,
          tanggal,
        },
      ],
    })
  }

  console.log("✅ Seed template koperasi selesai.")
  console.log("Demo login:")
  console.log("  - admin@koperasi.id / admin123")
  console.log("  - teller@koperasi.id / teller123")
  console.log("  - kolektor1@koperasi.id / kolektor123")
  console.log("  - manager@koperasi.id / manager123")
}

main()
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  })
