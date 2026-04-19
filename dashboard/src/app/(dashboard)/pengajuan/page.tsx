import Link from "next/link"
import { getPengajuanList } from "@/actions/pengajuan"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Plus, Eye, Search, CheckCircle } from "lucide-react"

const statusMap: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
  DIAJUKAN: { label: "Diajukan", cls: "bg-blue-100 text-blue-700" },
  DISURVEY: { label: "Disurvey", cls: "bg-violet-100 text-violet-700" },
  DISETUJUI: { label: "Disetujui", cls: "bg-emerald-100 text-emerald-700" },
  DITOLAK: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
  DICAIRKAN: { label: "Dicairkan", cls: "bg-teal-100 text-teal-700" },
  SELESAI: { label: "Selesai", cls: "bg-gray-100 text-gray-600" },
}

function fmt(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}Jt`
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default async function PengajuanListPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; status?: string; page?: string }>
}) {
  const sp = await searchParams
  const search = sp?.search ?? ""
  const status = sp?.status ?? ""
  const page = Number(sp?.page ?? 1)

  const { data, total, totalPages } = await getPengajuanList({ search, status, page })

  const STATUS_OPTIONS = ["DIAJUKAN", "DISURVEY", "DISETUJUI", "DITOLAK", "DICAIRKAN"]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengajuan Pinjaman</h1>
          <p className="text-muted-foreground text-sm">{total} total pengajuan</p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/pengajuan/baru"><Plus className="size-4" /> Ajukan Baru</Link>
        </Button>
      </div>

      {/* Filter status */}
      <div className="flex gap-2 flex-wrap">
        <Button asChild variant={!status ? "default" : "outline"} size="sm">
          <Link href="?status=">Semua</Link>
        </Button>
        {STATUS_OPTIONS.map((s) => {
          const m = statusMap[s] ?? { label: s, cls: "" }
          return (
            <Button key={s} asChild variant={status === s ? "default" : "outline"} size="sm">
              <Link href={`?status=${s}`}>{m.label}</Link>
            </Button>
          )
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <form method="GET" className="flex gap-3">
            <input type="hidden" name="status" value={status} />
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input name="search" defaultValue={search} placeholder="Cari nama nasabah..." className="pl-9" />
            </div>
            <Button type="submit" variant="outline" size="sm">Cari</Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Nasabah</TableHead>
                <TableHead className="hidden md:table-cell">Kelompok</TableHead>
                <TableHead>Plafon</TableHead>
                <TableHead className="hidden md:table-cell">Tenor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Tgl. Pengajuan</TableHead>
                <TableHead className="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Tidak ada pengajuan ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => {
                  const badge = statusMap[row.status] ?? { label: row.status, cls: "" }
                  return (
                    <TableRow key={row.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <p className="font-medium">{row.nasabah.namaLengkap}</p>
                          <p className="text-xs text-muted-foreground font-mono">{row.nasabah.nomorAnggota}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{row.kelompok?.nama ?? "—"}</TableCell>
                      <TableCell className="font-semibold">{fmt(Number(row.plafonDiajukan))}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{row.tenor} bulan</TableCell>
                      <TableCell>
                        <Badge className={`${badge.cls} border-0 text-xs`}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {new Date(row.tanggalPengajuan).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/pengajuan/${row.id}`}><Eye className="size-3.5" /></Link>
                          </Button>
                          {row.status === "DISETUJUI" && (
                            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 h-7 text-xs" asChild>
                              <Link href={`/pencairan?id=${row.id}`}>
                                <CheckCircle className="size-3" /> Cair
                              </Link>
                            </Button>
                          )}
                          {row.status === "DIAJUKAN" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                              <Link href={`/pengajuan/${row.id}/approve`}>Setujui</Link>
                            </Button>
                          )}
                          {row.status === "DICAIRKAN" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                              <Link href={`/dokumen/pencairan/${row.id}`}>Cetak Bukti</Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          <div className="px-4 py-3 flex items-center justify-between border-t text-sm text-muted-foreground">
            <span>{total > 0 ? `Halaman ${page} dari ${totalPages}` : "0 pengajuan"}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild disabled={page <= 1}>
                <Link href={`?status=${status}&search=${search}&page=${page - 1}`}>Sebelumnya</Link>
              </Button>
              <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
                <Link href={`?status=${status}&search=${search}&page=${page + 1}`}>Berikutnya</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
