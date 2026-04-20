import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { PrintButton } from "@/components/print-button"
import { CompanyDocumentHeader } from "@/components/print/company-document-header"

export const metadata = {
  title: "Kartu Angsuran",
}

function fmt(n: number | string) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(n))
}

export default async function KartuAngsuranPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pinjaman = await prisma.pinjaman.findUnique({
    where: { id },
    include: {
      pengajuan: {
        include: {
          nasabah: true,
          kelompok: true,
        },
      },
      jadwalAngsuran: {
        orderBy: { angsuranKe: "asc" },
      },
    },
  })

  if (!pinjaman) {
    notFound()
  }

  const tagihanPerPeriode = Number(pinjaman.totalAngsuran)
  const nasabah = pinjaman.pengajuan.nasabah
  
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto bg-white min-h-screen text-slate-900">
      {/* Tombol Aksi - Disembunyikan saat print */}
      <div className="print:hidden flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
        <Link href={`/nasabah/${nasabah.id}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Profil
          </Button>
        </Link>
        <PrintButton />
      </div>

      {/* Kartu Cetak */}
      <div id="printable-area" className="border-2 border-slate-800 p-6 sm:p-8 rounded-xl relative bg-white mx-auto print:border-0 print:p-0">
        
        {/* Kop Koperasi */}
        <div className="mb-6">
          <CompanyDocumentHeader
            documentTitle="Kartu Angsuran"
            documentNumber={pinjaman.nomorKontrak}
          />
          <div className="text-center -mt-2">
            <p className="text-sm font-medium tracking-widest bg-slate-900 text-white inline-block px-4 py-1 mt-1 rounded-full">
              KARTU ANGSURAN PINJAMAN
            </p>
          </div>
        </div>

        {/* Informasi Debitur */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-6 border border-slate-300 p-4 rounded-md bg-slate-50">
          <div>
            <div className="flex">
              <span className="w-32 font-semibold">Nama Debitur</span>
              <span>: {nasabah.namaLengkap}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">No. Anggota</span>
              <span className="font-mono">: {nasabah.nomorAnggota}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">Kelompok</span>
              <span>: {pinjaman.pengajuan.kelompok?.nama || "Personal"}</span>
            </div>
          </div>
          <div>
            <div className="flex">
              <span className="w-32 font-semibold">No. Kontrak</span>
              <span className="font-mono font-bold">: {pinjaman.nomorKontrak}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">Plafon Cair</span>
              <span className="font-bold">: {fmt(Number(pinjaman.pokokPinjaman))}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">Wajib Angsur</span>
              <span className="font-bold">: {fmt(tagihanPerPeriode)} / {pinjaman.tenorType === "MINGGUAN" ? "minggu" : "bulan"}</span>
            </div>
          </div>
        </div>

        {/* Tabel Jadwal */}
        <table className="w-full text-xs text-left border-collapse border border-slate-300">
          <thead className="bg-slate-100 uppercase tracking-wider text-slate-700">
            <tr>
              <th className="border border-slate-300 p-2 text-center w-10">Ke</th>
              <th className="border border-slate-300 p-2 text-center">Jatuh Tempo</th>
              <th className="border border-slate-300 p-2 text-center">Jumlah Tagihan</th>
              <th className="border border-slate-300 p-2 text-center">Tgl Bayar<br/>(Diisi Petugas)</th>
              <th className="border border-slate-300 p-2 text-center">Nominal Dibayar<br/>(Diisi Petugas)</th>
              <th className="border border-slate-300 p-2 text-center">Ttd Petugas</th>
            </tr>
          </thead>
          <tbody>
            {pinjaman.jadwalAngsuran.map((j) => (
              <tr key={j.id}>
                <td className="border border-slate-300 p-2 text-center font-bold">{j.angsuranKe}</td>
                <td className="border border-slate-300 p-2 text-center font-medium">
                  {format(j.tanggalJatuhTempo, "dd MMM yyyy", { locale: idLocale })}
                </td>
                <td className="border border-slate-300 p-2 text-right font-semibold text-slate-800">
                  {fmt(Number(j.total))}
                </td>
                <td className="border border-slate-300 p-2 min-h-[30px]"></td>
                <td className="border border-slate-300 p-2 min-h-[30px]"></td>
                <td className="border border-slate-300 p-2 min-h-[30px]"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer/Petunjuk */}
        <div className="mt-8 text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">Perhatian:</p>
          <ol className="list-decimal list-inside">
            <li>Kartu ini harap disimpan dengan baik dan dibawa setiap kali melakukan pembayaran angsuran.</li>
            <li>Pembayaran angsuran harus sesuai dengan jumlah dan tanggal yang tertera untuk menghindari denda.</li>
            <li>Tanda tangan petugas sah jika disertai stempel koperasi.</li>
          </ol>
        </div>

      </div>

    </div>
  )
}
