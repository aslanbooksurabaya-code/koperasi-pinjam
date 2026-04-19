"use client"

import { useEffect, useMemo, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { pengajuanSchema, type PengajuanInput } from "@/lib/validations/pengajuan"
import { createPengajuan, getNasabahPengajuanOptions } from "@/actions/pengajuan"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ArrowLeft, Calculator, Save } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

type NasabahOption = {
  id: string
  nomorAnggota: string
  namaLengkap: string
  kelompokId: string | null
  kelompok: { nama: string } | null
  kolektor: { name: string } | null
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function KalkulatorAngsuran({
  plafon,
  tenor,
  bunga,
  tenorType,
}: {
  plafon: number
  tenor: number
  bunga: number
  tenorType: "BULANAN" | "MINGGUAN"
}) {
  if (!plafon || !tenor || !bunga) return null
  const bungaDesimal = bunga / 100
  const pokok = plafon / tenor
  const bungaPerPeriode = plafon * bungaDesimal
  const total = pokok + bungaPerPeriode
  const totalKeseluruhan = total * tenor
  const unit = tenorType === "MINGGUAN" ? "minggu" : "bulan"

  return (
    <Card className="bg-emerald-50 border-emerald-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-emerald-800">
          <Calculator className="size-4" /> Simulasi Angsuran
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {[
          { label: `Angsuran Pokok/${unit}`, value: formatRupiah(pokok) },
          { label: `Bunga Flat/${unit}`, value: formatRupiah(bungaPerPeriode) },
          { label: `Total Angsuran/${unit}`, value: formatRupiah(total), bold: true },
          { label: "Total Keseluruhan", value: formatRupiah(totalKeseluruhan) },
        ].map((r) => (
          <div key={r.label} className="flex justify-between">
            <span className="text-emerald-700">{r.label}</span>
            <span className={r.bold ? "font-bold text-emerald-900" : "text-emerald-800"}>{r.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function PengajuanBaruPage() {
  const [isPending, startTransition] = useTransition()
  const [nasabahOptions, setNasabahOptions] = useState<NasabahOption[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const nasabahIdParam = searchParams.get("nasabahId") ?? ""

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
    register,
  } = useForm<PengajuanInput>({
    resolver: zodResolver(pengajuanSchema) as never,
    defaultValues: {
      nasabahId: nasabahIdParam,
      jenisPinjaman: "REGULAR",
      tenorType: "BULANAN",
      bungaPerBulan: 1.5,
      tenor: 12,
    },
  })

  const [nasabahId, plafon, tenor, bunga, tenorType] = useWatch({
    control,
    name: ["nasabahId", "plafonDiajukan", "tenor", "bungaPerBulan", "tenorType"],
  })

  const tipeTenor = (tenorType ?? "BULANAN") as "BULANAN" | "MINGGUAN"

  useEffect(() => {
    let cancelled = false
    getNasabahPengajuanOptions()
      .then((rows) => {
        if (cancelled) return
        setNasabahOptions(rows)

        if (nasabahIdParam) {
          const found = rows.find((r) => r.id === nasabahIdParam)
          if (found?.kelompokId) {
            setValue("kelompokId", found.kelompokId)
          }
        }
      })
      .catch(() => {
        toast.error("Gagal memuat data nasabah.")
      })

    return () => {
      cancelled = true
    }
  }, [nasabahIdParam, setValue])

  const selectedNasabah = useMemo(
    () => nasabahOptions.find((n) => n.id === nasabahId),
    [nasabahId, nasabahOptions]
  )

  const handleNasabahSelect = (value: string | null) => {
    const id = value ?? ""
    setValue("nasabahId", id)

    const found = nasabahOptions.find((n) => n.id === id)
    setValue("kelompokId", found?.kelompokId ?? undefined)
  }

  const onSubmit = (data: PengajuanInput) => {
    startTransition(async () => {
      const result = await createPengajuan(data)
      if (result.error) {
        toast.error("Gagal menyimpan pengajuan.")
        return
      }
      toast.success("Pengajuan berhasil diajukan!")
      router.push("/pengajuan")
    })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pengajuan"><ArrowLeft className="size-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengajuan Pinjaman Baru</h1>
          <p className="text-muted-foreground text-sm">Status akan langsung DIAJUKAN</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Pengajuan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nasabah <span className="text-red-500">*</span></Label>
                <Select value={nasabahId || "__NONE__"} onValueChange={(v) => handleNasabahSelect(v === "__NONE__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih nasabah..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">Pilih nasabah</SelectItem>
                    {nasabahOptions.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.namaLengkap} ({n.nomorAnggota})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.nasabahId && <p className="text-xs text-red-500">{errors.nasabahId.message}</p>}
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">No Anggota</p>
                  <p className="font-medium">{selectedNasabah?.nomorAnggota ?? "-"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Kelompok</p>
                  <p className="font-medium">{selectedNasabah?.kelompok?.nama ?? "-"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Kolektor</p>
                  <p className="font-medium">{selectedNasabah?.kolektor?.name ?? "-"}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jenis Pinjaman</Label>
                  <Select defaultValue="REGULAR" onValueChange={(v) => setValue("jenisPinjaman", v as PengajuanInput["jenisPinjaman"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REGULAR">Regular</SelectItem>
                      <SelectItem value="MIKRO">Mikro</SelectItem>
                      <SelectItem value="USAHA">Usaha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipe Tenor</Label>
                  <Select
                    defaultValue="BULANAN"
                    onValueChange={(v) => {
                      const typed = v as PengajuanInput["tenorType"]
                      setValue("tenorType", typed)
                      setValue("tenor", 12)
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BULANAN">Bulanan</SelectItem>
                      <SelectItem value="MINGGUAN">Mingguan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tenor ({tipeTenor === "MINGGUAN" ? "minggu" : "bulan"}) <span className="text-red-500">*</span></Label>
                <Select defaultValue="12" onValueChange={(v) => setValue("tenor", Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(tipeTenor === "MINGGUAN" ? [4, 8, 12, 16, 20, 24] : [3, 6, 9, 12, 18, 24, 36]).map((t) => (
                      <SelectItem key={t} value={String(t)}>
                        {t} {tipeTenor === "MINGGUAN" ? "minggu" : "bulan"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plafonDiajukan">Plafon Diajukan (Rp) <span className="text-red-500">*</span></Label>
                  <Input id="plafonDiajukan" type="number" {...register("plafonDiajukan")} placeholder="5000000" />
                  {errors.plafonDiajukan && <p className="text-xs text-red-500">{errors.plafonDiajukan.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bungaPerBulan">Bunga Flat/{tipeTenor === "MINGGUAN" ? "minggu" : "bulan"} (%) <span className="text-red-500">*</span></Label>
                  <Input id="bungaPerBulan" type="number" step="0.1" {...register("bungaPerBulan")} defaultValue="1.5" />
                  {errors.bungaPerBulan && <p className="text-xs text-red-500">{errors.bungaPerBulan.message}</p>}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="tujuanPinjaman">Tujuan Pinjaman <span className="text-red-500">*</span></Label>
                <Textarea id="tujuanPinjaman" {...register("tujuanPinjaman")} rows={2} placeholder="Modal usaha, keperluan pendidikan, dll..." />
                {errors.tujuanPinjaman && <p className="text-xs text-red-500">{errors.tujuanPinjaman.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="agunan">Agunan / Jaminan</Label>
                <Input id="agunan" {...register("agunan")} placeholder="BPKB Motor, sertifikat tanah, dll..." />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <KalkulatorAngsuran
            plafon={Number(plafon)}
            tenor={Number(tenor)}
            bunga={Number(bunga)}
            tenorType={tipeTenor}
          />

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isPending}>
            <Save className="size-4" /> {isPending ? "Menyimpan..." : "Ajukan Pinjaman"}
          </Button>
          <Button type="button" variant="outline" className="w-full" asChild>
            <Link href="/pengajuan">Batal</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
