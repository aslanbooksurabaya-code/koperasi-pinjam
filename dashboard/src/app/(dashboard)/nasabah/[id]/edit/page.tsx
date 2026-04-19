import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getKolektorList, getKelompokList, getNasabahById } from "@/actions/nasabah"
import { Button } from "@/components/ui/button"
import { EditNasabahForm } from "./edit-form"

export default async function EditNasabahPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [nasabah, kelompokList, kolektorList] = await Promise.all([
    getNasabahById(id),
    getKelompokList(),
    getKolektorList(),
  ])

  if (!nasabah) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/nasabah/${id}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Nasabah</h1>
          <p className="text-muted-foreground text-sm font-mono">{nasabah.nomorAnggota}</p>
        </div>
      </div>

      <EditNasabahForm nasabah={nasabah} kelompokList={kelompokList} kolektorList={kolektorList} />
    </div>
  )
}
