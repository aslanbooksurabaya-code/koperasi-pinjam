import { getNeracaSederhana } from "@/actions/akuntansi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default async function NeracaPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string; year?: string }>
}) {
  const sp = await searchParams
  const data = await getNeracaSederhana({ month: sp?.month, year: sp?.year })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Neraca Sederhana</h1>
          <p className="text-muted-foreground text-sm">
            Periode: {new Date(data.year, data.month - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
          </p>
        </div>
        <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
          Sumber: kas + outstanding + simpanan
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter Periode</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/laporan/neraca" className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input name="month" defaultValue={String(data.month)} placeholder="Bulan (1-12)" />
            <Input name="year" defaultValue={String(data.year)} placeholder="Tahun (YYYY)" />
            <Button type="submit">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-blue-700">Aset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.aset.map((r) => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-medium">{fmt(r.nilai)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total Aset</span>
              <span className="text-blue-700">{fmt(data.totals.totalAset)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-amber-700">Kewajiban</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.kewajiban.map((r) => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-medium">{fmt(r.nilai)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total Kewajiban</span>
                <span className="text-amber-700">{fmt(data.totals.totalKewajiban)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base text-emerald-700">Ekuitas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.ekuitas.map((r) => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-medium">{fmt(r.nilai)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total Ekuitas</span>
                <span className="text-emerald-700">{fmt(data.totals.totalEkuitas)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-0 bg-muted/30">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Catatan: Neraca ini versi operasional. Total ekuitas dihitung sebagai selisih total aset dikurangi kewajiban (simpanan).
        </CardContent>
      </Card>
    </div>
  )
}

