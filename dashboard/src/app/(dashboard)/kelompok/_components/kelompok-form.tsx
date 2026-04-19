"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { createKelompok, updateKelompok } from "@/actions/kelompok"
import { kelompokSchema, type KelompokInput } from "@/lib/validations/kelompok"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

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
  }
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<KelompokInput>({
    resolver: zodResolver(kelompokSchema) as never,
    defaultValues: {
      kode: initialData?.kode ?? "",
      nama: initialData?.nama ?? "",
      ketua: initialData?.ketua ?? "",
      wilayah: initialData?.wilayah ?? "",
      jadwalPertemuan: initialData?.jadwalPertemuan ?? "",
    },
  })

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
              <Label htmlFor="ketua">Ketua Kelompok</Label>
              <Input id="ketua" {...register("ketua")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wilayah">Wilayah</Label>
              <Input id="wilayah" {...register("wilayah")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jadwalPertemuan">Jadwal Pertemuan</Label>
            <Input id="jadwalPertemuan" {...register("jadwalPertemuan")} placeholder="Contoh: Senin, 09:00" />
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
