import { getKelompokOverview } from "@/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function kesehatanBadge(tunggakan: number, outstanding: number) {
  const ratio = outstanding > 0 ? tunggakan / outstanding : 0
  if (ratio >= 0.25) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Risiko Tinggi</Badge>
  if (ratio >= 0.1) return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Perlu Perhatian</Badge>
  return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Sehat</Badge>
}

export default async function LaporanPerKelompokPage() {
  const { data } = await getKelompokOverview()
  const ranked = [...data].sort((a, b) => b.outstanding - a.outstanding)

  const totalOutstanding = ranked.reduce((sum, row) => sum + row.outstanding, 0)
  const totalTunggakan = ranked.reduce((sum, row) => sum + row.tunggakan, 0)
  const nplRatio = totalOutstanding > 0 ? (totalTunggakan / totalOutstanding) * 100 : 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan Per Kelompok</h1>
        <p className="text-muted-foreground text-sm">Ringkasan performa dan kolektibilitas setiap kelompok nasabah</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Total Outstanding</p>
            <p className="text-2xl font-bold text-blue-700">{fmt(totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Total Tunggakan</p>
            <p className="text-2xl font-bold text-red-600">{fmt(totalTunggakan)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Rasio NPL Kelompok</p>
            <p className="text-2xl font-bold text-emerald-700">{nplRatio.toFixed(2)}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking & Kolektibilitas Kelompok</CardTitle>
          <CardDescription>Diurutkan berdasarkan outstanding tertinggi</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Kelompok</TableHead>
                <TableHead className="hidden md:table-cell">Wilayah</TableHead>
                <TableHead className="text-center">Anggota</TableHead>
                <TableHead className="text-right">Pinjaman Aktif</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Tunggakan</TableHead>
                <TableHead className="text-center">Kesehatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    Belum ada data kelompok.
                  </TableCell>
                </TableRow>
              ) : (
                ranked.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{row.nama}</p>
                        <p className="text-xs text-muted-foreground">{row.kode}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{row.wilayah}</TableCell>
                    <TableCell className="text-center">{row.anggota}</TableCell>
                    <TableCell className="text-right">{row.pinjamanAktif}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(row.outstanding)}</TableCell>
                    <TableCell className="text-right text-red-600">{fmt(row.tunggakan)}</TableCell>
                    <TableCell className="text-center">{kesehatanBadge(row.tunggakan, row.outstanding)}</TableCell>
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
