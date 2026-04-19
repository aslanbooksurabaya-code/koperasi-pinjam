import { getKasHarian } from "@/actions/kas"
import { KasClientPage } from "./kas-client"

export default async function KasPage() {
  const data = await getKasHarian()

  const normalized = {
    ...data,
    transaksi: data.transaksi.map((t) => ({
      id: t.id,
      tanggal: t.tanggal,
      jenis: t.jenis,
      kategori: t.kategori,
      deskripsi: t.deskripsi,
      jumlah: Number(t.jumlah),
      kasJenis: t.kasJenis,
      inputOleh: t.inputOleh,
    })),
  }

  return <KasClientPage initialData={normalized} />
}
