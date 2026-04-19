import Link from "next/link"
import { getLaporanTransaksiUserReport } from "@/actions/pembayaran"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default async function TransaksiPerUserPage({
  searchParams,
}: {
  searchParams?: Promise<{ kelompokId?: string; search?: string }>
}) {
  const sp = await searchParams
  const report = await getLaporanTransaksiUserReport({
    kelompokId: sp?.kelompokId,
    search: sp?.search,
  })

  const search = sp?.search ?? ""
  const kelompokId = sp?.kelompokId ?? ""

  function rankingBadge(rank: string) {
    if (rank === "A") return <Badge className="bg-emerald-100 text-emerald-700">A - Sangat Lancar</Badge>
    if (rank === "B") return <Badge className="bg-blue-100 text-blue-700">B - Lancar</Badge>
    if (rank === "C") return <Badge className="bg-amber-100 text-amber-700">C - Perlu Pantau</Badge>
    return <Badge className="bg-red-100 text-red-700">D - Risiko</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan Transaksi User</h1>
        <p className="text-muted-foreground text-sm">Gabungan per kelompok + history pembayaran user/nasabah</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form className="grid grid-cols-1 md:grid-cols-3 gap-3" action="/laporan/transaksi-per-user">
            <Input name="search" defaultValue={search} placeholder="Cari user/nasabah (nama, anggota, NIK)" />
            <select name="kelompokId" defaultValue={kelompokId} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Semua kelompok</option>
              {report.kelompokOptions.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <Button type="submit">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Tagihan</p><p className="font-bold">{fmt(report.summary.totalTagihan)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Dibayar</p><p className="font-bold text-emerald-600">{fmt(report.summary.totalDibayar)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Kurang Angsuran</p><p className="font-bold text-red-600">{fmt(report.summary.kurang)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Outstanding</p><p className="font-bold text-blue-600">{fmt(report.summary.outstanding)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Rank A</p><p className="font-bold">{report.summary.rankA.toLocaleString("id-ID")}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Anomali Pencatatan</p><p className="font-bold text-amber-700">{report.summary.anomaliPembayaran.toLocaleString("id-ID")} trx</p><p className="text-xs text-muted-foreground">{fmt(report.summary.anomaliNominal)}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>User/Nasabah</TableHead>
                <TableHead>Kelompok</TableHead>
                <TableHead className="text-right">Selesai</TableHead>
                <TableHead className="text-right">Belum JT</TableHead>
                <TableHead className="text-right">Telat</TableHead>
                <TableHead className="text-right">Kurang</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Ranking</TableHead>
                <TableHead className="text-right">Anomali</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">Belum ada data transaksi user untuk filter ini.</TableCell>
                </TableRow>
              ) : report.data.map((r) => (
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
                  <TableCell className="text-right">{fmt(r.outstanding)}</TableCell>
                  <TableCell>{rankingBadge(r.ranking)}</TableCell>
                  <TableCell className="text-right">{r.anomaliPembayaran > 0 ? <Badge className="bg-amber-100 text-amber-700">{r.anomaliPembayaran}</Badge> : "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/nasabah/${r.nasabahId}`}>Detail</Link>
                    </Button>
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
