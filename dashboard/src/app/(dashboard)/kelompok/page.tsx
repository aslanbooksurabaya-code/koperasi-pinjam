import { getKelompokOverview } from "@/actions/dashboard"
import { Search, Users, Plus, LayoutGrid, MapPin, UserCheck } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Master Kelompok</h1>
          <p className="text-muted-foreground text-sm">Pengelolaan data kelompok nasabah dan wilayah binaan.</p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200/50 dark:shadow-none transition-all active:scale-95">
          <Link href="/kelompok/baru"><Plus className="size-4" /> Tambah Kelompok</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Total Kelompok", value: summary.totalKelompok.toLocaleString("id-ID"), icon: LayoutGrid, color: "text-blue-600", bg: "bg-blue-50/80" },
          { label: "Total Anggota", value: summary.totalAnggota.toLocaleString("id-ID"), icon: Users, color: "text-emerald-600", bg: "bg-emerald-50/80" },
          { label: "Pinjaman Aktif", value: summary.totalPinjamanAktif.toLocaleString("id-ID"), icon: UserCheck, color: "text-violet-600", bg: "bg-violet-50/80" },
          { label: "Rata-rata/Kelompok", value: `${summary.avgAnggotaPerKelompok}`, icon: MapPin, color: "text-amber-600", bg: "bg-amber-50/80" },
        ].map((s) => (
          <Card key={s.label} className="border-none shadow-sm overflow-hidden transition-all hover:scale-[1.02]">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${s.bg} ${s.color} shadow-sm border border-current/5`}>
                <s.icon className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
          <div className="mb-4">
            <CardTitle className="text-base font-semibold">Daftar Kelompok</CardTitle>
            <CardDescription>Pantau sebaran nasabah berdasarkan kelompok dan wilayah</CardDescription>
          </div>
          <form className="relative max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input name="search" defaultValue={search} placeholder="Cari nama/kode/wilayah kelompok..." className="pl-9 transition-all" />
          </form>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Kode</TableHead>
                <TableHead>Nama Kelompok</TableHead>
                <TableHead className="hidden md:table-cell">Wilayah</TableHead>
                <TableHead className="hidden md:table-cell">Kolektor</TableHead>
                <TableHead className="text-center">Anggota</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Outstanding</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Tunggakan</TableHead>
                <TableHead className="w-[100px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-24 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                       <LayoutGrid className="size-8 opacity-20" />
                       <p>Tidak ada data kelompok.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">{row.kode}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 dark:bg-emerald-950/20 dark:border-emerald-900/50">
                          <Users className="size-3.5 text-emerald-600" />
                        </div>
                        <span className="font-bold tracking-tight text-slate-900 dark:text-slate-200">{row.nama}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs font-medium text-slate-500">{row.wilayah}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{row.kolektor}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0 h-5 px-2 text-[10px] font-bold rounded-md">{row.anggota} anggota</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right">
                       <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-200">{fmt(row.outstanding)}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right">
                      <span className={`text-sm font-bold tracking-tight ${row.tunggakan > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {fmt(row.tunggakan)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="xs" variant="outline" className="h-7 px-3 rounded-lg border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-widest" asChild>
                        <Link href={`/kelompok/${row.id}/edit`}>Edit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-50 bg-slate-50/30 dark:border-slate-800/50 dark:bg-slate-900/10 text-xs font-medium text-slate-500 tracking-tight">
            <span>Total {data.length} kelompok terdaftar</span>
            <Badge variant="outline" className="h-5 px-2 rounded-md font-bold text-[9px] uppercase tracking-widest border-slate-200 dark:border-slate-800">Real-time Data</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
