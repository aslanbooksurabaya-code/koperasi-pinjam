import { notFound } from "next/navigation"
import Link from "next/link"
import { getNasabahById } from "@/actions/nasabah"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Phone, MapPin, Briefcase, CreditCard } from "lucide-react"

const statusPinjaman: Record<string, string> = {
  AKTIF: "bg-blue-100 text-blue-700",
  MENUNGGAK: "bg-orange-100 text-orange-700",
  MACET: "bg-red-100 text-red-700",
  LUNAS: "bg-emerald-100 text-emerald-700",
}

const statusPengajuan: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  DIAJUKAN: "bg-blue-100 text-blue-700",
  DISURVEY: "bg-violet-100 text-violet-700",
  DISETUJUI: "bg-emerald-100 text-emerald-700",
  DITOLAK: "bg-red-100 text-red-700",
  DICAIRKAN: "bg-teal-100 text-teal-700",
  SELESAI: "bg-gray-100 text-gray-600",
}

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default async function NasabahDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const nasabah = await getNasabahById(id)
  if (!nasabah) notFound()

  const infoItems = [
    { icon: Phone, label: "No. HP", value: nasabah.noHp },
    { icon: MapPin, label: "Alamat", value: `${nasabah.alamat}${nasabah.kecamatan ? `, Kec. ${nasabah.kecamatan}` : ""}${nasabah.kotaKab ? `, ${nasabah.kotaKab}` : ""}` },
    { icon: Briefcase, label: "Pekerjaan", value: nasabah.pekerjaan ?? "—" },
    { icon: CreditCard, label: "NIK", value: nasabah.nik },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/nasabah"><ArrowLeft className="size-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{nasabah.namaLengkap}</h1>
            <p className="text-muted-foreground text-sm font-mono">{nasabah.nomorAnggota}</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/nasabah/${id}/edit`}>
            <Edit className="size-4" /> Edit
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Info Utama */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Informasi Nasabah</CardTitle>
              <Badge className={nasabah.status === "AKTIF" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}>
                {nasabah.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {infoItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm">{value}</p>
                </div>
              </div>
            ))}
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Kelompok</p>
                <p>{nasabah.kelompok?.nama ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kolektor</p>
                <p>{nasabah.kolektor?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tgl. Gabung</p>
                <p>{new Date(nasabah.tanggalGabung).toLocaleDateString("id-ID")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Penjamin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Penjamin</CardTitle>
          </CardHeader>
          <CardContent>
            {nasabah.penjamin.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data penjamin.</p>
            ) : (
              nasabah.penjamin.map((p) => (
                <div key={p.id} className="text-sm space-y-0.5">
                  <p className="font-medium">{p.namaLengkap}</p>
                  <p className="text-xs text-muted-foreground">{p.hubungan} · {p.noHp}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Riwayat Pengajuan */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Riwayat Pengajuan Pinjaman</CardTitle>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Link href={`/pengajuan/baru?nasabahId=${nasabah.id}`}>+ Pengajuan Baru</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {nasabah.pengajuan.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">Belum ada pengajuan pinjaman.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium">Sisa Pinjaman</th>
                  <th className="text-left px-4 py-2.5 hidden md:table-cell font-medium">No. Kontrak</th>
                  <th className="text-left px-4 py-2.5 font-medium">Tanggal</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {nasabah.pengajuan.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <Badge className={`${statusPengajuan[p.status]} border-0`}>{p.status}</Badge>
                      {p.pinjaman && (
                        <Badge className={`${statusPinjaman[p.pinjaman.status]} border-0 ml-1`}>{p.pinjaman.status}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      {p.pinjaman ? fmt(Number(p.pinjaman.sisaPinjaman)) : fmt(Number(p.plafonDiajukan))}
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell font-mono text-xs text-muted-foreground">
                      {p.pinjaman?.nomorKontrak ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {new Date(p.tanggalPengajuan).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-2.5">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/pengajuan/${p.id}`}>Detail</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
