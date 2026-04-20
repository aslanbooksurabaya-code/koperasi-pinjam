"use client"

import { useState, useTransition } from "react"
import { inputPembayaran } from "@/actions/pembayaran"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Wallet, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function getLocalDateInputValue(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
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

export function BayarButton({ jadwalId, total }: { jadwalId: string; total: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  const [mode, setMode] = useState<"FULL" | "PARSIAL" | "PELUNASAN">("FULL")
  const [metode, setMetode] = useState<"TUNAI" | "TRANSFER">("TUNAI")
  const [jumlahBayar, setJumlahBayar] = useState(total.toString())
  const [tanggalBayar, setTanggalBayar] = useState("")
  const [buktiBayarUrl, setBuktiBayarUrl] = useState("")
  const [buktiFileName, setBuktiFileName] = useState("")
  const [savedPembayaranId, setSavedPembayaranId] = useState<string | null>(null)
  const [savedNominal, setSavedNominal] = useState<number>(0)
  const [savedDenda, setSavedDenda] = useState<number>(0)
  const [savedMode, setSavedMode] = useState<"FULL" | "PARSIAL" | "PELUNASAN">("FULL")

  const handleSuccessOpenChange = (open: boolean) => {
    setIsSuccessOpen(open)
    if (!open) {
      router.refresh()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const jumlah = Number(jumlahBayar)
    if (mode === "PARSIAL" && (jumlah <= 0 || !jumlah)) {
      toast.error("Jumlah bayar parsial tidak valid.")
      return
    }

    startTransition(async () => {
      try {
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
        setSavedPembayaranId(result.pembayaranId)
        setSavedNominal(result.totalBayar)
        setSavedDenda(result.denda)
        setSavedMode(result.mode)
        setIsOpen(false)
        setIsSuccessOpen(true)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal memproses pembayaran.")
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
      toast.success("Bukti pembayaran berhasil diupload.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload bukti gagal.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="default" onClick={() => {
          if (!tanggalBayar) setTanggalBayar(getLocalDateInputValue(new Date()))
          setIsOpen(true)
        }} className="h-7 gap-1 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:text-white active:bg-emerald-800">

          <Wallet className="size-3" />
          Bayar
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] border-slate-200 bg-blue-50 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
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
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === "FULL" || v === "PARSIAL" || v === "PELUNASAN") setMode(v)
                  }}
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending || isUploading} className="bg-emerald-600 hover:bg-emerald-700">
              {isPending ? "Menyimpan..." : "Simpan Pembayaran"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
      <Dialog open={isSuccessOpen} onOpenChange={handleSuccessOpenChange}>
        <DialogContent className="sm:max-w-[460px] border-emerald-200 bg-emerald-50 shadow-2xl dark:border-emerald-900 dark:bg-emerald-950/40">
          <DialogHeader>
            <DialogTitle>Pembayaran tersimpan</DialogTitle>
            <DialogDescription>
              Dokumen kuitansi siap dicetak. Total pembayaran {fmt(savedNominal)}
              {savedDenda > 0 ? `, termasuk denda ${fmt(savedDenda)}` : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-emerald-200 bg-white/80 p-4 text-sm text-slate-700 shadow-sm dark:border-emerald-900 dark:bg-slate-950/60 dark:text-slate-200">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium">Mode pembayaran</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {savedMode}
              </span>
            </div>
            <div className="mt-3 text-xs text-slate-500 break-all">
              ID pembayaran: {savedPembayaranId ?? "-"}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSuccessOpenChange(false)}
            >
              Tutup
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                if (!savedPembayaranId) return
                window.open(`/dokumen/kuitansi/${savedPembayaranId}`, "_blank", "noopener,noreferrer")
                handleSuccessOpenChange(false)
              }}
            >
              Cetak Kuitansi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
