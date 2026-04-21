import { getTunggakanFilterOptions, getTunggakanList } from "@/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, AlertTriangle, Calendar, Users, LayoutGrid, MapPin, TrendingDown, Clock, ShieldAlert } from "lucide-react"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function agingLabel(hari: number) {
  if (hari <= 7) return { label: `1-7 hari (${hari}h)`, cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" }
  if (hari <= 30) return { label: `8-30 hari (${hari}h)`, cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" }
  if (hari <= 60) return { label: `31-60 hari (${hari}h)`, cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" }
  return { label: `>60 hari — NPL (${hari}h)`, cls: "bg-red-600 text-white dark:bg-red-950 dark:text-red-400" }
}

export default async function TunggakanPage({
  searchParams,
}: {
  searchParams?: Promise<{
    tanggalDari?: string
    tanggalSampai?: string
    kolektorId?: string
    kelompokId?: string
    wilayah?: string
  }>
}) {
  const sp = await searchParams
  const params = {
    tanggalDari: sp?.tanggalDari,
    tanggalSampai: sp?.tanggalSampai,
    kolektorId: sp?.kolektorId,
    kelompokId: sp?.kelompokId,
    wilayah: sp?.wilayah,
  }

  const [filterOptions, result] = await Promise.all([getTunggakanFilterOptions(), getTunggakanList(params)])
  const tunggakan = result.data

  const buckets = [
    { label: "1-7 hari", count: result.summary.buckets["1-7"].count, total: result.summary.buckets["1-7"].total },
    { label: "8-30 hari", count: result.summary.buckets["8-30"].count, total: result.summary.buckets["8-30"].total },
    { label: "31-60 hari", count: result.summary.buckets["31-60"].count, total: result.summary.buckets["31-60"].total },
    { label: ">60 hari (NPL)", count: result.summary.buckets[">60"].count, total: result.summary.buckets[">60"].total },
  ]

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Data Tunggakan (Aging Report)</h1>
        <p className="text-muted-foreground text-sm">Monitoring angsuran yang melewati jatuh tempo.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-2 mb-4">
             <Calendar className="size-4 text-primary" />
             <CardTitle className="text-base font-semibold">Filter Monitoring</CardTitle>
          </div>
          <form className="grid grid-cols-1 md:grid-cols-6 gap-3" action="/monitoring/tunggakan">
            <Input type="date" name="tanggalDari" defaultValue={params.tanggalDari} />
            <Input type="date" name="tanggalSampai" defaultValue={params.tanggalSampai} />
            <select name="kolektorId" defaultValue={params.kolektorId ?? ""} className="h-9 rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900">
              <option value="">Semua kolektor</option>
              {filterOptions.kolektor.map((k) => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
            <select name="kelompokId" defaultValue={params.kelompokId ?? ""} className="h-9 rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900">
              <option value="">Semua kelompok</option>
              {filterOptions.kelompok.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <select name="wilayah" defaultValue={params.wilayah ?? ""} className="h-9 rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900">
              <option value="">Semua wilayah</option>
              {filterOptions.wilayah.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
            <Button type="submit" className="h-9 rounded-lg font-bold uppercase tracking-widest text-[10px]">Terapkan</Button>
          </form>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {buckets.map((b, i) => {
          const colors = ["text-yellow-600", "text-orange-600", "text-rose-600", "text-red-700"]
          const bgs = ["bg-yellow-50/50 border-yellow-100", "bg-orange-50/50 border-orange-100", "bg-rose-50/50 border-rose-100", "bg-red-50 border-red-100"]
          const icons = [Clock, AlertTriangle, ShieldAlert, ShieldAlert]
          const Icon = icons[i]
          return (
            <Card key={b.label} className={`border shadow-none transition-all hover:scale-[1.02] ${bgs[i]} dark:bg-slate-900/20 dark:border-slate-800`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{b.label}</p>
                   <Icon className={`size-3.5 ${colors[i]}`} />
                </div>
                <p className={`text-2xl font-black tracking-tight ${colors[i]}`}>{b.count} <span className="text-xs font-bold uppercase opacity-60">kasus</span></p>
                <p className={`text-[11px] font-bold mt-1 ${colors[i]} opacity-80`}>{fmt(b.total)}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm overflow-hidden bg-rose-50/20">
          <CardContent className="p-5 flex items-center gap-4">
             <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 shadow-sm border border-rose-200/50 dark:bg-rose-950/20 dark:border-rose-900/50">
               <TrendingDown className="size-5" />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/60 mb-0.5">Total Tunggakan</p>
               <p className="text-xl font-black tracking-tighter text-rose-700">{fmt(result.summary.totalTunggakan)}</p>
             </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm overflow-hidden bg-red-50/30">
          <CardContent className="p-5 flex items-center gap-4">
             <div className="p-3 rounded-2xl bg-red-100 text-red-700 shadow-sm border border-red-200/50 dark:bg-red-950/20 dark:border-red-900/50">
               <ShieldAlert className="size-5" />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-red-600/60 mb-0.5">Outstanding NPL</p>
               <p className="text-xl font-black tracking-tighter text-red-800">{fmt(result.summary.nplOutstanding)}</p>
             </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
             <div className="p-3 rounded-2xl bg-slate-100 text-slate-600 shadow-sm border border-slate-200/50 dark:bg-slate-800 dark:text-slate-400">
               <AlertTriangle className="size-5" />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Rasio NPL</p>
               <p className="text-2xl font-black tracking-tighter">{result.summary.nplRatio.toFixed(2)}%</p>
             </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
           <div className="flex items-center gap-2">
              <LayoutGrid className="size-4 text-primary" />
              <CardTitle className="text-base font-semibold">Detail Tunggakan</CardTitle>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nasabah</TableHead>
                <TableHead className="hidden md:table-cell">Kelompok</TableHead>
                <TableHead className="hidden md:table-cell">Wilayah</TableHead>
                <TableHead className="hidden lg:table-cell">No. Kontrak</TableHead>
                <TableHead className="text-center">Ke-</TableHead>
                <TableHead>Status Aging</TableHead>
                <TableHead className="text-right">Total Tagihan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tunggakan.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-24 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                       <CheckCircle2 className="size-8 opacity-20 text-emerald-500" />
                       <p>Tidak ada data tunggakan pada filter ini.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tunggakan.map((t) => {
                  const ag = agingLabel(t.hariTelat)
                  const nasabah = t.pinjaman.pengajuan.nasabah
                  return (
                    <TableRow key={t.id} className={t.hariTelat > 60 ? "bg-red-50/20 dark:bg-red-950/10" : ""}>
                      <TableCell>
                        <div className="flex flex-col">
                           <span className="font-bold tracking-tight text-slate-900 dark:text-slate-200">{nasabah.namaLengkap}</span>
                           <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{nasabah.noHp}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t.pinjaman.pengajuan.kelompok?.nama ?? "—"}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs font-medium text-slate-500">{t.pinjaman.pengajuan.kelompok?.wilayah ?? "—"}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">{t.pinjaman.nomorKontrak}</span>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-900 dark:text-slate-200">{t.angsuranKe}</TableCell>
                      <TableCell>
                        <Badge className={`${ag.cls} border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2`}>{ag.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600 tracking-tight">{fmt(Number(t.total))}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

import { CheckCircle2 } from "lucide-react"
