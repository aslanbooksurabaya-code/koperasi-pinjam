import { getKolektorFilterOptions, getKolektorOverview } from "@/actions/dashboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function PctBadge({ pct }: { pct: number }) {
  if (pct >= 100) return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{pct}% ✓</Badge>
  if (pct >= 85) return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{pct}%</Badge>
  return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{pct}%</Badge>
}

export default async function KolektorPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string; year?: string; kolektorId?: string; wilayah?: string }>
}) {
  const sp = await searchParams
  const now = new Date()

  const filters = {
    month: sp?.month ?? String(now.getMonth() + 1),
    year: sp?.year ?? String(now.getFullYear()),
    kolektorId: sp?.kolektorId,
    wilayah: sp?.wilayah,
  }

  const [options, kolektorData] = await Promise.all([
    getKolektorFilterOptions(),
    getKolektorOverview(filters),
  ])

  const totals = kolektorData.reduce(
    (acc, item) => {
      acc.target += item.target
      acc.realisasi += item.realisasi
      acc.tunggakan += item.tunggakan
      acc.setoran += item.setoran
      return acc
    },
    { target: 0, realisasi: 0, tunggakan: 0, setoran: 0 }
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rekap Kolektor</h1>
        <p className="text-muted-foreground text-sm">KPI target, realisasi, tunggakan, dan setoran kolektor</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form className="grid grid-cols-1 md:grid-cols-5 gap-3" action="/monitoring/kolektor">
            <Input type="number" name="month" min={1} max={12} defaultValue={filters.month} placeholder="Bulan" />
            <Input type="number" name="year" min={2020} max={2100} defaultValue={filters.year} placeholder="Tahun" />
            <select name="kolektorId" defaultValue={filters.kolektorId ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Semua kolektor</option>
              {options.kolektor.map((k) => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
            <select name="wilayah" defaultValue={filters.wilayah ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Semua wilayah</option>
              {options.wilayah.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
            <Button type="submit">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Target</p><p className="text-lg font-bold">{fmt(totals.target)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Realisasi</p><p className="text-lg font-bold text-emerald-600">{fmt(totals.realisasi)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Tunggakan</p><p className="text-lg font-bold text-red-600">{fmt(totals.tunggakan)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Setoran</p><p className="text-lg font-bold text-blue-600">{fmt(totals.setoran)}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Kolektor</TableHead>
                <TableHead className="text-center">Nasabah</TableHead>
                <TableHead className="text-center">Kelompok</TableHead>
                <TableHead className="text-right">Target Tagihan</TableHead>
                <TableHead className="text-right">Realisasi</TableHead>
                <TableHead className="text-right">Setoran</TableHead>
                <TableHead className="text-center">Pencapaian</TableHead>
                <TableHead className="text-right">Tunggakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kolektorData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    Belum ada data kolektor aktif.
                  </TableCell>
                </TableRow>
              ) : (
                kolektorData.map((k) => (
                  <TableRow key={k.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{k.nama}</TableCell>
                    <TableCell className="text-center">{k.nasabah.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-center">{k.kelompok.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(k.target)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmt(k.realisasi)}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(k.setoran)}</TableCell>
                    <TableCell className="text-center"><PctBadge pct={k.pencapaian} /></TableCell>
                    <TableCell className="text-right text-sm text-red-500">{fmt(k.tunggakan)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
