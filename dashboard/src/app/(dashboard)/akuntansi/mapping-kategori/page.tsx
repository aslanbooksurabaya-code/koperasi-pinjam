import { getKasKategoriMappingList } from "@/actions/akuntansi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MappingKategoriClient } from "./ui/mapping-kategori-client"

export default async function MappingKategoriPage() {
  const data = await getKasKategoriMappingList()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mapping Kategori Kas</h1>
        <p className="text-muted-foreground text-sm">Hubungkan kategori kas ke akun COA untuk pengelompokan laporan</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <MappingKategoriClient initial={data} />
        </CardContent>
      </Card>
    </div>
  )
}

