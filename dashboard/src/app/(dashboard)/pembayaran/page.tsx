import Link from "next/link"
import { getActiveLoanBorrowers, getJadwalPembayaran, getRecentPembayaran } from "@/actions/pembayaran"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search, History, Clock, FileText, ChevronRight } from "lucide-react"
import { BayarButton } from "./bayar-button"
import { EditPembayaranButton } from "./edit-button"
import { ManualPembayaranInput } from "./manual-input"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function agingBadge(hari: number) {
  if (hari <= 0) return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2">Lancar</Badge>
  if (hari <= 30) return <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2">KDP ({hari} hari)</Badge>
  return <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2 hover:bg-red-100">Macet ({hari} hari)</Badge>
}

export default async function PembayaranPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; window?: string }>
}) {
  const sp = await searchParams
  const search = sp?.search ?? ""
  const windowParam = sp?.window ?? "7"
  const windowDays: number | "all" =
    windowParam === "all" ? "all" : Math.max(1, Number(windowParam) || 7)

  const [jadwal, history, activeBorrowers] = await Promise.all([
    getJadwalPembayaran({ search, windowDays }),
    getRecentPembayaran(10),
    getActiveLoanBorrowers(),
  ])

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Pembayaran Angsuran</h1>
          <p className="text-muted-foreground text-sm">Kelola penagihan dan input angsuran masuk dari nasabah.</p>
        </div>
      </div>

      <ManualPembayaranInput borrowers={activeBorrowers} />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
              <div className="mb-4">
                <CardTitle className="text-base font-semibold">Jadwal Penagihan Aktif</CardTitle>
                <CardDescription>Daftar angsuran yang harus segera ditagih atau dibayar</CardDescription>
              </div>
              <form method="GET" className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input name="search" defaultValue={search} placeholder="Cari nama atau nomor kontrak..." className="pl-9 transition-all" />
                </div>
                <select
                  name="window"
                  defaultValue={windowParam}
                  className="h-9 rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900"
                  title="Tampilkan jadwal mendekati jatuh tempo"
                >
                  <option value="7">≤ 7 hari</option>
                  <option value="14">≤ 14 hari</option>
                  <option value="30">≤ 30 hari</option>
                  <option value="all">Semua belum lunas</option>
                </select>
                <Button type="submit" variant="secondary" className="px-6">Cari</Button>
              </form>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Nasabah</TableHead>
                    <TableHead className="hidden md:table-cell">No. Kontrak</TableHead>
                    <TableHead className="text-center">Ke-</TableHead>
                    <TableHead>Tagihan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jadwal.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-24 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Clock className="size-8 opacity-20" />
                          <p>Tidak ada jadwal pembayaran ditemukan.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    jadwal.map((j) => {
                      const hariTelat = Math.max(0, Math.floor((new Date().getTime() - new Date(j.tanggalJatuhTempo).getTime()) / (1000 * 60 * 60 * 24)))
                      return (
                        <TableRow key={j.id} className={hariTelat > 30 ? "bg-red-50/20 dark:bg-red-950/10" : hariTelat > 0 ? "bg-amber-50/20 dark:bg-amber-950/10" : ""}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold tracking-tight">{j.pinjaman.pengajuan.nasabah.namaLengkap}</span>
                              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{j.pinjaman.pengajuan.kelompok?.nama ?? "Individu"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell font-mono text-[10px] text-slate-500 uppercase tracking-widest">{j.pinjaman.nomorKontrak}</TableCell>
                          <TableCell className="text-center font-bold text-slate-900 dark:text-slate-200">{j.angsuranKe}</TableCell>
                          <TableCell className="font-bold text-slate-900 dark:text-slate-200">{fmt(Number(j.total))}</TableCell>
                          <TableCell>{agingBadge(hariTelat)}</TableCell>
                          <TableCell>
                            <BayarButton jadwalId={j.id} total={Number(j.total)} />
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50">
              <div className="flex items-center gap-2 mb-1">
                <History className="size-4 text-primary" />
                <CardTitle className="text-base font-semibold">Riwayat Terakhir</CardTitle>
              </div>
              <CardDescription>10 transaksi pembayaran terbaru</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {history.length === 0 ? (
                  <p className="text-center py-12 text-sm text-muted-foreground">Belum ada riwayat pembayaran.</p>
                ) : (
                  history.map((p) => (
                    <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors dark:hover:bg-slate-900/50">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-200">{p.pinjaman.pengajuan.nasabah.namaLengkap}</span>
                          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{p.pinjaman.nomorKontrak}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest">
                            {p.jadwal?.angsuranKe ? `Angsuran ke-${p.jadwal.angsuranKe}` : "Pembayaran"}
                            {p.jadwal?.tanggalJatuhTempo ? ` · Due ${new Date(p.jadwal.tanggalJatuhTempo).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` : ""}
                            {p.catatan?.includes("mode=PELUNASAN") ? " · Pelunasan" : p.catatan?.includes("mode=PARSIAL") ? " · Parsial" : p.catatan?.includes("mode=FULL") ? " · Penuh" : ""}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-emerald-600 tracking-tight">{fmt(Number(p.totalBayar))}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                          <Clock className="size-3" />
                          {new Date(p.tanggalBayar).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="flex gap-1">
                          <EditPembayaranButton
                            data={{
                              id: p.id,
                              tanggalBayar: p.tanggalBayar,
                              metode: p.metode,
                              buktiBayarUrl: p.buktiBayarUrl,
                              catatan: p.catatan,
                            }}
                          />
                          <Button variant="ghost" size="icon" className="size-6 rounded-md hover:bg-white shadow-xs dark:hover:bg-slate-800" asChild title="Cetak Kuitansi">
                            <Link href={`/dokumen/kuitansi/${p.id}`}><FileText className="size-3" /></Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
                <Button variant="ghost" className="w-full justify-between h-8 text-[11px] font-bold uppercase tracking-widest text-primary hover:text-primary hover:bg-white dark:hover:bg-slate-900" asChild>
                  <Link href="/laporan/history-pembayaran">
                    Lihat Semua Riwayat
                    <ChevronRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
