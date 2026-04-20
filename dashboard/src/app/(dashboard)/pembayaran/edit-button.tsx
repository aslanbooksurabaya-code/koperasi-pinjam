"use client"

import { useState, useTransition } from "react"
import { editPembayaranMetadata } from "@/actions/pembayaran"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { PencilLine, Upload, X } from "lucide-react"

type PembayaranData = {
  id: string
  tanggalBayar: Date
  metode: "TUNAI" | "TRANSFER"
  buktiBayarUrl?: string | null
  catatan?: string | null
}

async function uploadBuktiPembayaran(file: File) {
  const formData = new FormData()
  formData.append("files", file)
  const res = await fetch("/api/upload/pembayaran", { method: "POST", body: formData })
  const json = (await res.json()) as { urls?: string[]; error?: string }
  if (!res.ok || !json.urls?.length) {
    throw new Error(json.error ?? "Upload bukti gagal.")
  }
  return json.urls[0]
}

export function EditPembayaranButton({ data }: { data: PembayaranData }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)

  // Format Date to YYYY-MM-DD for input type="date"
  const defaultDateStr = data.tanggalBayar instanceof Date 
        ? data.tanggalBayar.toISOString().split("T")[0] 
        : new Date(data.tanggalBayar).toISOString().split("T")[0]

  const [tanggalBayar, setTanggalBayar] = useState(defaultDateStr)
  const [metode, setMetode] = useState<"TUNAI" | "TRANSFER">(data.metode)
  const [buktiBayarUrl, setBuktiBayarUrl] = useState(data.buktiBayarUrl || "")
  const [buktiFileName, setBuktiFileName] = useState(data.buktiBayarUrl?.split("/").pop() || "")
  const [catatan, setCatatan] = useState(data.catatan || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      try {
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
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal mengedit data.")
      }
    })
  }

  const handleUpload = async (file: File | null) => {
    if (!file) return
    setIsUploading(true)
    try {
      const url = await uploadBuktiPembayaran(file)
      setBuktiBayarUrl(url)
      setBuktiFileName(file.name)
      toast.success("Bukti berhasil diupload.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload bukti gagal.")
    } finally {
      setIsUploading(false)
    }
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
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === "TUNAI" || v === "TRANSFER") setMetode(v)
                  }}
                >
                  <option value="TUNAI">Kas Tunai</option>
                  <option value="TRANSFER">Transfer Bank</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Bukti Transfer / Dokumen</Label>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  disabled={isUploading || isPending}
                  onChange={(e) => {
                    void handleUpload(e.target.files?.item(0) ?? null)
                    e.currentTarget.value = ""
                  }}
                />
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Upload className="size-3" /> {isUploading ? "Sedang upload..." : "Upload file bukti pembayaran (max 5MB)."}
                </p>
                {buktiBayarUrl ? (
                  <div className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    <span className="truncate">{buktiFileName || buktiBayarUrl.split("/").pop() || buktiBayarUrl}</span>
                    <button
                      type="button"
                      className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      onClick={() => {
                        setBuktiBayarUrl("")
                        setBuktiFileName("")
                      }}
                    >
                      <X className="size-3" /> Hapus
                    </button>
                  </div>
                ) : null}
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
              <Button type="submit" disabled={isPending || isUploading} className="bg-indigo-600 hover:bg-indigo-700">
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
