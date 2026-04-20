import Link from "next/link"
import { getPengajuanList } from "@/actions/pengajuan"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Plus, Eye, Search, CheckCircle, FileText } from "lucide-react"

const statusMap: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  DIAJUKAN: { label: "Diajukan", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  DISURVEY: { label: "Disurvey", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  DISETUJUI: { label: "Disetujui", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  DITOLAK: { label: "Ditolak", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  DICAIRKAN: { label: "Dicairkan", cls: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  SELESAI: { label: "Selesai", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
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
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Pengajuan Pinjaman</h1>
          <p className="text-muted-foreground text-sm">{total} total pengajuan pinjaman nasabah.</p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200/50 dark:shadow-none transition-all active:scale-95">
          <Link href="/pengajuan/baru"><Plus className="size-4" /> Ajukan Baru</Link>
        </Button>
      </div>

      {/* Filter status */}
      <div className="flex gap-2 flex-wrap bg-white p-1.5 rounded-xl border border-slate-100 w-fit dark:bg-slate-950 dark:border-slate-800">
        <Button asChild variant={!status ? "secondary" : "ghost"} size="sm" className="rounded-lg h-8 text-[11px] font-bold uppercase tracking-wider">
          <Link href="?status=">Semua</Link>
        </Button>
        {STATUS_OPTIONS.map((s) => {
          const m = statusMap[s] ?? { label: s, cls: "" }
          return (
            <Button key={s} asChild variant={status === s ? "secondary" : "ghost"} size="sm" className="rounded-lg h-8 text-[11px] font-bold uppercase tracking-wider">
              <Link href={`?status=${s}`}>{m.label}</Link>
            </Button>
          )
        })}
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
          <div className="mb-4">
            <CardTitle className="text-base font-semibold">Daftar Pengajuan</CardTitle>
            <CardDescription>Pantau dan proses pengajuan pinjaman dari nasabah</CardDescription>
          </div>
          <form method="GET" className="flex gap-3">
            <input type="hidden" name="status" value={status} />
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                name="search" 
                defaultValue={search} 
                placeholder="Cari nama nasabah..." 
                className="pl-9 bg-slate-50 border-slate-100 focus-visible:bg-white transition-all dark:bg-slate-900 dark:border-slate-800" 
              />
            </div>
            <Button type="submit" variant="secondary" className="px-6">Cari</Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
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
                  <TableCell colSpan={7} className="text-center py-24 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="size-8 opacity-20" />
                      <p>Tidak ada pengajuan ditemukan.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => {
                  const badge = statusMap[row.status] ?? { label: row.status, cls: "" }
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold tracking-tight">{row.nasabah.namaLengkap}</span>
                          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{row.nasabah.nomorAnggota}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{row.kelompok?.nama ?? "—"}</span>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-200">{fmt(Number(row.plafonDiajukan))}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm font-medium text-slate-500">{row.tenor} bulan</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${badge.cls} border-0 text-[10px] font-bold px-2 py-0 h-5 uppercase tracking-wide`}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-[11px] font-medium text-slate-500">
                        {new Date(row.tanggalPengajuan).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" asChild title="Detail">
                            <Link href={`/pengajuan/${row.id}`}><Eye className="size-3.5 text-slate-500" /></Link>
                          </Button>
                          {row.status === "DISETUJUI" && (
                            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white" asChild>
                              <Link href={`/pencairan?id=${row.id}`}>
                                <CheckCircle className="size-3 mr-1.5" /> Cair
                              </Link>
                            </Button>
                          )}
                          {row.status === "DIAJUKAN" && (
                            <Button size="sm" variant="outline" className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider border-slate-200 dark:border-slate-800" asChild>
                              <Link href={`/pengajuan/${row.id}/approve`}>Setujui</Link>
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
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-50 bg-slate-50/30 dark:border-slate-800/50 dark:bg-slate-900/10 text-xs font-medium text-slate-500 tracking-tight">
            <span>{total > 0 ? `Menampilkan ${data.length} dari ${total} pengajuan · Halaman ${page} / ${totalPages}` : "0 pengajuan"}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="xs" asChild disabled={page <= 1} className="h-8 px-3 rounded-lg border-slate-200 dark:border-slate-800">
                <Link href={`?status=${status}&search=${search}&page=${page - 1}`}>Sebelumnya</Link>
              </Button>
              <Button variant="outline" size="xs" asChild disabled={page >= totalPages} className="h-8 px-3 rounded-lg border-slate-200 dark:border-slate-800">
                <Link href={`?status=${status}&search=${search}&page=${page + 1}`}>Berikutnya</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
