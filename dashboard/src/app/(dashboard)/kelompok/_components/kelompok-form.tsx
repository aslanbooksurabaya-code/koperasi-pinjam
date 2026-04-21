"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save, Users, MapPin, Calendar, UserCheck, Shield, Trash2, Info } from "lucide-react"
import { createKelompok, getNasabahOptionsForKelompok, updateKelompok } from "@/actions/kelompok"
import { kelompokSchema, type KelompokInput } from "@/lib/validations/kelompok"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field"

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

  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<KelompokInput>({
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

  const anggotaIds = useWatch({ control, name: "anggotaIds" }) ?? []
  const ketuaNasabahId = useWatch({ control, name: "ketuaNasabahId" })

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
        toast.error("Gagal memuat daftar nasabah.")
      })

    return () => {
      cancelled = true
    }
  }, [initialData, mode, setValue])

  const availableForKelompok = useMemo(() => {
    if (!initialData?.id) return nasabahOptions
    return nasabahOptions.filter((n) => !n.kelompokId || n.kelompokId === initialData.id)
  }, [initialData, nasabahOptions])

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-6">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
            <div className="flex items-center gap-2 mb-1">
              <Users className="size-4 text-primary" />
              <CardTitle className="text-base font-semibold">Informasi Dasar</CardTitle>
            </div>
            <CardDescription>Detail identitas dan lokasi kelompok</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <Field>
                <FieldLabel htmlFor="kode" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Kode Kelompok</FieldLabel>
                <Input id="kode" {...register("kode")} className="h-10 font-mono text-sm" placeholder="KLP-001" />
                {errors.kode && <FieldError className="text-[10px] font-bold text-red-500 uppercase">{errors.kode.message}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor="nama" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama Kelompok</FieldLabel>
                <Input id="nama" {...register("nama")} className="h-10 font-bold" placeholder="Nama Kelompok..." />
                {errors.nama && <FieldError className="text-[10px] font-bold text-red-500 uppercase">{errors.nama.message}</FieldError>}
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <Field>
                <FieldLabel htmlFor="wilayah" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Wilayah / Area</FieldLabel>
                <div className="relative group w-full">
                   <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                   <Input id="wilayah" {...register("wilayah")} className="pl-9 h-10 w-full" placeholder="Contoh: Desa Sukamaju" />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="jadwalPertemuan" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Jadwal Pertemuan</FieldLabel>
                <div className="relative group w-full">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                   <Input id="jadwalPertemuan" {...register("jadwalPertemuan")} className="pl-9 h-10 w-full" placeholder="Senin, 09:00 WIB" />
                </div>
              </Field>
            </div>

            <Separator className="bg-slate-50 dark:bg-slate-800" />

            <Field className="space-y-4">
               <div className="flex items-center gap-2">
                  <UserCheck className="size-4 text-emerald-600" />
                  <FieldLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ketua Kelompok</FieldLabel>
               </div>
               <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <Select
                    onValueChange={(value) => setValue("ketuaNasabahId", !value || value === "__NONE__" ? undefined : value)}
                    value={ketuaNasabahId ?? "__NONE__"}
                  >
                    <SelectTrigger className="h-10 border-slate-100 bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
                      <SelectValue placeholder="Pilih ketua dari anggota" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                      <SelectItem value="__NONE__" className="rounded-lg italic opacity-50">Manual / Belum ditentukan</SelectItem>
                      {anggotaIds
                        .map((id) => availableForKelompok.find((n) => n.id === id))
                        .filter((n): n is NasabahOption => Boolean(n))
                        .map((n) => (
                          <SelectItem key={n.id} value={n.id} className="rounded-lg font-medium">{n.namaLengkap}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Input {...register("ketua")} placeholder="Input manual..." className="h-10 sm:w-48" />
               </div>
               <FieldDescription className="text-[10px] text-muted-foreground flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg dark:bg-slate-900/30">
                 <Info className="size-3 text-blue-500" />
                 Ketua idealnya dipilih dari daftar anggota kelompok yang sudah dicentang.
               </FieldDescription>
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-none shadow-sm overflow-hidden flex flex-col h-fit">
          <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Shield className="size-4 text-emerald-600" />
                 <CardTitle className="text-base font-semibold">Anggota</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 h-5 px-1.5 text-[9px] font-black">{anggotaIds.length} Terpilih</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 p-0">
            <div className="max-h-[400px] overflow-y-auto px-4 pb-4 space-y-1 divide-y divide-slate-50 dark:divide-slate-800/50">
              {availableForKelompok.length === 0 ? (
                <div className="py-12 text-center">
                   <Users className="size-8 opacity-10 mx-auto mb-2" />
                   <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tidak ada nasabah tersedia</p>
                </div>
              ) : (
                availableForKelompok.map((n) => (
                  <label key={n.id} className="flex items-center gap-3 py-3 px-1 hover:bg-slate-50 cursor-pointer rounded-lg transition-colors group dark:hover:bg-slate-900/50">
                    <input
                      type="checkbox"
                      className="size-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                      checked={anggotaIds.includes(n.id)}
                      onChange={() => toggleAnggota(n.id)}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                       <span className={`text-sm font-semibold tracking-tight transition-colors ${anggotaIds.includes(n.id) ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{n.namaLengkap}</span>
                       {n.kelompokId && n.kelompokId === initialData?.id && (
                          <span className="text-[9px] font-black uppercase text-emerald-600/60 tracking-widest">Anggota Aktif</span>
                       )}
                    </div>
                  </label>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 rounded-xl shadow-lg shadow-emerald-200/50 dark:shadow-none font-bold uppercase tracking-widest text-[11px] transition-all active:scale-[0.98]" disabled={isPending}>
            {isPending ? <Trash2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
            {isPending ? "Sedang Menyimpan..." : "Simpan Data Kelompok"}
          </Button>
          <Button type="button" variant="ghost" className="w-full h-11 rounded-xl font-bold uppercase tracking-widest text-[10px] text-slate-400" onClick={() => router.back()}>
            Batal & Kembali
          </Button>
        </div>
      </div>
    </form>
  )
}
