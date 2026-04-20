import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { FileText, Download, TrendingUp, TrendingDown, Wallet, Calendar } from "lucide-react"
import { getArusKasReport } from "@/actions/kas"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default async function ArusKasLaporanPage({
  searchParams,
}: {
  searchParams?: Promise<{ from?: string; to?: string; groupBy?: string }>
}) {
  const sp = await searchParams
  const groupBy = sp?.groupBy === "WEEK" ? "WEEK" : "MONTH"

  const report = await getArusKasReport({
    from: sp?.from,
    to: sp?.to,
    groupBy,
  })

  const totalMasuk = report.totals.masuk
  const totalKeluar = report.totals.keluar
  const totalSurplus = report.totals.surplus
  const maxVal = Math.max(1, ...report.data.flatMap(d => [d.masuk, d.keluar]))

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })

  const defaultFrom = sp?.from ?? report.from.toISOString().slice(0, 10)
  const defaultTo = sp?.to ?? report.to.toISOString().slice(0, 10)

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Laporan Arus Kas</h1>
          <p className="text-muted-foreground text-sm">Analisis perbandingan pemasukan dan pengeluaran kas.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 h-9 rounded-lg border-slate-200 dark:border-slate-800" asChild>
            <a href={`?groupBy=${groupBy}&from=${defaultFrom}&to=${defaultTo}`}>
              <Calendar className="size-3.5" />
              <span className="hidden sm:inline">
                {fmtDate(report.from)} – {fmtDate(report.to)}
              </span>
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 h-9 rounded-lg border-slate-200 dark:border-slate-800">
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="size-4 text-primary" />
            <CardTitle className="text-base font-semibold">Filter Periode</CardTitle>
          </div>
          <CardDescription>Filter mingguan/bulanan atau rentang tanggal tertentu.</CardDescription>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2" action="/laporan/arus-kas">
            <select
              name="groupBy"
              defaultValue={groupBy}
              className="h-9 rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900"
            >
              <option value="MONTH">Bulanan</option>
              <option value="WEEK">Mingguan</option>
            </select>
            <input
              type="date"
              name="from"
              defaultValue={defaultFrom}
              className="h-9 rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900"
            />
            <input
              type="date"
              name="to"
              defaultValue={defaultTo}
              className="h-9 rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900"
            />
            <Button type="submit" className="h-9 rounded-lg font-bold uppercase tracking-widest text-[11px]">
              Terapkan
            </Button>
          </form>
        </CardHeader>
      </Card>

      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: "Total Kas Masuk", value: fmt(totalMasuk), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50/80" },
              { label: "Total Kas Keluar", value: fmt(totalKeluar), icon: TrendingDown, color: "text-rose-600", bg: "bg-rose-50/80" },
              { label: "Net Surplus", value: fmt(totalSurplus), icon: Wallet, color: "text-blue-600", bg: "bg-blue-50/80" },
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

      {/* Bar Chart */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Visualisasi Arus Kas</CardTitle>
              <CardDescription>Perbandingan bulanan kas masuk vs kas keluar</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full inline-block bg-emerald-500" /> Masuk</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full inline-block bg-rose-400" /> Keluar</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full inline-block bg-blue-400" /> Surplus</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="flex items-end gap-6 h-52 px-4">
            {report.data.map((d) => (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex items-end gap-1.5 w-full max-w-[80px]" style={{ height: "160px" }}>
                  <div className="flex-1 bg-emerald-500 rounded-t-sm opacity-90 transition-all hover:opacity-100"
                    style={{ height: `${(d.masuk / maxVal) * 100}%` }} title={fmt(d.masuk)} />
                  <div className="flex-1 bg-rose-400 rounded-t-sm opacity-80 transition-all hover:opacity-100"
                    style={{ height: `${(d.keluar / maxVal) * 100}%` }} title={fmt(d.keluar)} />
                  <div className="flex-1 bg-blue-400 rounded-t-sm opacity-70 transition-all hover:opacity-100"
                    style={{ height: `${(d.surplus / maxVal) * 100}%` }} title={fmt(d.surplus)} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{d.key}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <CardTitle className="text-base font-semibold">Rincian Laporan</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Periode</TableHead>
                <TableHead className="text-right text-emerald-600 dark:text-emerald-400">Kas Masuk</TableHead>
                <TableHead className="text-right text-rose-600 dark:text-rose-400">Kas Keluar</TableHead>
                <TableHead className="text-right text-blue-600 dark:text-blue-400">Surplus</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.data.map((row, i) => (
                <TableRow key={row.key} className={i === report.data.length - 1 ? "bg-blue-50/10 dark:bg-blue-900/5" : ""}>
                  <TableCell className="font-bold text-slate-700 dark:text-slate-300">{row.key}</TableCell>
                  <TableCell className="text-right font-medium text-emerald-600">{fmt(row.masuk)}</TableCell>
                  <TableCell className="text-right font-medium text-rose-500">{fmt(row.keluar)}</TableCell>
                  <TableCell className="text-right font-bold text-blue-600 tracking-tight">{fmt(row.surplus)}</TableCell>
                  <TableCell className="text-center">
                    {row.surplus > 150000000
                      ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2">Sangat Baik</Badge>
                      : <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2">Stabil</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="bg-slate-50/50 dark:bg-slate-900/20">
              <TableRow className="hover:bg-transparent">
                <TableCell className="font-black uppercase tracking-widest text-slate-500">Total</TableCell>
                <TableCell className="text-right font-bold text-emerald-600 text-sm">{fmt(totalMasuk)}</TableCell>
                <TableCell className="text-right font-bold text-rose-600 text-sm">{fmt(totalKeluar)}</TableCell>
                <TableCell className="text-right font-black text-blue-700 dark:text-blue-400 text-base tracking-tighter">{fmt(totalSurplus)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
