import { getPengajuanSiapCair } from "@/actions/pengajuan"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { PencairanForm } from "./pencairan-form"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default async function PencairanPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string }>
}) {
  const sp = await searchParams
  const selectedId = sp?.id ?? ""
  const daftarSiapCair = await getPengajuanSiapCair()
  const selected = selectedId ? daftarSiapCair.find((d) => d.id === selectedId) : null

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pencairan Pinjaman</h1>
        <p className="text-muted-foreground text-sm">
          {daftarSiapCair.length} pengajuan siap dicairkan
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Daftar siap cair */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Pilih Pengajuan</p>
          {daftarSiapCair.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                Tidak ada pengajuan yang menunggu pencairan.
              </CardContent>
            </Card>
          ) : (
            daftarSiapCair.map((p) => (
              <Link key={p.id} href={`/pencairan?id=${p.id}`}>
                <Card className={`cursor-pointer transition-all hover:border-emerald-400 ${selectedId === p.id ? "border-emerald-500 bg-emerald-50" : ""}`}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{p.nasabah.namaLengkap}</p>
                        <p className="text-xs text-muted-foreground">{p.nasabah.nomorAnggota}</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">Siap Cair</Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Plafon</span>
                      <span className="font-semibold">{fmt(Number(p.plafonDisetujui ?? p.plafonDiajukan))}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Tenor</span>
                      <span>{p.tenor} bulan</span>
                    </div>
                    {p.kelompok && (
                      <p className="text-xs text-muted-foreground">{p.kelompok.nama}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Form Pencairan */}
        <div className="lg:col-span-3">
          {selected ? (
            <PencairanForm pengajuan={selected} />
          ) : (
            <Card className="bg-muted/20 h-96 flex items-center justify-center">
              <CardContent className="text-center text-muted-foreground">
                <CheckCircle className="size-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Pilih pengajuan di sebelah kiri untuk memproses pencairan</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
