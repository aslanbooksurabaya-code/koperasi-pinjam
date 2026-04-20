"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cairkanPinjaman } from "@/actions/pengajuan"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Banknote } from "lucide-react"

interface Props {
  pengajuan: {
    id: string
    nasabah: { namaLengkap: string; nomorAnggota: string }
    plafonDiajukan: unknown
    plafonDisetujui: unknown
    tenor: number
    bungaPerBulan: unknown
  }
}

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function getLocalDateInputValue(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export function PencairanForm({ pengajuan }: Props) {
  const [isPending, startTransition] = useTransition()
  const [potonganAdmin, setPotonganAdmin] = useState(0)
  const [potonganProvisi, setPotonganProvisi] = useState(0)
  const [tanggalCair, setTanggalCair] = useState(() =>
    getLocalDateInputValue(new Date()),
  )
  const router = useRouter()

  const plafon = Number(pengajuan.plafonDisetujui ?? pengajuan.plafonDiajukan)
  const bunga = Number(pengajuan.bungaPerBulan)
  const tenor = pengajuan.tenor

  const angsuranPokok = plafon / tenor
  const angsuranBunga = plafon * bunga
  const totalAngsuran = angsuranPokok + angsuranBunga
  const nilaiCair = plafon - potonganAdmin - potonganProvisi

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await cairkanPinjaman({
        pengajuanId: pengajuan.id,
        potonganAdmin,
        potonganProvisi,
        tanggalCair,
      })
      if (result.error) {
        toast.error(typeof result.error === "string" ? result.error : "Gagal mencairkan pinjaman")
        return
      }
      toast.success(`Pinjaman berhasil dicairkan! No. Kontrak: ${result.data?.nomorKontrak}`)
      router.push(`/dokumen/pencairan/${pengajuan.id}`)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Banknote className="size-4 text-teal-600" /> Form Pencairan
        </CardTitle>
        <CardDescription>
          {pengajuan.nasabah.namaLengkap} · {pengajuan.nasabah.nomorAnggota}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
            <p className="font-medium text-muted-foreground text-xs">Rincian Pinjaman</p>
            {[
              { label: "Plafon Disetujui", value: fmt(plafon) },
              { label: "Tenor", value: `${tenor} bulan` },
              { label: "Bunga Flat/bln", value: `${(bunga * 100).toFixed(1)}%` },
              { label: "Angsuran Pokok/bln", value: fmt(angsuranPokok) },
              { label: "Angsuran Bunga/bln", value: fmt(angsuranBunga) },
              { label: "Total Angsuran/bln", value: fmt(totalAngsuran), bold: true },
              { label: "Total Beban Bunga", value: fmt(angsuranBunga * tenor) },
            ].map((r) => (
              <div key={r.label} className="flex justify-between">
                <span className="text-muted-foreground">{r.label}</span>
                <span className={r.bold ? "font-bold" : ""}>{r.value}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Potongan Admin (Rp)</Label>
              <Input
                type="number"
                placeholder="0"
                value={potonganAdmin || ""}
                onChange={(e) => setPotonganAdmin(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Potongan Provisi (Rp)</Label>
              <Input
                type="number"
                placeholder="0"
                value={potonganProvisi || ""}
                onChange={(e) => setPotonganProvisi(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tanggal Pencairan</Label>
            <Input
              type="date"
              value={tanggalCair}
              onChange={(e) => setTanggalCair(e.target.value)}
              required
              suppressHydrationWarning
            />
          </div>

          <div className="rounded-lg bg-teal-50 border border-teal-200 p-4 text-sm">
            <div className="flex justify-between font-bold text-teal-900">
              <span>Nilai Bersih Diterima</span>
              <span className="text-xl">{fmt(nilaiCair)}</span>
            </div>
            {(potonganAdmin + potonganProvisi) > 0 && (
              <p className="text-xs text-teal-700 mt-1">Dipotong Rp {fmt(potonganAdmin + potonganProvisi)}</p>
            )}
          </div>

          <Button type="submit" disabled={isPending} className="w-full bg-teal-600 hover:bg-teal-700">
            <Banknote className="size-4" />
            {isPending ? "Memproses..." : `Cairkan ${fmt(nilaiCair)}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
