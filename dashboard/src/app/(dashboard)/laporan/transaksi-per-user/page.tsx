import { getTransaksiPerUserReport } from "@/actions/kas"
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
  searchParams?: Promise<{ month?: string; year?: string; userId?: string }>
}) {
  const sp = await searchParams
  const report = await getTransaksiPerUserReport({
    month: sp?.month,
    year: sp?.year,
    userId: sp?.userId,
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan Transaksi Per User</h1>
        <p className="text-muted-foreground text-sm">Monitoring aktivitas transaksi kas dan pembayaran per pengguna</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3" action="/laporan/transaksi-per-user">
            <Input type="number" name="month" min={1} max={12} defaultValue={String(report.month)} placeholder="Bulan" />
            <Input type="number" name="year" min={2020} max={2100} defaultValue={String(report.year)} placeholder="Tahun" />
            <select name="userId" defaultValue={sp?.userId ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Semua user</option>
              {report.filterOptions.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <Button type="submit">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Kas Masuk</p><p className="font-bold text-emerald-600">{fmt(report.summary.kasMasuk)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Kas Keluar</p><p className="font-bold text-red-600">{fmt(report.summary.kasKeluar)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Nominal Pembayaran</p><p className="font-bold text-blue-600">{fmt(report.summary.totalPembayaran)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Trx Kas</p><p className="font-bold">{report.summary.totalKasTransaksi.toLocaleString("id-ID")}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Trx Pembayaran</p><p className="font-bold">{report.summary.jumlahPembayaran.toLocaleString("id-ID")}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Kas Masuk</TableHead>
                <TableHead className="text-right">Kas Keluar</TableHead>
                <TableHead className="text-right">Pembayaran</TableHead>
                <TableHead className="text-right">Jml Trx Kas</TableHead>
                <TableHead className="text-right">Jml Trx Bayar</TableHead>
                <TableHead className="text-right">Total Aktivitas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">Belum ada data transaksi user pada periode ini.</TableCell>
                </TableRow>
              ) : report.data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                  </TableCell>
                  <TableCell className="space-x-1">{r.roles.map((role) => <Badge key={role} variant="outline">{role}</Badge>)}</TableCell>
                  <TableCell className="text-right text-emerald-600">{fmt(r.kasMasuk)}</TableCell>
                  <TableCell className="text-right text-red-600">{fmt(r.kasKeluar)}</TableCell>
                  <TableCell className="text-right text-blue-600">{fmt(r.totalPembayaran)}</TableCell>
                  <TableCell className="text-right">{r.totalKasTransaksi.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right">{r.jumlahPembayaran.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right font-semibold">{fmt(r.totalNominalAktivitas)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
