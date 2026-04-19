import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getPengajuanById } from "@/actions/pengajuan"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApprovalForm } from "../approval-form"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n)
}

export default async function ApprovePengajuanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pengajuan = await getPengajuanById(id)

  if (!pengajuan) notFound()

  // Jika status sudah bukan DIAJUKAN, arahkan ke detail agar user lihat state terkini.
  if (pengajuan.status !== "DIAJUKAN") {
    redirect(`/pengajuan/${id}`)
  }

  const plafon = Number(pengajuan.plafonDiajukan)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pengajuan">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Approval Pengajuan</h1>
          <p className="text-muted-foreground text-sm font-mono">{pengajuan.id}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ringkasan Pengajuan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Nasabah</p>
                <p className="font-medium">{pengajuan.nasabah.namaLengkap}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kelompok</p>
                <p className="font-medium">{pengajuan.kelompok?.nama ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jenis Pinjaman</p>
                <p className="font-medium">{pengajuan.jenisPinjaman}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plafon Diajukan</p>
                <p className="font-medium">{fmt(plafon)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tenor</p>
                <p className="font-medium">{pengajuan.tenor} bulan</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bunga</p>
                <p className="font-medium">{(Number(pengajuan.bungaPerBulan) * 100).toFixed(2)}% / bulan</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Tujuan Pinjaman</p>
              <p className="font-medium">{pengajuan.tujuanPinjaman ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <ApprovalForm pengajuanId={id} plafonDiajukan={plafon} />
      </div>
    </div>
  )
}
