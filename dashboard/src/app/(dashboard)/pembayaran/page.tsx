import { getAngsuranJatuhTempo } from "@/actions/pembayaran"
import { hitungDenda } from "@/lib/pembayaran"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BayarButton } from "./bayar-button"
import { differenceInDays } from "date-fns"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function agingBadge(hari: number) {
  if (hari <= 0) return <Badge className="bg-blue-100 text-blue-700">Jatuh Tempo</Badge>
  if (hari <= 7) return <Badge className="bg-yellow-100 text-yellow-700">{hari}h telat</Badge>
  if (hari <= 30) return <Badge className="bg-orange-100 text-orange-700">{hari}h telat</Badge>
  if (hari <= 60) return <Badge className="bg-red-100 text-red-700">{hari}h telat</Badge>
  return <Badge className="bg-red-700 text-white">{hari}h (NPL)</Badge>
}

export default async function PembayaranPage() {
  const today = new Date()
  const jadwals = await getAngsuranJatuhTempo()

  const totalTagihan = jadwals.reduce((a, j) => a + Number(j.total), 0)
  const totalDenda = jadwals.reduce((a, j) => {
    const hariTelat = differenceInDays(today, j.tanggalJatuhTempo)
    if (hariTelat <= 0) return a
    return a + hitungDenda(Number(j.pinjaman.sisaPinjaman), j.tanggalJatuhTempo, today)
  }, 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pembayaran Angsuran</h1>
        <p className="text-muted-foreground text-sm">Angsuran jatuh tempo yang belum dibayar</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tagihan", value: fmt(totalTagihan), color: "text-blue-600" },
          { label: "Est. Total Denda", value: fmt(totalDenda), color: "text-red-600" },
          { label: "Jumlah Nasabah", value: `${jadwals.length} angsuran`, color: "text-violet-600" },
          { label: "Total Tertagih", value: fmt(totalTagihan + totalDenda), color: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daftar Angsuran Jatuh Tempo</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Nasabah</TableHead>
                <TableHead className="hidden md:table-cell">No. Kontrak</TableHead>
                <TableHead className="text-center">Angsuran ke-</TableHead>
                <TableHead>Total Tagihan</TableHead>
                <TableHead className="hidden lg:table-cell text-red-500">Denda</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jadwals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    🎉 Tidak ada angsuran yang jatuh tempo. Semua pembayaran lancar!
                  </TableCell>
                </TableRow>
              ) : (
                jadwals.map((j) => {
                  const hariTelat = differenceInDays(today, j.tanggalJatuhTempo)
                  const denda = hariTelat > 0
                    ? hitungDenda(Number(j.pinjaman.sisaPinjaman), j.tanggalJatuhTempo, today)
                    : 0
                  const nasabah = j.pinjaman.pengajuan.nasabah

                  return (
                    <TableRow key={j.id} className={`hover:bg-muted/30 ${hariTelat > 30 ? "bg-red-50/40" : hariTelat > 0 ? "bg-amber-50/30" : ""}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{nasabah.namaLengkap}</p>
                          <p className="text-xs text-muted-foreground">{j.pinjaman.pengajuan.kelompok?.nama ?? "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">{j.pinjaman.nomorKontrak}</TableCell>
                      <TableCell className="text-center font-bold">{j.angsuranKe}</TableCell>
                      <TableCell className="font-semibold">{fmt(Number(j.total))}</TableCell>
                      <TableCell className="hidden lg:table-cell text-red-500 font-medium">
                        {denda > 0 ? fmt(denda) : "—"}
                      </TableCell>
                      <TableCell>{agingBadge(hariTelat)}</TableCell>
                      <TableCell>
                        <BayarButton jadwalId={j.id} total={Number(j.total) + denda} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
