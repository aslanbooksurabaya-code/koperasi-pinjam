import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KelompokForm } from "../_components/kelompok-form"

export default function KelompokBaruPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/kelompok">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tambah Kelompok</h1>
          <p className="text-muted-foreground text-sm">Input data kelompok nasabah koperasi</p>
        </div>
      </div>

      <KelompokForm mode="create" />
    </div>
  )
}
