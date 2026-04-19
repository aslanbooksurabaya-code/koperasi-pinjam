import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getKelompokById } from "@/actions/kelompok"
import { Button } from "@/components/ui/button"
import { KelompokForm } from "../../_components/kelompok-form"

export default async function KelompokEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const kelompok = await getKelompokById(id)
  if (!kelompok) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/kelompok">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Kelompok</h1>
          <p className="text-muted-foreground text-sm font-mono">{kelompok.kode}</p>
        </div>
      </div>

      <KelompokForm mode="edit" initialData={kelompok} />
    </div>
  )
}
