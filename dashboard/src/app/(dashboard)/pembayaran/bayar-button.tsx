"use client"

import { useState, useTransition } from "react"
import { inputPembayaran } from "@/actions/pembayaran"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Wallet } from "lucide-react"
import { useRouter } from "next/navigation"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export function BayarButton({ jadwalId, total }: { jadwalId: string; total: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [mode, setMode] = useState<"FULL" | "PARSIAL" | "PELUNASAN">("FULL")
  const [metode, setMetode] = useState<"TUNAI" | "TRANSFER">("TUNAI")
  const [jumlahBayar, setJumlahBayar] = useState(total.toString())
  const [tanggalBayar, setTanggalBayar] = useState(new Date().toISOString().split("T")[0])
  const [buktiBayarUrl, setBuktiBayarUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const jumlah = Number(jumlahBayar)
    if (mode === "PARSIAL" && (jumlah <= 0 || !jumlah)) {
      toast.error("Jumlah bayar parsial tidak valid.")
      return
    }

    startTransition(async () => {
      const result = await inputPembayaran({
        jadwalAngsuranId: jadwalId,
        mode,
        jumlahBayar: mode === "PARSIAL" ? jumlah : undefined,
        metode,
        buktiBayarUrl: buktiBayarUrl.trim() || undefined,
        tanggalBayar: tanggalBayar || undefined,
      })
      if (!("success" in result) || !result.success) {
        toast.error("error" in result ? result.error : "Gagal memproses pembayaran.")
        return
      }
      const dendaInfo = result.denda > 0 ? ` (termasuk denda ${fmt(result.denda)})` : ""
      toast.success(`Pembayaran berhasil dicatat${dendaInfo}.`)
      setIsOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button size="sm" onClick={() => setIsOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs gap-1">
          <Wallet className="size-3" />
          Bayar
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Proses Pembayaran</DialogTitle>
            <DialogDescription>
              Total tagihan angsuran saat ini: <strong className="text-slate-900">{fmt(total)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Tipe Pembayaran</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
              >
                <option value="FULL">Sesuai Tagihan (Penuh)</option>
                <option value="PARSIAL">Bayar Sebagian (Parsial)</option>
                <option value="PELUNASAN">Pelunasan Dipercepat</option>
              </select>
            </div>

            {mode === "PARSIAL" && (
              <div className="space-y-2">
                <Label>Nominal Dibayar (Rp)</Label>
                <Input
                  type="number"
                  value={jumlahBayar}
                  onChange={(e) => setJumlahBayar(e.target.value)}
                  placeholder="Contoh: 50000"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Metode</Label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={metode}
                  onChange={(e) => setMetode(e.target.value as any)}
                >
                  <option value="TUNAI">Kas Tunai</option>
                  <option value="TRANSFER">Transfer Bank</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Bayar</Label>
                <Input
                  type="date"
                  value={tanggalBayar}
                  onChange={(e) => setTanggalBayar(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bukti Transfer / Dokumen (Opsional URL)</Label>
              <Input
                type="text"
                placeholder="https://..."
                value={buktiBayarUrl}
                onChange={(e) => setBuktiBayarUrl(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">Catatan: Fitur upload file fisik menyusul. Sementara gunakan tautan/URL (Cloudflare R2 dll).</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
              {isPending ? "Menyimpan..." : "Simpan Pembayaran"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
