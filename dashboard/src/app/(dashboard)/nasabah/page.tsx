import Link from "next/link"
import { Plus, Search, Download, Eye, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getKelompokList, getNasabahList } from "@/actions/nasabah"
import { Input } from "@/components/ui/input"

const statusBadge: Record<string, { label: string; cls: string }> = {
  AKTIF: { label: "Aktif", cls: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  NON_AKTIF: { label: "Non Aktif", cls: "bg-slate-100/80 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400" },
  KELUAR: { label: "Keluar", cls: "bg-rose-100/80 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
}

const rankBadge: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  B: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  C: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  D: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
}

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default async function NasabahPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; page?: string; kelompokId?: string; status?: string }>
}) {
  const sp = await searchParams
  const search = sp?.search ?? ""
  const page = Number(sp?.page ?? 1)
  const kelompokId = sp?.kelompokId ?? ""
  const status = sp?.status ?? ""

  const kelompokList = await getKelompokList()
  const { data: nasabahList, total, totalPages } = await getNasabahList({
    page,
    search,
    limit: 20,
    kelompokId: kelompokId || undefined,
    status: status || undefined,
  })

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Master Nasabah</h1>
          <p className="text-muted-foreground text-sm">
            {total.toLocaleString("id-ID")} total nasabah terdaftar dalam sistem.
          </p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200/50 dark:shadow-none transition-all active:scale-95">
          <Link href="/nasabah/baru">
            <Plus className="size-4" /> Tambah Nasabah
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <CardTitle className="text-base font-semibold">Daftar Nasabah</CardTitle>
              <CardDescription>Kelola data anggota koperasi secara terpusat</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2 border-slate-200/80 dark:border-slate-800/80">
              <Download className="size-3.5" /> 
              <span className="hidden sm:inline">Export Data</span>
            </Button>
          </div>
          <form method="GET" className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                name="search"
                defaultValue={search}
                placeholder="Cari nama, NIK, atau nomor anggota..."
                className="pl-9 bg-slate-50 border-slate-100 focus-visible:bg-white transition-all dark:bg-slate-900 dark:border-slate-800"
              />
            </div>
            <select
              name="kelompokId"
              defaultValue={kelompokId}
              className="h-9 rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900"
              title="Filter kelompok"
            >
              <option value="">Semua kelompok</option>
              {kelompokList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={status}
              className="h-9 rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900"
              title="Filter status"
            >
              <option value="">Semua status</option>
              <option value="AKTIF">Aktif</option>
              <option value="NON_AKTIF">Non Aktif</option>
              <option value="KELUAR">Keluar</option>
            </select>
            <Button type="submit" variant="secondary" className="px-6">Cari</Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[110px]">No. Anggota</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead className="hidden md:table-cell">NIK</TableHead>
                <TableHead className="hidden lg:table-cell">Kelompok</TableHead>
                <TableHead className="hidden lg:table-cell">Kolektor</TableHead>
                <TableHead className="hidden xl:table-cell">Indikator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Tgl. Gabung</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {nasabahList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-24 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="size-8 opacity-20" />
                      <p>{search ? `Tidak ada nasabah dengan kata kunci "${search}"` : "Belum ada data nasabah. Tambah nasabah pertama."}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                nasabahList.map((row) => {
                  const badge = statusBadge[row.status] ?? statusBadge.NON_AKTIF
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-500">{row.nomorAnggota}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold tracking-tight">{row.namaLengkap}</span>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge
                              className={`${rankBadge[row.indikator.ranking] ?? "bg-slate-100 text-slate-600"} hover:${rankBadge[row.indikator.ranking] ?? "bg-slate-100 text-slate-600"} border-0 text-[10px] font-black h-5 uppercase tracking-wider`}
                              title="Ranking risiko"
                            >
                              Rank {row.indikator.ranking}
                            </Badge>
                            {row.indikator.overdueCount > 0 && row.indikator.overdueOldestDueAt ? (
                              <Badge
                                className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-100 border-0 text-[10px] font-black h-5 uppercase tracking-wider"
                                title="Angsuran jatuh tempo belum lunas"
                              >
                                Telat {row.indikator.overdueCount} (
                                {new Date(row.indikator.overdueOldestDueAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                ) {row.indikator.overdueOldestDaysLate} hari
                              </Badge>
                            ) : null}
                            {row.indikator.tunggakanNominal > 0 ? (
                              <Badge
                                className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-100 border-0 text-[10px] font-bold h-5 uppercase tracking-wider"
                                title="Tunggakan angsuran"
                              >
                                Tunggakan {fmt(Number(row.indikator.tunggakanNominal))}
                              </Badge>
                            ) : (
                              <Badge
                                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 border-0 text-[10px] font-bold h-5 uppercase tracking-wider"
                                title="Tidak ada tunggakan angsuran"
                              >
                                Lancar
                              </Badge>
                            )}
                            {row.indikator.aktifPinjaman > 0 ? (
                              <Badge
                                className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 border-0 text-[10px] font-bold h-5 uppercase tracking-wider"
                                title="Jumlah pinjaman aktif"
                              >
                                Aktif {row.indikator.aktifPinjaman}
                              </Badge>
                            ) : null}
                          </div>
                          <span className="text-[10px] text-muted-foreground md:hidden">{row.nik}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-[11px] text-slate-500 tracking-tight">{row.nik}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{row.kelompok?.nama ?? "—"}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                         <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{row.kolektor?.name ?? "—"}</span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Outstanding</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-200">
                              {fmt(Number(row.indikator.outstanding))}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Telat</span>
                            <span className={row.indikator.telat > 0 ? "font-bold text-rose-600" : "font-semibold"}>
                              {row.indikator.telat}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Next Due</span>
                            <span className="font-medium">
                              {row.indikator.nextDueAt
                                ? new Date(row.indikator.nextDueAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${badge.cls} hover:${badge.cls} border-0 text-[10px] font-bold px-2 py-0 h-5 uppercase tracking-wide`}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-[11px] font-medium text-slate-500">
                        {new Date(row.tanggalGabung).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                            asChild
                            title="Detail"
                          >
                            <Link href={`/nasabah/${row.id}`}>
                              <Eye className="size-4" />
                              <span className="sr-only">Detail</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                            asChild
                            title="Edit"
                          >
                            <Link href={`/nasabah/${row.id}/edit`}>
                              <Pencil className="size-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-50 bg-slate-50/30 dark:border-slate-800/50 dark:bg-slate-900/10 text-xs font-medium text-slate-500 tracking-tight">
            <span>
              {nasabahList.length > 0
                ? `Menampilkan ${nasabahList.length} dari ${total} nasabah · Halaman ${page} / ${totalPages}`
                : "0 nasabah ditemukan"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="xs" asChild disabled={page <= 1} className="h-8 px-3 rounded-lg border-slate-200 dark:border-slate-800">
                <Link href={`?search=${search}&page=${page - 1}`}>Sebelumnya</Link>
              </Button>
              <Button variant="outline" size="xs" asChild disabled={page >= totalPages} className="h-8 px-3 rounded-lg border-slate-200 dark:border-slate-800">
                <Link href={`?search=${search}&page=${page + 1}`}>Berikutnya</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
