import { getTunggakanFilterOptions, getTunggakanList } from "@/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function agingLabel(hari: number) {
  if (hari <= 7) return { label: `1-7 hari (${hari}h)`, cls: "bg-yellow-100 text-yellow-800" }
  if (hari <= 30) return { label: `8-30 hari (${hari}h)`, cls: "bg-orange-100 text-orange-800" }
  if (hari <= 60) return { label: `31-60 hari (${hari}h)`, cls: "bg-red-100 text-red-700" }
  return { label: `>60 hari — NPL (${hari}h)`, cls: "bg-red-700 text-white" }
}

export default async function TunggakanPage({
  searchParams,
}: {
  searchParams?: Promise<{
    tanggalDari?: string
    tanggalSampai?: string
    kolektorId?: string
    kelompokId?: string
    wilayah?: string
  }>
}) {
  const sp = await searchParams
  const params = {
    tanggalDari: sp?.tanggalDari,
    tanggalSampai: sp?.tanggalSampai,
    kolektorId: sp?.kolektorId,
    kelompokId: sp?.kelompokId,
    wilayah: sp?.wilayah,
  }

  const [filterOptions, result] = await Promise.all([getTunggakanFilterOptions(), getTunggakanList(params)])
  const tunggakan = result.data

  const buckets = [
    { label: "1-7 hari", count: result.summary.buckets["1-7"].count, total: result.summary.buckets["1-7"].total },
    { label: "8-30 hari", count: result.summary.buckets["8-30"].count, total: result.summary.buckets["8-30"].total },
    { label: "31-60 hari", count: result.summary.buckets["31-60"].count, total: result.summary.buckets["31-60"].total },
    { label: ">60 hari (NPL)", count: result.summary.buckets[">60"].count, total: result.summary.buckets[">60"].total },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Tunggakan (Aging Report)</h1>
        <p className="text-muted-foreground text-sm">{result.summary.totalKasus} angsuran menunggak</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filter Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-6 gap-3" action="/monitoring/tunggakan">
            <Input type="date" name="tanggalDari" defaultValue={params.tanggalDari} />
            <Input type="date" name="tanggalSampai" defaultValue={params.tanggalSampai} />
            <select name="kolektorId" defaultValue={params.kolektorId ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Semua kolektor</option>
              {filterOptions.kolektor.map((k) => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
            <select name="kelompokId" defaultValue={params.kelompokId ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Semua kelompok</option>
              {filterOptions.kelompok.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <select name="wilayah" defaultValue={params.wilayah ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Semua wilayah</option>
              {filterOptions.wilayah.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
            <Button type="submit">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {buckets.map((b, i) => {
          const colors = ["text-yellow-700", "text-orange-600", "text-red-600", "text-red-800"]
          const bgs = ["bg-yellow-50 border-yellow-200", "bg-orange-50 border-orange-200", "bg-red-50 border-red-200", "bg-red-100 border-red-300"]
          return (
            <Card key={b.label} className={bgs[i]}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{b.label}</p>
                <p className={`text-xl font-bold mt-0.5 ${colors[i]}`}>{b.count} kasus</p>
                <p className={`text-xs ${colors[i]}`}>{fmt(b.total)}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Tunggakan</p>
            <p className="text-lg font-bold text-red-600">{fmt(result.summary.totalTunggakan)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Outstanding NPL (&gt;60h)</p>
            <p className="text-lg font-bold text-red-700">{fmt(result.summary.nplOutstanding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Rasio NPL</p>
            <p className="text-lg font-bold">{result.summary.nplRatio.toFixed(2)}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Detail Tunggakan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Nasabah</TableHead>
                <TableHead className="hidden md:table-cell">Kelompok</TableHead>
                <TableHead className="hidden md:table-cell">Wilayah</TableHead>
                <TableHead className="hidden md:table-cell">Kontrak</TableHead>
                <TableHead className="text-center">Angsuran ke-</TableHead>
                <TableHead>Aging</TableHead>
                <TableHead>Total Tunggakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tunggakan.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Tidak ada data tunggakan pada filter ini.
                  </TableCell>
                </TableRow>
              ) : (
                tunggakan.map((t) => {
                  const ag = agingLabel(t.hariTelat)
                  const nasabah = t.pinjaman.pengajuan.nasabah
                  return (
                    <TableRow key={t.id} className={`hover:bg-muted/30 ${t.hariTelat > 60 ? "bg-red-50/40" : ""}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{nasabah.namaLengkap}</p>
                          <p className="text-xs text-muted-foreground">{nasabah.noHp}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{t.pinjaman.pengajuan.kelompok?.nama ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{t.pinjaman.pengajuan.kelompok?.wilayah ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">{t.pinjaman.nomorKontrak}</TableCell>
                      <TableCell className="text-center font-bold">{t.angsuranKe}</TableCell>
                      <TableCell>
                        <Badge className={`${ag.cls} border-0 text-xs`}>{ag.label}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-red-600">{fmt(Number(t.total))}</TableCell>
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
