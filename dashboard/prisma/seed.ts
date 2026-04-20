import "dotenv/config"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, RoleType } from "@prisma/client"
import bcrypt from "bcryptjs"

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
    select: { id: true, email: true, name: true },
  })
}

async function cleanDatabase() {
  // Delete children first (FK safety)
  await prisma.auditLog.deleteMany()
  await prisma.approvalLog.deleteMany()
  await prisma.kolektorTarget.deleteMany()
  await prisma.notifikasi.deleteMany()
  await prisma.rekonsiliasiKas.deleteMany()
  await prisma.kasTransaksi.deleteMany()
  await prisma.pembayaran.deleteMany()
  await prisma.jadwalAngsuran.deleteMany()
  await prisma.pinjaman.deleteMany()
  await prisma.pengajuan.deleteMany()
  await prisma.simpanan.deleteMany()
  await prisma.penjamin.deleteMany()
  await prisma.nasabah.deleteMany()
  await prisma.kelompok.deleteMany()
  await prisma.kasKategori.deleteMany()
  await prisma.account.deleteMany()
  await prisma.appSetting.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.user.deleteMany()
}

async function main() {
  console.log("Resetting database (basic seed: users + kelompok only)...")
  await cleanDatabase()

  await createUser({
    email: "admin@koperasi.id",
    name: "Administrator",
    password: "admin123",
    roles: ["ADMIN", "PIMPINAN"],
  })

  await createUser({
    email: "teller@koperasi.id",
    name: "Teller",
    password: "teller123",
    roles: ["TELLER"],
  })

  await createUser({
    email: "manager@koperasi.id",
    name: "Manager",
    password: "manager123",
    roles: ["MANAGER"],
  })

  await prisma.kelompok.createMany({
    data: [
      {
        kode: "KL-001",
        nama: "Kelompok Mentari",
        ketua: "Pak Suryo",
        wilayah: "Wonosobo",
        jadwalPertemuan: "Senin",
      },
      {
        kode: "KL-002",
        nama: "Mitra Sejahtera",
        ketua: "Bu Siti",
        wilayah: "Kertek",
        jadwalPertemuan: "Selasa",
      },
      {
        kode: "KL-003",
        nama: "Guyub Rukun",
        ketua: "Pak Slamet",
        wilayah: "Garung",
        jadwalPertemuan: "Rabu",
      },
    ],
  })

  console.log("✅ Basic seed done.")
  console.log("Demo login:")
  console.log("  - admin@koperasi.id / admin123")
  console.log("  - teller@koperasi.id / teller123")
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

