import Link from "next/link"
import { Plus, Search, Download, MoreHorizontal, Eye, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getNasabahList } from "@/actions/nasabah"
import { Input } from "@/components/ui/input"

const statusBadge: Record<string, { label: string; cls: string }> = {
  AKTIF: { label: "Aktif", cls: "bg-emerald-100 text-emerald-700" },
  NON_AKTIF: { label: "Non Aktif", cls: "bg-gray-100 text-gray-600" },
  KELUAR: { label: "Keluar", cls: "bg-red-100 text-red-700" },
}

export default async function NasabahPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; page?: string }>
}) {
  const sp = await searchParams
  const search = sp?.search ?? ""
  const page = Number(sp?.page ?? 1)

  const { data: nasabahList, total, totalPages } = await getNasabahList({
    page,
    search,
    limit: 20,
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Master Nasabah</h1>
          <p className="text-muted-foreground text-sm">
            {total.toLocaleString("id-ID")} total nasabah terdaftar
          </p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/nasabah/baru">
            <Plus className="size-4" /> Tambah Nasabah
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <form method="GET" className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                name="search"
                defaultValue={search}
                placeholder="Cari nama, NIK, atau nomor anggota..."
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">Cari</Button>
            <Button variant="outline" size="sm" className="gap-1" type="button">
              <Download className="size-3.5" /> Export
            </Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[110px]">No. Anggota</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead className="hidden md:table-cell">NIK</TableHead>
                <TableHead className="hidden lg:table-cell">Kelompok</TableHead>
                <TableHead className="hidden lg:table-cell">Kolektor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Tgl. Gabung</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {nasabahList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    {search ? `Tidak ada nasabah dengan kata kunci "${search}"` : "Belum ada data nasabah. Tambah nasabah pertama."}
                  </TableCell>
                </TableRow>
              ) : (
                nasabahList.map((row) => {
                  const badge = statusBadge[row.status] ?? statusBadge.NON_AKTIF
                  return (
                    <TableRow key={row.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-medium">{row.nomorAnggota}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{row.namaLengkap}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{row.nik}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">{row.nik}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{row.kelompok?.nama ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{row.kolektor?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge className={`${badge.cls} hover:${badge.cls} border-0 text-xs`}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {new Date(row.tanggalGabung).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/nasabah/${row.id}`} className="flex items-center gap-2">
                                <Eye className="size-3.5" /> Detail
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/nasabah/${row.id}/edit`} className="flex items-center gap-2">
                                <Edit className="size-3.5" /> Edit
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          <div className="px-4 py-3 flex items-center justify-between border-t text-sm text-muted-foreground">
            <span>
              {nasabahList.length > 0
                ? `Halaman ${page} dari ${totalPages} · ${total} nasabah`
                : "0 nasabah ditemukan"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild disabled={page <= 1}>
                <Link href={`?search=${search}&page=${page - 1}`}>Sebelumnya</Link>
              </Button>
              <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
                <Link href={`?search=${search}&page=${page + 1}`}>Berikutnya</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
