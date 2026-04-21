"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { approveKasTransaksi, createKasKategori, deleteKasKategori, getKasPendingApprovals, inputKas, updateKasKategori } from "@/actions/kas"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { NumericFormat } from "react-number-format"
import { CheckCircle2, Plus, RefreshCw, Tags, TrendingDown, TrendingUp, Upload, XCircle, FileText, Wallet, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { KasRowActions } from "./kas-row-actions"

type KasData = {
  transaksi: {
    id: string
    tanggal: Date
    jenis: "MASUK" | "KELUAR"
    kategori: string
    deskripsi: string
    jumlah: number
    kasJenis: string
    buktiUrl?: string | null
    isApproved: boolean
    inputOleh: { name: string }
  }[]
  totalMasuk: number
  totalKeluar: number
  pendingApprovalCount: number
  saldoAwal: number
}

type KasKategori = {
  id: string
  nama: string
  key: string
  jenis: "MASUK" | "KELUAR"
}

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export function KasClientPage({ initialData, initialKategori }: { initialData: KasData; initialKategori: KasKategori[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [isPending, startLoadTransition] = useTransition()
  const [tab, setTab] = useState<"histori" | "input" | "kategori" | "approval">("histori")
  const [jenis, setJenis] = useState<"MASUK" | "KELUAR">("MASUK")
  const [kategori, setKategori] = useState<string>("")
  const [jumlah, setJumlah] = useState<number>(0)
  const [deskripsi, setDeskripsi] = useState("")
  const [kasJenis, setKasJenis] = useState<"TUNAI" | "BANK">("TUNAI")
  const [isUploadingBukti, setIsUploadingBukti] = useState(false)
  const [buktiUrl, setBuktiUrl] = useState<string>("")
  const [kategoriRows, setKategoriRows] = useState<KasKategori[]>(initialKategori)
  const [kategoriJenis, setKategoriJenis] = useState<"MASUK" | "KELUAR">("MASUK")
  const [kategoriNama, setKategoriNama] = useState("")
  const [editingKategoriId, setEditingKategoriId] = useState<string | null>(null)
  const [approvalRows, setApprovalRows] = useState<KasData["transaksi"]>([])
  const [approvalError, setApprovalError] = useState<string>("")
  const [approvalLoadedOnce, setApprovalLoadedOnce] = useState(false)

  const saldoAkhir = initialData.saldoAwal + initialData.totalMasuk - initialData.totalKeluar

  const kategoriOptions = kategoriRows.filter((k) => k.jenis === jenis)

  const setSafeTab = (v: string) => {
    if (v === "histori" || v === "input" || v === "kategori" || v === "approval") setTab(v)
  }

  const loadApprovals = () => {
    startLoadTransition(async () => {
      setApprovalError("")
      const res = await getKasPendingApprovals()
      if (!("success" in res) || !res.success) {
        const err = "error" in res ? res.error : "Gagal memuat data approval kas."
        setApprovalError(typeof err === "string" ? err : "Gagal memuat data approval kas.")
        setApprovalRows([])
        return
      }
      setApprovalRows(
        res.data.map((t) => ({
          id: t.id,
          tanggal: t.tanggal,
          jenis: t.jenis,
          kategori: t.kategori,
          deskripsi: t.deskripsi,
          jumlah: Number(t.jumlah),
          kasJenis: t.kasJenis,
          buktiUrl: t.buktiUrl,
          isApproved: t.isApproved,
          inputOleh: { name: t.inputOleh.name },
        }))
      )
      setApprovalLoadedOnce(true)
    })
  }

  useEffect(() => {
    if (tab !== "approval") return
    if (approvalLoadedOnce) return
    loadApprovals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const uploadBukti = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files.item(0)
    if (!file) return

    setIsUploadingBukti(true)
    try {
      const formData = new FormData()
      formData.append("files", file)
      const res = await fetch("/api/upload/kas", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error ?? "Upload bukti transaksi gagal.")
        return
      }
      const urls = (json?.urls as string[] | undefined) ?? []
      if (urls.length === 0) {
        toast.error("Upload bukti transaksi gagal.")
        return
      }
      setBuktiUrl(urls[0] ?? "")
      toast.success("Bukti transaksi berhasil diupload.")
    } catch {
      toast.error("Upload bukti transaksi gagal.")
    } finally {
      setIsUploadingBukti(false)
    }
  }

  const submitKas = () => {
    if (!kategori.trim()) {
      toast.error("Kategori tidak boleh kosong")
      return
    }

    startLoadTransition(async () => {
      const result = await inputKas({
        jenis,
        kategori,
        deskripsi,
        jumlah,
        kasJenis,
        ...(buktiUrl ? { buktiUrl } : {}),
      })

      if (!result.success) {
        const err = "error" in result ? result.error : null
        toast.error(typeof err === "string" ? err : "Gagal menyimpan transaksi kas.")
        return
      }

      if (result.data?.isApproved === false) {
        toast.success("Transaksi kas tersimpan dan menunggu persetujuan.")
      } else {
        toast.success("Transaksi kas berhasil disimpan.")
      }
      
      // Clear form
      setKategori("")
      setJumlah(0)
      setDeskripsi("")
      setBuktiUrl("")
      
      router.refresh()
      setTab("histori")
    })
  }

  const submitKategori = () => {
    if (!kategoriNama.trim()) {
      toast.error("Nama kategori tidak boleh kosong")
      return
    }

    startLoadTransition(async () => {
      if (editingKategoriId) {
        const res = await updateKasKategori(editingKategoriId, { jenis: kategoriJenis, nama: kategoriNama })
        if (!res.success) {
          const err = "error" in res ? res.error : null
          toast.error(typeof err === "string" ? err : "Gagal mengubah kategori.")
          return
        }
        toast.success("Kategori berhasil diubah.")
        setKategoriRows((prev) => prev.map((k) => (k.id === editingKategoriId ? res.data : k)))
        setEditingKategoriId(null)
      } else {
        const res = await createKasKategori({ jenis: kategoriJenis, nama: kategoriNama })
        if (!res.success) {
          const err = "error" in res ? res.error : null
          toast.error(typeof err === "string" ? err : "Gagal menambah kategori.")
          return
        }
        toast.success("Kategori berhasil ditambahkan.")
        setKategoriRows((prev) => [res.data, ...prev])
      }
      setKategoriNama("")
      router.refresh()
    })
  }

  const handleEditKategori = (k: KasKategori) => {
    setEditingKategoriId(k.id)
    setKategoriNama(k.nama)
    setKategoriJenis(k.jenis)
    // Scroll to form if needed
  }

  const handleDeleteKategori = (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus/menonaktifkan kategori ini?")) return

    startLoadTransition(async () => {
      const res = await deleteKasKategori(id)
      if (!res.success) {
        const err = "error" in res ? res.error : null
        toast.error(typeof err === "string" ? err : "Gagal menghapus kategori.")
        return
      }
      toast.success("Kategori berhasil dihapus/dinonaktifkan.")
      setKategoriRows((prev) => prev.filter((k) => k.id !== id))
      router.refresh()
    })
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Arus Kas</h1>
          <p className="text-muted-foreground text-sm">Modul akuntansi sederhana: pemasukan dan pengeluaran</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { label: "Saldo Akhir", value: fmt(saldoAkhir), icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50/80" },
          { label: "Kas Masuk Hari Ini", value: fmt(initialData.totalMasuk), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50/80" },
          { label: "Kas Keluar Hari Ini", value: fmt(initialData.totalKeluar), icon: TrendingDown, color: "text-red-600", bg: "bg-red-50/80" },
        ].map((s) => (
          <Card key={s.label} className="border-none shadow-sm overflow-hidden transition-all hover:scale-[1.02]">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${s.bg} ${s.color} shadow-sm border border-current/5`}>
                <s.icon className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setSafeTab} className="space-y-6">
        <div className="bg-white p-1.5 rounded-xl border border-slate-100 w-full sm:w-max dark:bg-slate-950 dark:border-slate-800 transition-all">
          <TabsList className="bg-transparent gap-1.5 h-auto p-0 flex flex-col sm:flex-row w-full sm:w-max">
            <TabsTrigger value="histori" className="w-full justify-start sm:justify-center data-[state=active]:bg-secondary data-[state=active]:shadow-sm rounded-lg h-10 sm:h-8 px-4 text-[11px] font-bold uppercase tracking-wider">Riwayat</TabsTrigger>
            <TabsTrigger value="input" className="w-full justify-start sm:justify-center data-[state=active]:bg-secondary data-[state=active]:shadow-sm rounded-lg h-10 sm:h-8 px-4 text-[11px] font-bold uppercase tracking-wider">Input Baru</TabsTrigger>
            <TabsTrigger value="approval" className="w-full justify-start sm:justify-center data-[state=active]:bg-secondary data-[state=active]:shadow-sm rounded-lg h-10 sm:h-8 px-4 text-[11px] font-bold uppercase tracking-wider gap-2">
              Approval
              {initialData.pendingApprovalCount > 0 ? (
                <Badge className="bg-primary text-primary-foreground border-0 h-4 px-1 min-w-[16px] text-[9px] font-black">{initialData.pendingApprovalCount}</Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="kategori" className="w-full justify-start sm:justify-center data-[state=active]:bg-secondary data-[state=active]:shadow-sm rounded-lg h-10 sm:h-8 px-4 text-[11px] font-bold uppercase tracking-wider">Kategori</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="histori">
          <Card className="border-none shadow-sm overflow-hidden w-full">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bukti</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead>Input Oleh</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialData.transaksi.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                          {new Date(row.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge className={`${row.jenis === "MASUK" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"} border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2`}>
                            {row.jenis === "MASUK" ? "↑ Masuk" : "↓ Keluar"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{row.kategori}</span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-slate-600 dark:text-slate-400">{row.deskripsi}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {row.isApproved ? (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2">Approved</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {row.buktiUrl ? (
                            <Button variant="ghost" size="icon" className="size-7 rounded-full hover:bg-blue-50 text-blue-600" asChild>
                               <a href={row.buktiUrl} target="_blank" rel="noreferrer"><FileText className="size-3.5" /></a>
                            </Button>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-bold tracking-tight whitespace-nowrap ${row.jenis === "MASUK" ? "text-emerald-600" : "text-red-500"}`}>
                          {row.jenis === "MASUK" ? "+" : "-"} {fmt(Number(row.jumlah))}
                        </TableCell>
                        <TableCell className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{row.inputOleh.name}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <KasRowActions data={row} kategoriList={kategoriRows} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval">
          <Card className="border-none shadow-sm overflow-hidden w-full">
            <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Approval Transaksi Kas</CardTitle>
                <CardDescription>Daftar transaksi kas yang menunggu persetujuan.</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2 border-slate-200 dark:border-slate-800 shrink-0 w-full sm:w-auto" disabled={isPending} onClick={loadApprovals}>
                <RefreshCw className={`size-3.5 ${isPending ? 'animate-spin' : ''}`} /> 
                <span>Refresh Data</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {approvalError ? (
                <div className="p-12 text-center text-sm text-red-600 bg-red-50/30 font-medium">{approvalError}</div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Bukti</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead>Input Oleh</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvalRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-24 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                               <CheckCircle2 className="size-8 opacity-20 text-emerald-500" />
                               <p>Semua transaksi sudah diproses.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : approvalRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                            {new Date(row.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge className={`${row.jenis === "MASUK" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"} border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2`}>
                              {row.jenis === "MASUK" ? "↑ Masuk" : "↓ Keluar"}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{row.kategori}</span>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-slate-600 dark:text-slate-400">{row.deskripsi}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {row.buktiUrl ? (
                              <Button variant="ghost" size="icon" className="size-7 rounded-full hover:bg-blue-50 text-blue-600" asChild>
                                 <a href={row.buktiUrl} target="_blank" rel="noreferrer"><FileText className="size-3.5" /></a>
                              </Button>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </TableCell>
                          <TableCell className={`text-right font-bold tracking-tight whitespace-nowrap ${row.jenis === "MASUK" ? "text-emerald-600" : "text-red-500"}`}>
                            {row.jenis === "MASUK" ? "+" : "-"} {fmt(Number(row.jumlah))}
                          </TableCell>
                          <TableCell className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{row.inputOleh.name}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="inline-flex gap-2">
                              <Button
                                size="xs"
                                variant="outline"
                                className="h-7 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400"
                                disabled={isPending}
                                onClick={() => {
                                  const catatan = window.prompt("Catatan approval (opsional):", "")
                                  startLoadTransition(async () => {
                                    const res = await approveKasTransaksi({ id: row.id, action: "APPROVE", catatan: catatan ?? undefined })
                                    if (!res.success) {
                                      const err = "error" in res ? res.error : null
                                      toast.error(typeof err === "string" ? err : "Gagal approve transaksi.")
                                      return
                                    }
                                    toast.success("Transaksi kas disetujui.")
                                    loadApprovals()
                                  })
                                }}
                              >
                                <CheckCircle2 className="size-3 mr-1" /> Approve
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                className="h-7 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-rose-700 border-rose-100 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400"
                                disabled={isPending}
                                onClick={() => {
                                  const catatan = window.prompt("Alasan reject (opsional):", "")
                                  startLoadTransition(async () => {
                                    const res = await approveKasTransaksi({ id: row.id, action: "REJECT", catatan: catatan ?? undefined })
                                    if (!res.success) {
                                      const err = "error" in res ? res.error : null
                                      toast.error(typeof err === "string" ? err : "Gagal reject transaksi.")
                                      return
                                    }
                                    toast.success("Transaksi kas ditolak.")
                                    loadApprovals()
                                  })
                                }}
                              >
                                <XCircle className="size-3 mr-1" /> Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="input">
          <Card className="border-none shadow-sm overflow-hidden w-full max-w-2xl mx-auto">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800/50">
               <CardTitle className="text-base font-semibold">Input Transaksi Kas</CardTitle>
               <CardDescription>Catat pengeluaran atau pemasukan kas secara manual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Jenis Transaksi</Label>
                  <Select onValueChange={(v) => {
                    setJenis(v as "MASUK" | "KELUAR")
                    setKategori("")
                  }} value={jenis}>
                    <SelectTrigger className="h-10 border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                      <SelectItem value="MASUK" className="rounded-lg">Kas Masuk</SelectItem>
                      <SelectItem value="KELUAR" className="rounded-lg">Kas Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Kategori Pembukuan</Label>
                  <div className="grid gap-2 grid-cols-[1fr_auto]">
                    <Select
                      onValueChange={(v) => {
                        if (v === "__ADD__") {
                          setTab("kategori")
                          return
                        }
                        if (!v || v === "__NONE__") {
                          setKategori("")
                          return
                        }
                        setKategori(v)
                      }}
                      value={kategori || "__NONE__"}
                    >
                      <SelectTrigger className="h-10 border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800"><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                        <SelectItem value="__NONE__" className="rounded-lg italic opacity-50">Pilih kategori</SelectItem>
                        {kategoriOptions.map((k) => (
                          <SelectItem key={k.id} value={k.key} className="rounded-lg uppercase text-[11px] font-bold">{k.nama}</SelectItem>
                        ))}
                        <SelectSeparator className="bg-slate-50 dark:bg-slate-800" />
                        <SelectItem value="__ADD__" className="rounded-lg font-bold text-primary">+ Add Category</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={() => setTab("kategori")} className="h-10 border-slate-200 dark:border-slate-800">
                      <Tags className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Jumlah (Rp)</Label>
                  <NumericFormat
                    customInput={Input}
                    thousandSeparator="."
                    decimalSeparator=","
                    value={jumlah || ""}
                    onValueChange={(values) => {
                      setJumlah(values.floatValue || 0)
                    }}
                    placeholder="Contoh: 5.000.000"
                    className="h-10 text-lg font-bold tracking-tight text-primary dark:text-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Jenis Kas</Label>
                  <Select onValueChange={(v) => setKasJenis(v as "TUNAI" | "BANK")} value={kasJenis}>
                    <SelectTrigger className="h-10 border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800"><SelectValue placeholder="Tunai / Bank..." /></SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                      <SelectItem value="TUNAI" className="rounded-lg">Kas Tunai</SelectItem>
                      <SelectItem value="BANK" className="rounded-lg">Kas Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Keterangan</Label>
                <Input value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Deskripsi singkat transaksi..." className="h-10" />
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 transition-all">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Bukti Transaksi (opsional)</Label>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  disabled={isUploadingBukti || isPending}
                  onChange={(e) => {
                    void uploadBukti(e.target.files)
                    e.currentTarget.value = ""
                  }}
                  className="h-auto py-1 px-1 text-xs border-dashed"
                />
                <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                   <div className="flex items-center gap-1.5 uppercase tracking-wide">
                     <Upload className="size-3" />
                     {isUploadingBukti ? "Sedang upload..." : "Upload bukti (jpg/png/pdf, max 5MB)"}
                   </div>
                   {buktiUrl && (
                      <button type="button" className="text-red-500 hover:text-red-600 uppercase tracking-widest font-black" onClick={() => setBuktiUrl("")}>Hapus Bukti</button>
                   )}
                </div>
                {buktiUrl && (
                  <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    <FileText className="size-4 text-blue-500 shrink-0" />
                    <a href={buktiUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-medium underline truncate flex-1">
                      {buktiUrl}
                    </a>
                  </div>
                )}
              </div>
              <Button disabled={isPending} onClick={submitKas} className="bg-emerald-600 hover:bg-emerald-700 w-full h-11 rounded-xl shadow-lg shadow-emerald-200/50 dark:shadow-none font-bold uppercase tracking-widest text-[11px] transition-all active:scale-[0.98]">
                {isPending ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                Simpan Transaksi Kas
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kategori">
          <Card className="border-none shadow-sm overflow-hidden w-full max-w-2xl mx-auto">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800/50">
               <CardTitle className="text-base font-semibold">{editingKategoriId ? "Edit Kategori Kas" : "Kelola Kategori Kas"}</CardTitle>
               <CardDescription>
                 {editingKategoriId ? "Ubah nama atau jenis kategori kas" : "Tambah kategori baru untuk pengelompokan laporan arus kas"}
               </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Jenis Kategori</Label>
                  <Select
                    onValueChange={(v) => {
                      if (v === "MASUK" || v === "KELUAR") setKategoriJenis(v)
                    }}
                    value={kategoriJenis}
                  >
                    <SelectTrigger className="h-10 border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                      <SelectItem value="MASUK" className="rounded-lg">Kas Masuk</SelectItem>
                      <SelectItem value="KELUAR" className="rounded-lg">Kas Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nama Kategori</Label>
                  <Input value={kategoriNama} onChange={(e) => setKategoriNama(e.target.value)} placeholder="Contoh: OPERASIONAL" className="h-10 uppercase font-bold" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button disabled={isPending} onClick={submitKategori} className="flex-1 h-10 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all">
                  {editingKategoriId ? <CheckCircle2 className="size-4 mr-2" /> : <Plus className="size-4 mr-2" />}
                  {editingKategoriId ? "Simpan Perubahan" : "Tambah Kategori"}
                </Button>
                {editingKategoriId && (
                  <Button variant="outline" onClick={() => {
                    setEditingKategoriId(null)
                    setKategoriNama("")
                  }} className="h-10 rounded-xl font-bold uppercase tracking-widest text-[11px]">
                    Batal
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                {(["MASUK", "KELUAR"] as const).map((j) => (
                  <div key={j} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{j === "MASUK" ? "Kas Masuk" : "Kas Keluar"}</p>
                      <Badge variant="outline" className="h-5 px-1.5 rounded-md font-bold border-slate-200 dark:border-slate-800 text-[9px]">{kategoriRows.filter((k) => k.jenis === j).length}</Badge>
                    </div>
                    <div className="grid gap-2">
                      {kategoriRows.filter((k) => k.jenis === j).map((k) => (
                        <div key={k.id} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 group transition-all hover:border-primary/20">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold uppercase tracking-tight text-slate-700 dark:text-slate-300">{k.nama}</span>
                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">{k.key}</span>
                          </div>
                          <div className="flex items-center gap-1 transition-opacity">
                            <Button variant="ghost" size="icon" className="size-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleEditKategori(k)}>
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDeleteKategori(k.id)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {kategoriRows.filter((k) => k.jenis === j).length === 0 && (
                        <p className="text-[11px] text-slate-400 italic py-4 text-center">Belum ada kategori.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
