"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { updateNasabah } from "@/actions/nasabah"
import { nasabahSchema, type NasabahInput } from "@/lib/validations/nasabah"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type FormNasabah = {
  id: string
  namaLengkap: string
  nik: string
  tempatLahir: string | null
  tanggalLahir: Date | null
  alamat: string
  kelurahan: string | null
  kecamatan: string | null
  kotaKab: string | null
  noHp: string
  pekerjaan: string | null
  namaUsaha: string | null
  status: "AKTIF" | "NON_AKTIF" | "KELUAR"
  kelompokId: string | null
  kolektorId: string | null
}

export function EditNasabahForm({
  nasabah,
  kelompokList,
  kolektorList,
}: {
  nasabah: FormNasabah
  kelompokList: { id: string; nama: string }[]
  kolektorList: { id: string; name: string }[]
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<NasabahInput>({
    resolver: zodResolver(nasabahSchema) as never,
    defaultValues: {
      namaLengkap: nasabah.namaLengkap,
      nik: nasabah.nik,
      tempatLahir: nasabah.tempatLahir ?? "",
      tanggalLahir: nasabah.tanggalLahir ? new Date(nasabah.tanggalLahir).toISOString().slice(0, 10) : "",
      alamat: nasabah.alamat,
      kelurahan: nasabah.kelurahan ?? "",
      kecamatan: nasabah.kecamatan ?? "",
      kotaKab: nasabah.kotaKab ?? "",
      noHp: nasabah.noHp,
      pekerjaan: nasabah.pekerjaan ?? "",
      namaUsaha: nasabah.namaUsaha ?? "",
      status: nasabah.status,
      kelompokId: nasabah.kelompokId ?? undefined,
      kolektorId: nasabah.kolektorId ?? undefined,
    },
  })

  const onSubmit = (data: NasabahInput) => {
    startTransition(async () => {
      await updateNasabah(nasabah.id, data)
      toast.success("Data nasabah berhasil diperbarui.")
      router.push(`/nasabah/${nasabah.id}`)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Form Edit Nasabah</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="namaLengkap">Nama Lengkap</Label>
              <Input id="namaLengkap" {...register("namaLengkap")} />
              {errors.namaLengkap && <p className="text-xs text-red-500">{errors.namaLengkap.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nik">NIK</Label>
              <Input id="nik" {...register("nik")} maxLength={16} />
              {errors.nik && <p className="text-xs text-red-500">{errors.nik.message}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tempatLahir">Tempat Lahir</Label>
              <Input id="tempatLahir" {...register("tempatLahir")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
              <Input id="tanggalLahir" type="date" {...register("tanggalLahir")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Textarea id="alamat" rows={3} {...register("alamat")} />
            {errors.alamat && <p className="text-xs text-red-500">{errors.alamat.message}</p>}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kelurahan">Kelurahan</Label>
              <Input id="kelurahan" {...register("kelurahan")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kecamatan">Kecamatan</Label>
              <Input id="kecamatan" {...register("kecamatan")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kotaKab">Kota/Kabupaten</Label>
              <Input id="kotaKab" {...register("kotaKab")} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="noHp">No. HP</Label>
              <Input id="noHp" {...register("noHp")} />
              {errors.noHp && <p className="text-xs text-red-500">{errors.noHp.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pekerjaan">Pekerjaan</Label>
              <Input id="pekerjaan" {...register("pekerjaan")} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="namaUsaha">Nama Usaha</Label>
              <Input id="namaUsaha" {...register("namaUsaha")} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select defaultValue={nasabah.status} onValueChange={(v) => setValue("status", v as NasabahInput["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="NON_AKTIF">Non Aktif</SelectItem>
                  <SelectItem value="KELUAR">Keluar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kelompok</Label>
              <Select
                defaultValue={nasabah.kelompokId ?? "__NONE__"}
                onValueChange={(v) => setValue("kelompokId", !v || v === "__NONE__" ? undefined : v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">Belum ditentukan</SelectItem>
                  {kelompokList.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kolektor</Label>
              <Select
                defaultValue={nasabah.kolektorId ?? "__NONE__"}
                onValueChange={(v) => setValue("kolektorId", !v || v === "__NONE__" ? undefined : v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">Belum ditentukan</SelectItem>
                  {kolektorList.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isPending}>
            <Save className="size-4" />
            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
