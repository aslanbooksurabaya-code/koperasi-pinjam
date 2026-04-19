import { getHistoryPembayaranNasabahReport } from "@/actions/pembayaran"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function rankingBadge(rank: string) {
  if (rank === "A") return <Badge className="bg-emerald-100 text-emerald-700">A - Sangat Lancar</Badge>
  if (rank === "B") return <Badge className="bg-blue-100 text-blue-700">B - Lancar</Badge>
  if (rank === "C") return <Badge className="bg-amber-100 text-amber-700">C - Perlu Pantau</Badge>
  return <Badge className="bg-red-100 text-red-700">D - Risiko</Badge>
}

export default async function HistoryPembayaranPage() {
  const rows = await getHistoryPembayaranNasabahReport()

  const summary = rows.reduce(
    (acc, row) => {
      acc.totalTagihan += row.totalTagihan
      acc.totalDibayar += row.totalDibayar
      acc.kurang += row.kurangAngsuran
      if (row.ranking === "A") acc.rankA += 1
      if (row.lunas) acc.lunas += 1
      return acc
    },
    { totalTagihan: 0, totalDibayar: 0, kurang: 0, rankA: 0, lunas: 0 }
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan History Pembayaran Customer</h1>
        <p className="text-muted-foreground text-sm">Status selesai, kurang angsuran, telat/belum jatuh tempo, ranking indikator nasabah</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Tagihan</p><p className="font-bold">{fmt(summary.totalTagihan)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Dibayar</p><p className="font-bold text-emerald-600">{fmt(summary.totalDibayar)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Kurang Angsuran</p><p className="font-bold text-red-600">{fmt(summary.kurang)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Nasabah Rank A</p><p className="font-bold">{summary.rankA.toLocaleString("id-ID")}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pinjaman Lunas</p><p className="font-bold">{summary.lunas.toLocaleString("id-ID")}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Detail Per Nasabah</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Nasabah</TableHead>
                <TableHead>Kelompok</TableHead>
                <TableHead className="text-right">Selesai</TableHead>
                <TableHead className="text-right">Belum JT</TableHead>
                <TableHead className="text-right">Telat/Belum Bayar</TableHead>
                <TableHead className="text-right">Kurang Angsuran</TableHead>
                <TableHead>Ranking</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.nasabahId}>
                  <TableCell>
                    <p className="font-medium">{r.namaLengkap}</p>
                    <p className="text-xs text-muted-foreground font-mono">{r.nomorAnggota}</p>
                  </TableCell>
                  <TableCell>{r.kelompok}</TableCell>
                  <TableCell className="text-right">{r.selesai.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right">{r.belumJatuhTempo.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right text-red-600">{r.telat.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right">{fmt(r.kurangAngsuran)}</TableCell>
                  <TableCell>{rankingBadge(r.ranking)}</TableCell>
                  <TableCell>
                    {r.lunas ? <Badge className="bg-emerald-100 text-emerald-700">Lunas</Badge> : <Badge variant="outline">Berjalan</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
