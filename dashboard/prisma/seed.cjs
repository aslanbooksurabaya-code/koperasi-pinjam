// Simple seed dengan driver adapter (Prisma v7)
require('dotenv').config()
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const hash = await bcrypt.hash('admin123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'admin@koperasi.id' },
    update: {},
    create: {
      email: 'admin@koperasi.id',
      name: 'Administrator',
      password: hash,
      isActive: true,
      roles: {
        create: [{ role: 'ADMIN' }, { role: 'PIMPINAN' }]
      }
    }
  })
  console.log('✅ Admin created:', user.email)

  const tellerHash = await bcrypt.hash('teller123', 12)
  await prisma.user.upsert({
    where: { email: 'teller@koperasi.id' },
    update: {},
    create: {
      email: 'teller@koperasi.id',
      name: 'Teller Satu',
      password: tellerHash,
      isActive: true,
      roles: { create: [{ role: 'TELLER' }] }
    }
  })
  console.log('✅ Teller created')

  const managerHash = await bcrypt.hash('manager123', 12)
  await prisma.user.upsert({
    where: { email: 'manager@koperasi.id' },
    update: {},
    create: {
      email: 'manager@koperasi.id',
      name: 'Manager Koperasi',
      password: managerHash,
      isActive: true,
      roles: { create: [{ role: 'MANAGER' }, { role: 'SURVEYOR' }] }
    }
  })
  console.log('✅ Manager created')

  await prisma.$disconnect()
  await pool.end()
}

main().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  await pool.end()
  process.exit(1)
})
