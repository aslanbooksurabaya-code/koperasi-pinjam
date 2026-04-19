import { getTunggakanList } from "@/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function agingLabel(hari: number) {
  if (hari <= 7) return { label: `1-7 hari (${hari}h)`, cls: "bg-yellow-100 text-yellow-800" }
  if (hari <= 30) return { label: `8-30 hari (${hari}h)`, cls: "bg-orange-100 text-orange-800" }
  if (hari <= 60) return { label: `31-60 hari (${hari}h)`, cls: "bg-red-100 text-red-700" }
  return { label: `>60 hari — NPL (${hari}h)`, cls: "bg-red-700 text-white" }
}

export default async function TunggakanPage() {
  const tunggakan = await getTunggakanList()

  // Rekap per aging bucket
  const buckets = [
    { label: "1-7 hari", count: 0, total: 0 },
    { label: "8-30 hari", count: 0, total: 0 },
    { label: "31-60 hari", count: 0, total: 0 },
    { label: ">60 hari (NPL)", count: 0, total: 0 },
  ]
  for (const t of tunggakan) {
    const h = t.hariTelat
    const val = Number(t.total)
    if (h <= 7) { buckets[0].count++; buckets[0].total += val }
    else if (h <= 30) { buckets[1].count++; buckets[1].total += val }
    else if (h <= 60) { buckets[2].count++; buckets[2].total += val }
    else { buckets[3].count++; buckets[3].total += val }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Tunggakan (Aging Report)</h1>
        <p className="text-muted-foreground text-sm">{tunggakan.length} angsuran menunggak</p>
      </div>

      {/* Aging buckets */}
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
                <TableHead className="hidden md:table-cell">Kontrak</TableHead>
                <TableHead className="text-center">Angsuran ke-</TableHead>
                <TableHead>Aging</TableHead>
                <TableHead>Total Tunggakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tunggakan.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    🎉 Tidak ada tunggakan!
                  </TableCell>
                </TableRow>
              ) : (
                tunggakan.map((t: typeof tunggakan[number]) => {
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
