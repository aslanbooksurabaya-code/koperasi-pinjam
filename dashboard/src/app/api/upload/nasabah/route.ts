import { auth } from "@/lib/auth"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
])

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const files = formData.getAll("files").filter((v): v is File => v instanceof File)

  if (files.length === 0) {
    return Response.json({ error: "Tidak ada file yang diupload." }, { status: 400 })
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "nasabah")
  await mkdir(uploadDir, { recursive: true })

  const uploadedUrls: string[] = []

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json(
        { error: `Tipe file tidak didukung: ${file.name}` },
        { status: 400 }
      )
    }
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `Ukuran file melebihi 5 MB: ${file.name}` },
        { status: 400 }
      )
    }

    const ext = path.extname(file.name) || ".bin"
    const safeName = `${Date.now()}-${randomUUID()}${ext}`
    const filePath = path.join(uploadDir, safeName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)
    uploadedUrls.push(`/uploads/nasabah/${safeName}`)
  }

  return Response.json({ urls: uploadedUrls })
}
