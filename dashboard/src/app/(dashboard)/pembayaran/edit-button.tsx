"use client"

import { useState, useTransition } from "react"
import { editPembayaranMetadata } from "@/actions/pembayaran"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { PencilLine } from "lucide-react"

type PembayaranData = {
  id: string
  tanggalBayar: Date
  metode: "TUNAI" | "TRANSFER"
  buktiBayarUrl?: string | null
  catatan?: string | null
}

export function EditPembayaranButton({ data }: { data: PembayaranData }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Format Date to YYYY-MM-DD for input type="date"
  const defaultDateStr = data.tanggalBayar instanceof Date 
        ? data.tanggalBayar.toISOString().split("T")[0] 
        : new Date(data.tanggalBayar).toISOString().split("T")[0]

  const [tanggalBayar, setTanggalBayar] = useState(defaultDateStr)
  const [metode, setMetode] = useState<"TUNAI" | "TRANSFER">(data.metode)
  const [buktiBayarUrl, setBuktiBayarUrl] = useState(data.buktiBayarUrl || "")
  const [catatan, setCatatan] = useState(data.catatan || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      const result = await editPembayaranMetadata({
        id: data.id,
        tanggalBayar: tanggalBayar || undefined,
        metode,
        buktiBayarUrl: buktiBayarUrl.trim() || undefined,
        catatan: catatan.trim() || undefined,
      })

      if (!("success" in result) || !result.success) {
        toast.error("error" in result ? result.error : "Gagal mengedit data.")
        return
      }

      toast.success("Perubahan data pembayaran berhasil disimpan.")
      setIsOpen(false)
    })
  }

  return (
    <>
      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setIsOpen(true)}>
        <PencilLine className="w-3 h-3" />
        Edit
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Referensi Pembayaran</DialogTitle>
              <DialogDescription>
                Anda hanya dapat mengubah rincian metode, tanggal, dan catatan penerimaan kas (tidak dapat mengubah nominal tagihan demi integritas data).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Tanggal Bayar Asli</Label>
                <Input
                  type="date"
                  value={tanggalBayar}
                  onChange={(e) => setTanggalBayar(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
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
                <Label>Bukti Transfer / Dokumen (Opsional URL)</Label>
                <Input
                  type="text"
                  placeholder="https://..."
                  value={buktiBayarUrl}
                  onChange={(e) => setBuktiBayarUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Catatan Tambahan</Label>
                <Input
                  type="text"
                  placeholder="Catatan..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
