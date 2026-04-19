"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { createKelompok, getNasabahOptionsForKelompok, updateKelompok } from "@/actions/kelompok"
import { kelompokSchema, type KelompokInput } from "@/lib/validations/kelompok"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type NasabahOption = {
  id: string
  namaLengkap: string
  kelompokId: string | null
}

export function KelompokForm({
  mode,
  initialData,
}: {
  mode: "create" | "edit"
  initialData?: {
    id: string
    kode: string
    nama: string
    ketua: string | null
    wilayah: string | null
    jadwalPertemuan: string | null
    nasabah: { id: string; namaLengkap: string }[]
  }
}) {
  const [isPending, startTransition] = useTransition()
  const [nasabahOptions, setNasabahOptions] = useState<NasabahOption[]>([])
  const router = useRouter()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<KelompokInput>({
    resolver: zodResolver(kelompokSchema) as never,
    defaultValues: {
      kode: initialData?.kode ?? "",
      nama: initialData?.nama ?? "",
      ketua: initialData?.ketua ?? "",
      wilayah: initialData?.wilayah ?? "",
      jadwalPertemuan: initialData?.jadwalPertemuan ?? "",
      anggotaIds: initialData?.nasabah?.map((n) => n.id) ?? [],
    },
  })

  const anggotaIds = watch("anggotaIds") ?? []
  const ketuaNasabahId = watch("ketuaNasabahId")

  useEffect(() => {
    let cancelled = false
    getNasabahOptionsForKelompok()
      .then((result) => {
        if (cancelled) return
        setNasabahOptions(result)

        if (mode === "edit" && initialData?.ketua) {
          const ketuaMatch = result.find((n) => n.namaLengkap === initialData.ketua && n.kelompokId === initialData.id)
          if (ketuaMatch) {
            setValue("ketuaNasabahId", ketuaMatch.id)
          }
        }
      })
      .catch(() => {
        toast.error("Gagal memuat daftar nasabah untuk kelompok.")
      })

    return () => {
      cancelled = true
    }
  }, [initialData, mode, setValue])

  const availableForKelompok = useMemo(() => {
    if (!initialData?.id) return nasabahOptions
    return nasabahOptions.filter((n) => !n.kelompokId || n.kelompokId === initialData.id)
  }, [initialData?.id, nasabahOptions])

  const toggleAnggota = (id: string) => {
    const exists = anggotaIds.includes(id)
    const next = exists ? anggotaIds.filter((x) => x !== id) : [...anggotaIds, id]
    setValue("anggotaIds", next)

    if (ketuaNasabahId === id && exists) {
      setValue("ketuaNasabahId", undefined)
    }
  }

  const onSubmit = (values: KelompokInput) => {
    startTransition(async () => {
      let errorMessage: string | undefined
      const result = (
        mode === "create"
          ? await createKelompok(values)
          : await updateKelompok(initialData!.id, values)
      ) as { error?: string | Record<string, string[]> }

      if (result.error) {
        errorMessage =
          typeof result.error === "string"
            ? result.error
            : (Object.values(result.error).flat()[0] as string | undefined) ?? "Gagal menyimpan data kelompok."
      }

      if (errorMessage) {
        toast.error(errorMessage)
        return
      }

      toast.success(mode === "create" ? "Kelompok berhasil ditambahkan." : "Data kelompok berhasil diperbarui.")
      router.push("/kelompok")
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{mode === "create" ? "Tambah Kelompok" : "Edit Kelompok"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode Kelompok</Label>
              <Input id="kode" {...register("kode")} />
              {errors.kode && <p className="text-xs text-red-500">{errors.kode.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Kelompok</Label>
              <Input id="nama" {...register("nama")} />
              {errors.nama && <p className="text-xs text-red-500">{errors.nama.message}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wilayah">Wilayah</Label>
              <Input id="wilayah" {...register("wilayah")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jadwalPertemuan">Jadwal Pertemuan</Label>
              <Input id="jadwalPertemuan" {...register("jadwalPertemuan")} placeholder="Contoh: Senin, 09:00" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ketua Kelompok</Label>
            <Select
              onValueChange={(value) => setValue("ketuaNasabahId", !value || value === "__NONE__" ? undefined : value)}
              value={ketuaNasabahId ?? "__NONE__"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih ketua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">Manual / belum ditentukan</SelectItem>
                {anggotaIds
                  .map((id) => availableForKelompok.find((n) => n.id === id))
                  .filter((n): n is NasabahOption => Boolean(n))
                  .map((n) => (
                    <SelectItem key={n.id} value={n.id}>{n.namaLengkap}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Input {...register("ketua")} placeholder="Isi manual jika tidak pilih dari anggota" />
          </div>

          <div className="space-y-2">
            <Label>Anggota Kelompok</Label>
            <div className="max-h-56 overflow-y-auto rounded-md border p-3 space-y-2">
              {availableForKelompok.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada nasabah aktif tersedia.</p>
              ) : (
                availableForKelompok.map((n) => (
                  <label key={n.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={anggotaIds.includes(n.id)}
                      onChange={() => toggleAnggota(n.id)}
                    />
                    <span>{n.namaLengkap}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">Ketua harus dipilih dari daftar anggota.</p>
          </div>

          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isPending}>
            <Save className="size-4" />
            {isPending ? "Menyimpan..." : "Simpan Kelompok"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
