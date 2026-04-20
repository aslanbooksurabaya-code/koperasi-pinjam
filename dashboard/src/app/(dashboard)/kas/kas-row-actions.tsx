"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateKas, deleteKas } from "@/actions/kas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { MoreHorizontal, PencilLine, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NumericFormat } from "react-number-format"

type KasData = {
  id: string
  tanggal: Date
  jenis: "MASUK" | "KELUAR"
  kategori: string
  deskripsi: string
  jumlah: number
  kasJenis: string
}

type KasKategori = {
  id: string
  nama: string
  key: string
  jenis: "MASUK" | "KELUAR"
}

export function KasRowActions({ data, kategoriList }: { data: KasData; kategoriList: KasKategori[] }) {
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const defaultDateStr = data.tanggal instanceof Date 
        ? data.tanggal.toISOString().split("T")[0] 
        : new Date(data.tanggal).toISOString().split("T")[0]

  const [tanggal, setTanggal] = useState(defaultDateStr)
  const [jenis, setJenis] = useState(data.jenis)
  const [kategori, setKategori] = useState(data.kategori)
  const [jumlah, setJumlah] = useState<number>(data.jumlah)
  const [deskripsi, setDeskripsi] = useState(data.deskripsi)
  const [kasJenis, setKasJenis] = useState(data.kasJenis)
  const kategoriOptions = kategoriList.filter((k) => k.jenis === jenis)

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!kategori.trim()) {
      toast.error("Kategori tidak boleh kosong")
      return
    }

    startTransition(async () => {
      const result = await updateKas(data.id, {
        tanggal,
        jenis,
        kategori,
        deskripsi,
        jumlah,
        kasJenis,
      })

      if (!result.success) {
        const err = "error" in result ? result.error : null
        toast.error(typeof err === "string" ? err : "Gagal mengedit transaksi.")
        return
      }

      toast.success("Transaksi kas berhasil diupdate.")
      setIsEditOpen(false)
      router.refresh()
    })
  }

  const handleDelete = () => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return
    
    startTransition(async () => {
      const result = await deleteKas(data.id)
      if (!result.success) {
        toast.error("Gagal menghapus.")
      } else {
        toast.success("Transaksi berhasil dihapus.")
        router.refresh()
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Buka menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="gap-2 cursor-pointer">
            <PencilLine className="w-4 h-4" /> Edit Transaksi
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="text-red-600 gap-2 cursor-pointer">
            <Trash2 className="w-4 h-4" /> Hapus Transaksi
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Transaksi Kas</DialogTitle>
              <DialogDescription>
                Peringatan: perhatikan jenis masuk/keluar. Perubahan ini akan mempengaruhi laporan neraca.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jenis</Label>
                  <Select onValueChange={(v) => setJenis(v as "MASUK" | "KELUAR")} value={jenis}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MASUK">Kas Masuk</SelectItem>
                      <SelectItem value="KELUAR">Kas Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kas / Bank</Label>
                  <Select onValueChange={(v) => setKasJenis(v as "TUNAI" | "BANK")} value={kasJenis}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TUNAI">TUNAI</SelectItem>
                      <SelectItem value="BANK">BANK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Kategori Transaksi</Label>
                <Select onValueChange={(v) => setKategori(v ?? "")} value={kategori}>
                  <SelectTrigger><SelectValue placeholder="Kategori" /></SelectTrigger>
                  <SelectContent>
                    {kategoriOptions.map((k) => (
                      <SelectItem key={k.id} value={k.key}>{k.nama}</SelectItem>
                    ))}
                    {!kategoriOptions.some((k) => k.key === kategori) && (
                      <SelectItem value={kategori}>{kategori} (tidak terdaftar)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Jumlah (Rp)</Label>
                <NumericFormat
                  customInput={Input}
                  thousandSeparator="."
                  decimalSeparator=","
                  value={jumlah || ""}
                  onValueChange={(values) => {
                    setJumlah(values.floatValue || 0)
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Input
                  type="text"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
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
