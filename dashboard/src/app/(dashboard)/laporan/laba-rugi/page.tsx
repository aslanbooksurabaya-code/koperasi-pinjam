import { getLabaRugiSummary } from "@/actions/kas"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default async function LabaRugiPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string; year?: string }>
}) {
  const sp = await searchParams
  const data = await getLabaRugiSummary({ month: sp?.month, year: sp?.year })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Laba Rugi</h1>
          <p className="text-muted-foreground text-sm">Periode: {new Date(data.year, data.month - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Sumber: Transaksi Kas</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {[
          { label: "Total Pendapatan", value: fmt(data.totalPendapatan), color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Beban", value: fmt(data.totalBeban), color: "text-red-600", bg: "bg-red-50" },
          { label: "Laba Bersih", value: fmt(data.laba), color: data.laba >= 0 ? "text-blue-600" : "text-red-600", bg: "bg-blue-50" },
        ].map((s) => (
          <Card key={s.label} className={`${s.bg} border-0`}>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base text-emerald-700">A. Pendapatan</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.pendapatan.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada data pemasukan periode ini.</p> : data.pendapatan.map((p) => (
              <div key={p.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{p.label}</span>
                <span className="font-medium">{fmt(p.jumlah)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total Pendapatan</span>
              <span className="text-emerald-600">{fmt(data.totalPendapatan)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base text-red-600">B. Beban</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.beban.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada data pengeluaran periode ini.</p> : data.beban.map((b) => (
              <div key={b.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="font-medium">{fmt(b.jumlah)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total Beban</span>
              <span className="text-red-600">{fmt(data.totalBeban)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
