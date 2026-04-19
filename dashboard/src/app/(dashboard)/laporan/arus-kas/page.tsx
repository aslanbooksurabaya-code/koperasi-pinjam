import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const bulanData = [
  { bulan: "Nov 2023", masuk: 415200000, keluar: 282100000, surplus: 133100000 },
  { bulan: "Des 2023", masuk: 382000000, keluar: 314500000, surplus: 67500000 },
  { bulan: "Jan 2024", masuk: 512400000, keluar: 341800000, surplus: 170600000 },
  { bulan: "Feb 2024", masuk: 468700000, keluar: 293400000, surplus: 175300000 },
  { bulan: "Mar 2024", masuk: 541800000, keluar: 374200000, surplus: 167600000 },
  { bulan: "Apr 2024", masuk: 490300000, keluar: 320100000, surplus: 170200000 },
]

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default function ArusKasLaporanPage() {
  const totalMasuk = bulanData.reduce((a, b) => a + b.masuk, 0)
  const totalKeluar = bulanData.reduce((a, b) => a + b.keluar, 0)
  const totalSurplus = totalMasuk - totalKeluar
  const maxVal = Math.max(...bulanData.flatMap(d => [d.masuk, d.keluar]))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Arus Kas</h1>
          <p className="text-muted-foreground text-sm">6 bulan terakhir</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="6">
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Bulan</SelectItem>
              <SelectItem value="6">6 Bulan</SelectItem>
              <SelectItem value="12">12 Bulan</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">Export PDF</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Total Kas Masuk", value: fmt(totalMasuk), color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Kas Keluar", value: fmt(totalKeluar), color: "text-red-600", bg: "bg-red-50" },
          { label: "Net Surplus", value: fmt(totalSurplus), color: "text-blue-600", bg: "bg-blue-50" },
        ].map((s) => (
          <Card key={s.label} className={`${s.bg} border-0`}>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Perbandingan Arus Kas Per Bulan</CardTitle>
              <CardDescription>Kas masuk vs kas keluar</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm inline-block bg-emerald-500" /> Masuk</span>
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm inline-block bg-rose-400" /> Keluar</span>
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm inline-block bg-blue-400" /> Surplus</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 h-52 pb-6 border-b">
            {bulanData.map((d) => (
              <div key={d.bulan} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-1 w-full" style={{ height: "160px" }}>
                  <div className="flex-1 bg-emerald-500 rounded-t opacity-90 transition-all hover:opacity-100"
                    style={{ height: `${(d.masuk / maxVal) * 100}%` }} title={fmt(d.masuk)} />
                  <div className="flex-1 bg-rose-400 rounded-t opacity-80 transition-all hover:opacity-100"
                    style={{ height: `${(d.keluar / maxVal) * 100}%` }} title={fmt(d.keluar)} />
                  <div className="flex-1 bg-blue-400 rounded-t opacity-70 transition-all hover:opacity-100"
                    style={{ height: `${(d.surplus / maxVal) * 100}%` }} title={fmt(d.surplus)} />
                </div>
                <span className="text-xs text-muted-foreground text-center">{d.bulan}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rincian Per Bulan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium">Periode</th>
                <th className="text-right px-4 py-3 font-medium text-emerald-600">Kas Masuk</th>
                <th className="text-right px-4 py-3 font-medium text-red-500">Kas Keluar</th>
                <th className="text-right px-4 py-3 font-medium text-blue-600">Surplus</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {bulanData.map((row, i) => (
                <tr key={row.bulan} className={`border-b hover:bg-muted/20 ${i === bulanData.length - 1 ? "font-semibold" : ""}`}>
                  <td className="px-4 py-3">{row.bulan}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{fmt(row.masuk)}</td>
                  <td className="px-4 py-3 text-right text-red-500">{fmt(row.keluar)}</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-semibold">{fmt(row.surplus)}</td>
                  <td className="px-4 py-3 text-center">
                    {row.surplus > 150000000
                      ? <Badge className="bg-emerald-100 text-emerald-700">Baik</Badge>
                      : <Badge className="bg-amber-100 text-amber-700">Cukup</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30 font-bold">
                <td className="px-4 py-3">Total 6 Bulan</td>
                <td className="px-4 py-3 text-right text-emerald-600">{fmt(totalMasuk)}</td>
                <td className="px-4 py-3 text-right text-red-500">{fmt(totalKeluar)}</td>
                <td className="px-4 py-3 text-right text-blue-600">{fmt(totalSurplus)}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
