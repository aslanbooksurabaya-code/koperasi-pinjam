"use client"

import { useState, useTransition } from "react"
import { inputKas } from "@/actions/kas"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, TrendingUp, TrendingDown } from "lucide-react"
import { toast } from "sonner"

type KasData = {
  transaksi: {
    id: string
    tanggal: Date
    jenis: "MASUK" | "KELUAR"
    kategori: string
    deskripsi: string
    jumlah: number
    kasJenis: string
    inputOleh: { name: string }
  }[]
  totalMasuk: number
  totalKeluar: number
  saldoAwal: number
}

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export function KasClientPage({ initialData }: { initialData: KasData }) {
  const [isPending, startTransition] = useTransition()
  const [jenis, setJenis] = useState<"MASUK" | "KELUAR">("MASUK")
  const [kategori, setKategori] = useState("ANGSURAN")
  const [jumlah, setJumlah] = useState("")
  const [deskripsi, setDeskripsi] = useState("")
  const [kasJenis, setKasJenis] = useState<"TUNAI" | "BANK">("TUNAI")

  const saldoAkhir = initialData.saldoAwal + initialData.totalMasuk - initialData.totalKeluar

  const submitKas = () => {
    startTransition(async () => {
      const result = await inputKas({
        jenis,
        kategori,
        deskripsi,
        jumlah: Number(jumlah),
        kasJenis,
      })

      if (!result.success) {
        toast.error("Gagal menyimpan transaksi kas.")
        return
      }

      toast.success("Transaksi kas berhasil disimpan.")
      window.location.reload()
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Arus Kas</h1>
          <p className="text-muted-foreground text-sm">Modul akuntansi sederhana: pemasukan dan pengeluaran</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Saldo Akhir", value: fmt(saldoAkhir), icon: TrendingUp, color: "text-emerald-600" },
          { label: "Kas Masuk Hari Ini", value: fmt(initialData.totalMasuk), icon: TrendingUp, color: "text-blue-600" },
          { label: "Kas Keluar Hari Ini", value: fmt(initialData.totalKeluar), icon: TrendingDown, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted/40 ${s.color}`}>
                <s.icon className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="histori">
        <TabsList>
          <TabsTrigger value="histori">Riwayat Transaksi</TabsTrigger>
          <TabsTrigger value="input">Input Transaksi Baru</TabsTrigger>
        </TabsList>

        <TabsContent value="histori">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Input Oleh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialData.transaksi.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(row.tanggal).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge className={row.jenis === "MASUK" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                          {row.jenis === "MASUK" ? "↑ Masuk" : "↓ Keluar"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{row.kategori}</TableCell>
                      <TableCell className="text-sm">{row.deskripsi}</TableCell>
                      <TableCell className={`text-right font-semibold ${row.jenis === "MASUK" ? "text-emerald-600" : "text-red-500"}`}>
                        {row.jenis === "MASUK" ? "+" : "-"} {fmt(Number(row.jumlah))}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.inputOleh.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="input">
          <Card>
            <CardHeader><CardTitle className="text-base">Input Transaksi Kas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jenis Transaksi</Label>
                  <Select onValueChange={(v) => setJenis(v as "MASUK" | "KELUAR")} defaultValue="MASUK">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MASUK">Kas Masuk</SelectItem>
                      <SelectItem value="KELUAR">Kas Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select onValueChange={(v) => setKategori(v ?? "LAINNYA")} value={kategori}>
                    <SelectTrigger><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
                    <SelectContent>
                      {jenis === "MASUK" ? (
                        <>
                          <SelectItem value="ANGSURAN">Angsuran Nasabah</SelectItem>
                          <SelectItem value="SIMPANAN">Simpanan Anggota</SelectItem>
                          <SelectItem value="ADMIN">Biaya Administrasi</SelectItem>
                          <SelectItem value="DENDA">Denda</SelectItem>
                          <SelectItem value="LAINNYA">Lainnya</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="PENCAIRAN">Pencairan Pinjaman</SelectItem>
                          <SelectItem value="GAJI">Gaji/Insentif</SelectItem>
                          <SelectItem value="OPERASIONAL">Biaya Operasional</SelectItem>
                          <SelectItem value="LAINNYA">Lainnya</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jumlah (Rp)</Label>
                  <Input value={jumlah} onChange={(e) => setJumlah(e.target.value)} placeholder="Contoh: 5000000" />
                </div>
                <div className="space-y-2">
                  <Label>Jenis Kas</Label>
                  <Select onValueChange={(v) => setKasJenis(v as "TUNAI" | "BANK")} value={kasJenis}>
                    <SelectTrigger><SelectValue placeholder="Tunai / Bank..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TUNAI">Kas Tunai</SelectItem>
                      <SelectItem value="BANK">Kas Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Keterangan</Label>
                <Input value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Deskripsi singkat transaksi..." />
              </div>
              <Button disabled={isPending} onClick={submitKas} className="bg-emerald-600 hover:bg-emerald-700 w-full gap-1">
                <Plus className="size-4" /> Simpan Transaksi
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
