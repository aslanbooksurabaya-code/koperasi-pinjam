import { getPengajuanById } from "@/actions/pengajuan"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PrintButton } from "@/components/print-button"
import { CompanyDocumentHeader } from "@/components/print/company-document-header"

export const metadata = {
  title: "Bukti Pencairan Pinjaman",
}

function fmt(n: number | string) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(n))
}

export default async function PencairanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pengajuan = await getPengajuanById(id)

  if (!pengajuan || !pengajuan.pinjaman) {
    notFound()
  }

  const { pinjaman, nasabah, kelompok, approver } = pengajuan

  return (
    <div className="p-6 md:p-12 space-y-6 max-w-4xl mx-auto bg-white min-h-screen text-slate-900">
      {/* Tombol Aksi - Disembunyikan saat print */}
      <div className="print:hidden flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
        <Link href="/pencairan">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
        </Link>
        <PrintButton />
      </div>

      {/* Area Bukti */}
      <div id="printable-area" className="border-2 border-slate-800 p-8 rounded-lg relative bg-white">
        <CompanyDocumentHeader
          documentTitle="Bukti Pencairan"
          documentNumber={pinjaman.nomorKontrak}
        />

        {/* Info Utama */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div className="space-y-4">
            <div>
              <p className="text-slate-500 font-medium mb-1">Diberikan Kepada:</p>
              <p className="text-lg font-bold text-slate-900">{nasabah.namaLengkap}</p>
              <p className="text-slate-600">ID: {nasabah.nomorAnggota}</p>
              {kelompok && <p className="text-slate-600">Klp: {kelompok.nama}</p>}
            </div>
            <div>
              <p className="text-slate-500 font-medium mb-1">Nilai Diterima Bersih (Net):</p>
              <p className="text-3xl font-bold text-slate-900">{fmt(Number(pinjaman.nilaiCair))}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Tanggal Pencairan</span>
              <span className="font-semibold">{format(pinjaman.tanggalCair, "dd MMMM yyyy", { locale: idLocale })}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Nomor Pengajuan</span>
              <span className="font-mono text-slate-900 font-medium">{pengajuan.nomorPengajuan}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Tenor</span>
              <span className="font-semibold">{pinjaman.tenor} {pinjaman.tenorType === "BULANAN" ? "Bulan" : "Minggu"}</span>
            </div>
          </div>
        </div>

        {/* Rincian Potongan */}
        <div className="mb-8">
          <p className="text-slate-500 font-medium mb-3">Detail Pencairan:</p>
          <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Keterangan</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-4 py-3 text-slate-600 font-medium">Plafon Pinjaman Disetujui</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{fmt(Number(pinjaman.pokokPinjaman))}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-rose-600 italic">Dikurangi: Biaya Administrasi</td>
                  <td className="px-4 py-3 text-right text-rose-600 font-medium">- {fmt(Number(pinjaman.potonganAdmin))}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-rose-600 italic">Dikurangi: Biaya Provisi</td>
                  <td className="px-4 py-3 text-right text-rose-600 font-medium">- {fmt(Number(pinjaman.potonganProvisi))}</td>
                </tr>
                <tr className="bg-slate-50/50 font-bold">
                  <td className="px-4 py-3 text-emerald-700 border-t-2 border-slate-300">Total Cair (Diterima)</td>
                  <td className="px-4 py-3 text-right text-emerald-700 border-t-2 border-slate-300">
                    {fmt(Number(pinjaman.nilaiCair))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Angsuran */}
        <div className="mb-8">
          <p className="text-sm text-slate-500">
            *Pinjaman ini wajib diangsur sebesar <span className="font-bold text-slate-900">{fmt(Number(pinjaman.totalAngsuran))}</span> per {pinjaman.tenorType === "BULANAN" ? "Bulan" : "Minggu"} sebanyak <span className="font-bold text-slate-900">{pinjaman.tenor}</span> kali pembayaran.
          </p>
        </div>

        {/* Tanda Tangan */}
        <div className="flex justify-between mt-12 text-sm">
          <div className="text-center">
            <p className="text-slate-500 mb-16">Penerima Dana (Nasabah)</p>
            <p className="font-semibold underline decoration-slate-300 underline-offset-4">{nasabah.namaLengkap}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 mb-16">Pihak Koperasi (Approver)</p>
            <p className="font-semibold underline decoration-slate-300 underline-offset-4">{approver?.name || "Petugas Koperasi"}</p>
          </div>
        </div>
      </div>

    </div>
  )
}
