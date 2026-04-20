import { getPembayaranById } from "@/actions/pembayaran"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PrintButton } from "@/components/print-button"
import { ArrowLeft } from "lucide-react"
import { CompanyDocumentHeader } from "@/components/print/company-document-header"

export const metadata = {
  title: "Kuitansi Pembayaran",
}

function fmt(n: number | string) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(n))
}

export default async function KuitansiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pembayaran = await getPembayaranById(id)

  if (!pembayaran) {
    notFound()
  }

  const { pinjaman } = pembayaran
  const { pengajuan } = pinjaman
  const { nasabah, kelompok } = pengajuan

  return (
    <div className="p-6 md:p-12 space-y-6 max-w-4xl mx-auto bg-white min-h-screen text-slate-900">
      {/* Tombol Aksi - Disembunyikan saat print */}
      <div className="print:hidden flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
        <Link href="/pembayaran">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
        </Link>
        <PrintButton />
      </div>

      {/* Area Kuitansi */}
      <div id="printable-area" className="border-2 border-slate-800 p-8 rounded-lg relative bg-white">
        <CompanyDocumentHeader
          documentTitle="Kuitansi"
          documentNumber={pembayaran.nomorTransaksi}
        />

        {/* Info Utama */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div className="space-y-4">
            <div>
              <p className="text-slate-500 font-medium mb-1">Telah diterima dari:</p>
              <p className="text-lg font-bold text-slate-900">{nasabah.namaLengkap}</p>
              <p className="text-slate-600">ID: {nasabah.nomorAnggota}</p>
              {kelompok && <p className="text-slate-600">Klp: {kelompok.nama}</p>}
            </div>
            <div>
              <p className="text-slate-500 font-medium mb-1">Total Pembayaran:</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(Number(pembayaran.totalBayar))}</p>
              <div className="mt-2 text-slate-700 italic bg-slate-50 p-2 rounded border border-slate-200">
                Catatan: {pembayaran.catatan || "-"}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Tanggal Pembayaran</span>
              <span className="font-semibold">{format(pembayaran.tanggalBayar, "dd MMMM yyyy HH:mm", { locale: idLocale })}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Nomor Kontrak</span>
              <span className="font-mono text-slate-900 font-medium">{pinjaman.nomorKontrak}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Sisa Pinjaman (Aktual)</span>
              <span className="font-semibold">{fmt(Number(pinjaman.sisaPinjaman))}</span>
            </div>
          </div>
        </div>

        {/* Rincian Alokasi */}
        <div className="mb-8">
          <p className="text-slate-500 font-medium mb-3">Rincian Pembayaran:</p>
          <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Komponen</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-4 py-3 text-slate-600">Angsuran Pokok</td>
                  <td className="px-4 py-3 text-right font-medium">{fmt(Number(pembayaran.pokok))}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600">Bunga / Jasa</td>
                  <td className="px-4 py-3 text-right font-medium">{fmt(Number(pembayaran.bunga))}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600">Denda Keterlambatan</td>
                  <td className="px-4 py-3 text-right font-medium">{fmt(Number(pembayaran.denda))}</td>
                </tr>
                <tr className="bg-slate-50/50 font-bold">
                  <td className="px-4 py-3 text-slate-900 border-t-2 border-slate-300">Total</td>
                  <td className="px-4 py-3 text-right text-slate-900 border-t-2 border-slate-300">
                    {fmt(Number(pembayaran.totalBayar))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="flex justify-between mt-16 text-sm">
          <div className="text-center">
            <p className="text-slate-500 mb-16">Nasabah / Penyetor</p>
            <p className="font-semibold underline decoration-slate-300 underline-offset-4">{nasabah.namaLengkap}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 mb-16">Diterima & Diinput Oleh</p>
            <p className="font-semibold underline decoration-slate-300 underline-offset-4">{pembayaran.inputOleh.name}</p>
          </div>
        </div>

        {/* Watermark/Status */}
        {pembayaran.isBatalkan && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="text-red-600 text-8xl font-black uppercase rotate-[-25deg] tracking-widest border-8 border-red-600 p-8 rounded-3xl">
              DIBATALKAN
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
