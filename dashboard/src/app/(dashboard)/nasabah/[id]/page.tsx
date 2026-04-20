import { notFound } from "next/navigation"
import Link from "next/link"
import { getNasabahById } from "@/actions/nasabah"
import { getRankingConfig } from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowLeft, Edit, Phone, MapPin, Briefcase, CreditCard, CalendarDays, Store } from "lucide-react"
import { computeRanking, explainRanking } from "@/lib/ranking"

function docTitle(url: string) {
  const clean = url.split("?")[0]
  return clean.split("/").filter(Boolean).pop() ?? url
}

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

function rankingBadge(rank: string) {
  if (rank === "A") return <Badge className="bg-emerald-100 text-emerald-700">A - Sangat Lancar</Badge>
  if (rank === "B") return <Badge className="bg-blue-100 text-blue-700">B - Lancar</Badge>
  if (rank === "C") return <Badge className="bg-amber-100 text-amber-700">C - Perlu Pantau</Badge>
  return <Badge className="bg-red-100 text-red-700">D - Risiko</Badge>
}

export default async function NasabahDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const nasabah = await getNasabahById(id)
  if (!nasabah) notFound()
  const now = new Date()
  const rankingConfig = await getRankingConfig()

  // Indikator konsistensi dan ranking (mengikuti logika laporan).
  const indikator = (() => {
    let totalTagihanArrears = 0
    let totalDibayarArrears = 0
    let telat = 0
    let belumJatuhTempo = 0
    let belumBayar = 0
    let outstanding = 0
    let anomaliPembayaran = 0
    let anomaliNominal = 0

    const pinjamanList = nasabah.pengajuan
      .map((p) => p.pinjaman)
      .filter((p): p is NonNullable<typeof p> => Boolean(p))

    for (const pinjaman of pinjamanList) {
      outstanding += Number(pinjaman.sisaPinjaman)
      const pembayaranTagMap = new Map<string, number>()

      for (const p of pinjaman.pembayaran) {
        const tags = p.catatan?.match(/\[JADWAL:([^\]]+)\]/g) ?? []
        if (tags.length === 0) {
          anomaliPembayaran += 1
          anomaliNominal += Number(p.totalBayar)
          continue
        }
        for (const rawTag of tags) {
          const jadwalId = rawTag.replace("[JADWAL:", "").replace("]", "")
          const prev = pembayaranTagMap.get(jadwalId) ?? 0
          pembayaranTagMap.set(jadwalId, prev + Number(p.totalBayar))
        }
      }

      for (const jadwal of pinjaman.jadwalAngsuran) {
        const nominalTagihan = Number(jadwal.total)
        const bayarParsial = pembayaranTagMap.get(jadwal.id) ?? 0
        const bayarEfektif = jadwal.sudahDibayar ? nominalTagihan : Math.min(nominalTagihan, bayarParsial)

        // Hanya hitung tagihan yang SUDAH JATUH TEMPO (atau sudah dibayar) ke tunggakan
        if (jadwal.sudahDibayar || jadwal.tanggalJatuhTempo <= now || bayarEfektif > 0) {
          totalTagihanArrears += nominalTagihan
          totalDibayarArrears += bayarEfektif
        }

        if (jadwal.sudahDibayar || bayarEfektif >= nominalTagihan) {
          if (jadwal.tanggalBayar && jadwal.tanggalBayar > jadwal.tanggalJatuhTempo) telat += 1
          continue
        }

        if (jadwal.tanggalJatuhTempo > now) {
          belumJatuhTempo += 1
        } else {
          belumBayar += 1
          telat += 1
        }
      }
    }

    const tunggakanNominal = Math.max(0, totalTagihanArrears - totalDibayarArrears)
    const ranking = computeRanking({ telat, tunggakanNominal }, rankingConfig)

    return {
      tunggakanNominal,
      telat,
      belumJatuhTempo,
      belumBayar,
      outstanding,
      ranking,
      anomaliPembayaran,
      anomaliNominal,
    }
  })()
  const rankingExplain = explainRanking(
    { telat: indikator.telat, tunggakanNominal: indikator.tunggakanNominal },
    rankingConfig
  )

  const transaksiTerjadi = nasabah.pengajuan
    .flatMap((p) =>
      (p.pinjaman?.pembayaran ?? []).map((bayar) => ({
        id: bayar.id,
        tanggal: bayar.tanggalBayar,
        kontrak: p.pinjaman?.nomorKontrak ?? "-",
        total: Number(bayar.totalBayar),
        pokok: Number(bayar.pokok),
        bunga: Number(bayar.bunga),
        denda: Number(bayar.denda),
        metode: bayar.metode,
        petugas: bayar.inputOleh.name,
      }))
    )
    .sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime())

  const transaksiAkanDatang = nasabah.pengajuan
    .flatMap((p) =>
      (p.pinjaman?.jadwalAngsuran ?? [])
        .filter((jadwal) => !jadwal.sudahDibayar)
        .map((jadwal) => ({
          id: jadwal.id,
          tanggalJatuhTempo: jadwal.tanggalJatuhTempo,
          kontrak: p.pinjaman?.nomorKontrak ?? "-",
          angsuranKe: jadwal.angsuranKe,
          total: Number(jadwal.total),
          pokok: Number(jadwal.pokok),
          bunga: Number(jadwal.bunga),
          status: jadwal.tanggalJatuhTempo < now ? "TERLAMBAT" : "UPCOMING",
        }))
    )
    .sort((a, b) => a.tanggalJatuhTempo.getTime() - b.tanggalJatuhTempo.getTime())

  const infoItems = [
    { icon: Phone, label: "No. HP", value: nasabah.noHp },
    { icon: MapPin, label: "Alamat", value: `${nasabah.alamat}${nasabah.kecamatan ? `, Kec. ${nasabah.kecamatan}` : ""}${nasabah.kotaKab ? `, ${nasabah.kotaKab}` : ""}` },
    { icon: CalendarDays, label: "Tempat/Tgl. Lahir", value: nasabah.tanggalLahir ? `${nasabah.tempatLahir ?? "—"}, ${new Date(nasabah.tanggalLahir).toLocaleDateString("id-ID")}` : (nasabah.tempatLahir ?? "—") },
    { icon: Briefcase, label: "Pekerjaan", value: nasabah.pekerjaan ?? "—" },
    { icon: Store, label: "Nama Usaha", value: nasabah.namaUsaha ?? "—" },
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

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href="#informasi">Informasi</a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="#penjamin">Penjamin ({nasabah.penjamin.length})</a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="#dokumen">Dokumen ({nasabah.dokumenUrls.length})</a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="#pengajuan">Pengajuan ({nasabah.pengajuan.length})</a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="#transaksi">Transaksi ({transaksiTerjadi.length})</a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="#jadwal">Jadwal ({transaksiAkanDatang.length})</a>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Info Utama */}
        <Card id="informasi" className="lg:col-span-2 scroll-mt-24">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Informasi Nasabah</CardTitle>
              <Badge className={nasabah.status === "AKTIF" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}>
                {nasabah.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {nasabah.fotoUrl ? (
              <div className="flex items-center gap-3 rounded-md border bg-muted/20 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={nasabah.fotoUrl}
                  alt="Foto nasabah"
                  className="h-14 w-14 rounded-md border bg-white object-cover"
                />
                <div className="text-xs text-muted-foreground">
                  Foto profil nasabah.
                </div>
              </div>
            ) : null}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Indikator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Ranking</span>
              <Tooltip>
                <TooltipTrigger render={<span className="inline-flex">{rankingBadge(indikator.ranking)}</span>} />
                <TooltipContent className="max-w-sm">
                  <div className="text-xs space-y-1">
                    <div className="font-semibold">Alasan Ranking</div>
                    <div>{rankingExplain.summary}</div>
                    <div className="pt-1">
                      {rankingExplain.rules.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Telat</p>
                <p className="font-semibold text-red-600">{indikator.telat.toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Belum JT</p>
                <p className="font-semibold">{indikator.belumJatuhTempo.toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tunggakan</p>
                <p className="font-semibold">{fmt(indikator.tunggakanNominal)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="font-semibold text-blue-700">{fmt(indikator.outstanding)}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Anomali pencatatan</span>
              {indikator.anomaliPembayaran > 0 ? (
                <Badge className="bg-amber-100 text-amber-700">
                  {indikator.anomaliPembayaran} trx ({fmt(indikator.anomaliNominal)})
                </Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-700">0</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Penjamin */}
        <Card id="penjamin" className="scroll-mt-24">
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

      <Card id="dokumen" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-base">Dokumen Terlampir</CardTitle>
        </CardHeader>
        <CardContent>
          {nasabah.dokumenUrls.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada dokumen terlampir.</p>
          ) : (
            <div className="space-y-2">
              {nasabah.dokumenUrls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded border px-3 py-2 hover:bg-muted/30"
                >
                  <div className="text-sm font-medium truncate">{docTitle(url)}</div>
                  <div className="text-xs text-muted-foreground truncate">{url}</div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Riwayat Pengajuan */}
      <Card id="pengajuan" className="scroll-mt-24">
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
                  <th className="text-left px-4 py-2.5 font-medium">Tenor</th>
                  <th className="text-right px-4 py-2.5 font-medium">Sisa Pinjaman</th>
                  <th className="text-left px-4 py-2.5 hidden md:table-cell font-medium">No. Kontrak</th>
                  <th className="text-left px-4 py-2.5 font-medium">Tanggal</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {nasabah.pengajuan.map((p) => (
                  // Progress tenor ditampilkan jika sudah ada pinjaman + jadwal.
                  // Format: Bulanan 1/12, Mingguan 3/16
                  <tr key={p.id} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <Badge className={`${statusPengajuan[p.status]} border-0`}>{p.status}</Badge>
                      {p.pinjaman && (
                        <Badge className={`${statusPinjaman[p.pinjaman.status]} border-0 ml-1`}>{p.pinjaman.status}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {p.pinjaman ? (
                        (() => {
                          const total = p.pinjaman.tenor
                          const paid = p.pinjaman.jadwalAngsuran.filter((j) => j.sudahDibayar).length
                          const label = p.pinjaman.tenorType === "MINGGUAN" ? "Mingguan" : "Bulanan"
                          return `${label} ${paid}/${total}`
                        })()
                      ) : (
                        (() => {
                          const label = p.tenorType === "MINGGUAN" ? "Mingguan" : "Bulanan"
                          return `${label} 0/${p.tenor}`
                        })()
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
                    <td className="px-4 py-2.5 flex justify-end gap-1">
                      {p.pinjaman && (
                        <Link 
                          href={`/dokumen/kartu-angsuran/${p.pinjaman.id}`}
                          className="inline-flex items-center justify-center rounded-md text-xs font-medium border h-7 px-2.5 hover:bg-indigo-50 text-indigo-700 border-indigo-200"
                        >
                          Kartu
                        </Link>
                      )}
                      <Link 
                        href={`/pengajuan/${p.id}`}
                        className="inline-flex items-center justify-center rounded-md text-xs font-medium hover:bg-slate-100 h-7 px-2.5"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card id="transaksi" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-base">Log Detail Transaksi Terjadi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transaksiTerjadi.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">Belum ada transaksi pembayaran yang tercatat.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium">Tanggal</th>
                  <th className="text-left px-4 py-2.5 font-medium">No. Kontrak</th>
                  <th className="text-right px-4 py-2.5 font-medium">Pokok</th>
                  <th className="text-right px-4 py-2.5 font-medium">Bunga</th>
                  <th className="text-right px-4 py-2.5 font-medium">Denda</th>
                  <th className="text-right px-4 py-2.5 font-medium">Total</th>
                  <th className="text-left px-4 py-2.5 font-medium">Petugas</th>
                </tr>
              </thead>
              <tbody>
                {transaksiTerjadi.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {new Date(row.tanggal).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{row.kontrak}</td>
                    <td className="px-4 py-2.5 text-right">{fmt(row.pokok)}</td>
                    <td className="px-4 py-2.5 text-right">{fmt(row.bunga)}</td>
                    <td className="px-4 py-2.5 text-right text-orange-600">{fmt(row.denda)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{fmt(row.total)}</td>
                    <td className="px-4 py-2.5 text-xs">{row.petugas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card id="jadwal" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-base">Daftar Transaksi Akan Datang</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transaksiAkanDatang.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">Tidak ada jadwal transaksi yang akan datang.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium">Jatuh Tempo</th>
                  <th className="text-left px-4 py-2.5 font-medium">No. Kontrak</th>
                  <th className="text-right px-4 py-2.5 font-medium">Angsuran Ke</th>
                  <th className="text-right px-4 py-2.5 font-medium">Pokok</th>
                  <th className="text-right px-4 py-2.5 font-medium">Bunga</th>
                  <th className="text-right px-4 py-2.5 font-medium">Total</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {transaksiAkanDatang.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {new Date(row.tanggalJatuhTempo).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{row.kontrak}</td>
                    <td className="px-4 py-2.5 text-right">{row.angsuranKe}</td>
                    <td className="px-4 py-2.5 text-right">{fmt(row.pokok)}</td>
                    <td className="px-4 py-2.5 text-right">{fmt(row.bunga)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{fmt(row.total)}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={row.status === "TERLAMBAT" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}>
                        {row.status === "TERLAMBAT" ? "Terlambat" : "Akan Datang"}
                      </Badge>
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
