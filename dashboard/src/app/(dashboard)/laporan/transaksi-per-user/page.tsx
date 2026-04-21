import Link from "next/link"
import { getLaporanTransaksiUserReport } from "@/actions/pembayaran"
import { getRankingConfig } from "@/actions/settings"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { explainRanking } from "@/lib/ranking"
import { Filter, Users, LayoutGrid, Info, Eye, AlertCircle, TrendingUp, TrendingDown, Wallet, UserCheck } from "lucide-react"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default async function TransaksiPerUserPage({
  searchParams,
}: {
  searchParams?: Promise<{ kelompokId?: string; search?: string; view?: string }>
}) {
  const sp = await searchParams
  const view = sp?.view === "kelompok" ? "kelompok" : "user"
  const report = await getLaporanTransaksiUserReport({
    kelompokId: sp?.kelompokId,
    search: sp?.search,
  })
  const rankingConfig = await getRankingConfig()

  const search = sp?.search ?? ""
  const kelompokId = sp?.kelompokId ?? ""

  function rankingBadge(rank: string) {
    if (rank === "A") return <Badge className="bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2">A - Sangat Lancar</Badge>
    if (rank === "B") return <Badge className="bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2">B - Lancar</Badge>
    if (rank === "C") return <Badge className="bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2">C - Perlu Pantau</Badge>
    return <Badge className="bg-rose-100/80 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2">D - Risiko</Badge>
  }

  const kelompokSummary = (() => {
    if (view !== "kelompok") return []
    const rankOrder: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 }
    type KelompokAgg = {
      kelompok: string
      nasabahCount: number
      totalTagihan: number
      totalDibayar: number
      kurangAngsuran: number
      outstanding: number
      selesai: number
      belumJatuhTempo: number
      telat: number
      rankA: number
      rankB: number
      rankC: number
      rankD: number
      worstRank: "A" | "B" | "C" | "D"
    }
    const map = new Map<string, KelompokAgg>()
    for (const row of report.data) {
      const key = row.kelompok || "-"
      const prev = map.get(key) ?? {
        kelompok: key,
        nasabahCount: 0,
        totalTagihan: 0,
        totalDibayar: 0,
        kurangAngsuran: 0,
        outstanding: 0,
        selesai: 0,
        belumJatuhTempo: 0,
        telat: 0,
        rankA: 0,
        rankB: 0,
        rankC: 0,
        rankD: 0,
        worstRank: "A",
      }
      prev.nasabahCount += 1
      prev.totalTagihan += row.totalTagihan
      prev.totalDibayar += row.totalDibayar
      prev.kurangAngsuran += row.kurangAngsuran
      prev.outstanding += row.outstanding
      prev.selesai += row.selesai
      prev.belumJatuhTempo += row.belumJatuhTempo
      prev.telat += row.telat
      if (row.ranking === "A") prev.rankA += 1
      else if (row.ranking === "B") prev.rankB += 1
      else if (row.ranking === "C") prev.rankC += 1
      else prev.rankD += 1
      if (rankOrder[row.ranking] > rankOrder[prev.worstRank]) prev.worstRank = row.ranking as "A" | "B" | "C" | "D"
      map.set(key, prev)
    }
    return Array.from(map.values()).sort((a, b) => b.outstanding - a.outstanding)
  })()

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Laporan Transaksi User</h1>
        <p className="text-muted-foreground text-sm">Analisis kolektibilitas nasabah dan performa kelompok.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-2 mb-4">
             <Filter className="size-4 text-primary" />
             <CardTitle className="text-base font-semibold">Filter Laporan</CardTitle>
          </div>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-4" action="/laporan/transaksi-per-user">
            <Input name="search" defaultValue={search} placeholder="Nama, anggota, atau NIK..." />
            <select name="kelompokId" defaultValue={kelompokId} className="h-9 rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900">
              <option value="">Semua kelompok</option>
              {report.kelompokOptions.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <select name="view" defaultValue={view} className="h-9 rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900">
              <option value="user">Lihat per Nasabah</option>
              <option value="kelompok">Lihat per Kelompok</option>
            </select>
            <Button type="submit" className="h-9 rounded-lg font-bold uppercase tracking-widest text-[10px]">Terapkan Filter</Button>
          </form>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm overflow-hidden transition-all hover:scale-[1.02] bg-emerald-50/20">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 mb-1">Total Dibayar</p>
            <p className="text-xl font-black tracking-tighter text-emerald-700">{fmt(report.summary.totalDibayar)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm overflow-hidden transition-all hover:scale-[1.02] bg-rose-50/20">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/60 mb-1">Kurang Angsuran</p>
            <p className="text-xl font-black tracking-tighter text-rose-700">{fmt(report.summary.kurang)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm overflow-hidden transition-all hover:scale-[1.02] bg-blue-50/20">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600/60 mb-1">Total Outstanding</p>
            <p className="text-xl font-black tracking-tighter text-blue-700">{fmt(report.summary.outstanding)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm overflow-hidden transition-all hover:scale-[1.02] bg-amber-50/20">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/60 mb-1">Anomali Bayar</p>
            <p className="text-xl font-black tracking-tighter text-amber-700">{report.summary.anomaliPembayaran} Trx</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
           <div className="flex items-center gap-2">
              <LayoutGrid className="size-4 text-primary" />
              <CardTitle className="text-base font-semibold">Data Hasil Analisis</CardTitle>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          {view === "kelompok" ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nama Kelompok</TableHead>
                  <TableHead className="text-right">Anggota</TableHead>
                  <TableHead className="text-right">Telat</TableHead>
                  <TableHead className="text-right">Kurang</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Worst Rank</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kelompokSummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-24 text-center text-muted-foreground">Belum ada data kelompok.</TableCell>
                  </TableRow>
                ) : kelompokSummary.map((k) => (
                  <TableRow key={k.kelompok}>
                    <TableCell className="font-bold text-slate-900 dark:text-slate-200 tracking-tight">{k.kelompok}</TableCell>
                    <TableCell className="text-right font-medium text-slate-500">{k.nasabahCount.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-bold text-rose-600">{k.telat.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-medium text-slate-600 dark:text-slate-400">{fmt(k.kurangAngsuran)}</TableCell>
                    <TableCell className="text-right font-bold text-blue-600 tracking-tight">{fmt(k.outstanding)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-slate-200 dark:border-slate-800 h-5 px-1.5 font-black text-rose-600">{k.worstRank}</Badge>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          A:{k.rankA} B:{k.rankB} C:{k.rankC} D:{k.rankD}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User/Nasabah</TableHead>
                  <TableHead>Kelompok</TableHead>
                  <TableHead className="text-right">Selesai</TableHead>
                  <TableHead className="text-right">Telat</TableHead>
                  <TableHead className="text-right">Tunggakan</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Ranking</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-24 text-center text-muted-foreground">Belum ada data transaksi.</TableCell>
                  </TableRow>
                ) : report.data.map((r) => {
                  const explain = explainRanking({ telat: r.telat, tunggakanNominal: r.tunggakanNominal }, rankingConfig)
                  return (
                    <TableRow key={r.nasabahId}>
                      <TableCell>
                        <div className="flex flex-col">
                           <span className="font-bold tracking-tight text-slate-900 dark:text-slate-200">{r.namaLengkap}</span>
                           <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{r.nomorAnggota}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold text-slate-500 uppercase">{r.kelompok}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        {r.progress?.total
                          ? `${r.progress.paid}/${r.progress.total} ${r.progress.tenorType === "MINGGUAN" ? "Mingguan" : "Bulanan"}`
                          : r.selesai.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-600">
                        {r.overdue?.count && r.overdue.count > 0 && r.overdue.oldestDueAt ? (
                          <span title="Jatuh tempo terlama yang belum lunas">
                            Telat {r.overdue.count} ({new Date(r.overdue.oldestDueAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}) {r.overdue.daysLate} hari
                          </span>
                        ) : (
                          r.telat.toLocaleString("id-ID")
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-600 dark:text-slate-400">{fmt(r.tunggakanNominal)}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600 tracking-tight">{fmt(r.outstanding)}</TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger render={<span className="inline-flex cursor-help">{rankingBadge(r.ranking)}</span>} />
                          <TooltipContent className="max-w-xs p-3 rounded-xl shadow-xl border-slate-100 dark:border-slate-800">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-widest border-b pb-1.5 border-slate-100 dark:border-slate-800">
                                 <Info className="size-3" />
                                 Analisis Ranking
                              </div>
                              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-snug">{explain.summary}</div>
                              <div className="space-y-1">
                                {explain.rules.map((line) => (
                                  <div key={line} className="text-[10px] text-muted-foreground flex items-start gap-1.5 leading-tight">
                                     <div className="size-1 rounded-full bg-slate-300 mt-1 flex-shrink-0" />
                                     {line}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" asChild>
                          <Link href={`/nasabah/${r.nasabahId}`}><Eye className="size-3.5 text-slate-500" /></Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
