import { getKelompokOverview } from "@/actions/dashboard"
import { Search, Users } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default async function KelompokPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string }>
}) {
  const sp = await searchParams
  const search = sp?.search?.trim() ?? ""
  const { data, summary } = await getKelompokOverview(search)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Master Kelompok</h1>
          <p className="text-muted-foreground text-sm">Data kelompok nasabah dari database</p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/kelompok/baru">+ Tambah Kelompok</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Kelompok", value: summary.totalKelompok.toLocaleString("id-ID"), color: "text-blue-600" },
          { label: "Total Anggota", value: summary.totalAnggota.toLocaleString("id-ID"), color: "text-emerald-600" },
          { label: "Pinjaman Aktif", value: summary.totalPinjamanAktif.toLocaleString("id-ID"), color: "text-violet-600" },
          { label: "Rata-rata/Kelompok", value: `${summary.avgAnggotaPerKelompok} anggota`, color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <form className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input name="search" defaultValue={search} placeholder="Cari nama/kode/wilayah kelompok..." className="pl-9" />
          </form>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Kode</TableHead>
                <TableHead>Nama Kelompok</TableHead>
                <TableHead className="hidden md:table-cell">Wilayah</TableHead>
                <TableHead className="hidden md:table-cell">Kolektor</TableHead>
                <TableHead className="text-center">Anggota</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Outstanding</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Tunggakan</TableHead>
                <TableHead className="w-[120px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    Tidak ada data kelompok.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">{row.kode}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Users className="size-4 text-emerald-600" />
                        </div>
                        <span className="font-medium">{row.nama}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{row.wilayah}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{row.kolektor}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{row.anggota} anggota</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right text-sm">{fmt(row.outstanding)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-right">
                      <span className={`text-sm font-medium ${row.tunggakan > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {fmt(row.tunggakan)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/kelompok/${row.id}/edit`}>Edit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="px-4 py-3 flex items-center justify-between border-t text-sm text-muted-foreground">
            <span>Menampilkan {data.length} kelompok</span>
            <Button variant="outline" size="sm" disabled>
              Data real-time
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
