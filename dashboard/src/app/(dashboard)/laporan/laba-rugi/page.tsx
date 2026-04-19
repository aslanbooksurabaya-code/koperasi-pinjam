import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

const pendapatan = [
  { label: "Pendapatan Bunga Pinjaman", jumlah: 182500000 },
  { label: "Pendapatan Administrasi", jumlah: 12500000 },
  { label: "Denda Keterlambatan", jumlah: 8750000 },
  { label: "Pendapatan Lain-lain", jumlah: 3200000 },
]

const beban = [
  { label: "Beban Gaji Karyawan", jumlah: 65000000 },
  { label: "Beban Operasional Kantor", jumlah: 18500000 },
  { label: "Beban Transport Kolektor", jumlah: 12000000 },
  { label: "Beban Penyusutan", jumlah: 5000000 },
  { label: "Beban Lain-lain", jumlah: 3750000 },
]

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default function LabaRugiPage() {
  const totalPendapatan = pendapatan.reduce((a, b) => a + b.jumlah, 0)
  const totalBeban = beban.reduce((a, b) => a + b.jumlah, 0)
  const laba = totalPendapatan - totalBeban

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Laba Rugi</h1>
          <p className="text-muted-foreground text-sm">Periode: April 2024</p>
        </div>
        <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">Sudah Diverifikasi</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {[
          { label: "Total Pendapatan", value: fmt(totalPendapatan), color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Beban", value: fmt(totalBeban), color: "text-red-600", bg: "bg-red-50" },
          { label: "Laba Bersih", value: fmt(laba), color: "text-blue-600", bg: "bg-blue-50" },
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
            {pendapatan.map((p) => (
              <div key={p.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{p.label}</span>
                <span className="font-medium">{fmt(p.jumlah)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total Pendapatan</span>
              <span className="text-emerald-600">{fmt(totalPendapatan)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base text-red-600">B. Beban</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {beban.map((b) => (
              <div key={b.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="font-medium">{fmt(b.jumlah)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total Beban</span>
              <span className="text-red-600">{fmt(totalBeban)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Laba Bersih Bulan Ini (A - B)</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">{fmt(laba)}</p>
          </div>
          <Badge className="text-lg px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            +18.4% dari bulan lalu
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
