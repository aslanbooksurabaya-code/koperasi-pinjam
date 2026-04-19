import { getKolektorOverview } from "@/actions/dashboard"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function PctBadge({ target, real }: { target: number; real: number }) {
  if (target <= 0) return <Badge variant="secondary">-</Badge>
  const pct = Math.round((real / target) * 100)
  if (pct >= 100) return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{pct}% ✓</Badge>
  if (pct >= 85) return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{pct}%</Badge>
  return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{pct}%</Badge>
}

export default async function KolektorPage() {
  const kolektorData = await getKolektorOverview()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rekap Kolektor</h1>
        <p className="text-muted-foreground text-sm">Performa real-time berdasarkan data transaksi bulan berjalan</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Kolektor</TableHead>
                <TableHead className="text-center">Nasabah</TableHead>
                <TableHead className="text-center">Kelompok</TableHead>
                <TableHead className="text-right">Target Tertagih</TableHead>
                <TableHead className="text-right">Realisasi</TableHead>
                <TableHead className="text-center">Pencapaian</TableHead>
                <TableHead className="text-right">Tunggakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kolektorData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
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
                    <TableCell className="text-center"><PctBadge target={k.target} real={k.realisasi} /></TableCell>
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
