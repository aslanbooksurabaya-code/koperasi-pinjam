"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { nasabahSchema, type NasabahInput } from "@/lib/validations/nasabah"
import { createNasabah, getKelompokList, getKolektorList } from "@/actions/nasabah"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, Save, User, MapPin, Upload, X } from "lucide-react"
import Link from "next/link"

const STEPS = ["Data Diri", "Data Kontak & Usaha", "Penugasan & Dokumen"]

type Option = { id: string; nama: string }
type KolektorOption = { id: string; name: string }

function parseDokumen(raw: string): string[] {
  return raw
    .split(/\n|,/)
    .map((v) => v.trim())
    .filter(Boolean)
}

function docTitle(url: string) {
  const clean = url.split("?")[0]
  return clean.split("/").filter(Boolean).pop() ?? url
}

export default function NasabahBaruPage() {
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [isUploadingDokumen, setIsUploadingDokumen] = useState(false)
  const [dokumenText, setDokumenText] = useState("")
  const [uploadedDokumen, setUploadedDokumen] = useState<string[]>([])
  const [kelompokList, setKelompokList] = useState<Option[]>([])
  const [kolektorList, setKolektorList] = useState<KolektorOption[]>([])
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<NasabahInput>({
    resolver: zodResolver(nasabahSchema) as never,
    defaultValues: { status: "AKTIF", dokumenUrls: [] },
  })

  useEffect(() => {
    let cancelled = false

    Promise.all([getKelompokList(), getKolektorList()])
      .then(([kelompok, kolektor]) => {
        if (cancelled) return
        setKelompokList(kelompok.map((k) => ({ id: k.id, nama: k.nama })))
        setKolektorList(kolektor)
      })
      .catch(() => {
        toast.error("Gagal memuat daftar kelompok/kolektor.")
      })

    return () => {
      cancelled = true
    }
  }, [])

  function syncDokumenValue(rawText: string, uploaded: string[]) {
    const merged = Array.from(new Set([...parseDokumen(rawText), ...uploaded]))
    setValue("dokumenUrls", merged, { shouldValidate: true })
  }

  async function handleUploadDokumen(files: FileList | null) {
    if (!files || files.length === 0) return

    setIsUploadingDokumen(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append("files", file))

      const res = await fetch("/api/upload/nasabah", { method: "POST", body: formData })
      const json = (await res.json()) as { urls?: string[]; error?: string }

      if (!res.ok || !json.urls?.length) {
        throw new Error(json.error ?? "Upload dokumen gagal.")
      }

      const nextUploaded = Array.from(new Set([...uploadedDokumen, ...json.urls]))
      setUploadedDokumen(nextUploaded)
      syncDokumenValue(dokumenText, nextUploaded)
      toast.success("Dokumen berhasil diupload.")
    } catch {
      toast.error("Upload dokumen gagal.")
    } finally {
      setIsUploadingDokumen(false)
    }
  }

  const handleNext = async () => {
    const fields: (keyof NasabahInput)[] =
      step === 0
        ? ["namaLengkap", "nik", "alamat"]
        : step === 1
          ? ["noHp"]
          : ["status"]

    const valid = await trigger(fields)
    if (valid) setStep((s) => s + 1)
  }

  const onSubmit = (data: NasabahInput) => {
    startTransition(async () => {
      const result = await createNasabah(data)
      if (result.error) {
        toast.error("Gagal menyimpan data nasabah. Periksa kembali form.")
        return
      }
      toast.success("Nasabah berhasil ditambahkan!")
      router.push("/nasabah")
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/nasabah"><ArrowLeft className="size-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tambah Nasabah Baru</h1>
          <p className="text-muted-foreground text-sm">Langkah {step + 1} dari {STEPS.length}: {STEPS[step]}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-emerald-500" : "bg-muted"}`} />
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><User className="size-4" /> Data Diri</CardTitle>
              <CardDescription>Informasi identitas nasabah</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="namaLengkap">Nama Lengkap <span className="text-red-500">*</span></Label>
                <Input id="namaLengkap" {...register("namaLengkap")} placeholder="Sesuai KTP" />
                {errors.namaLengkap && <p className="text-xs text-red-500">{errors.namaLengkap.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nik">NIK (16 digit) <span className="text-red-500">*</span></Label>
                <Input id="nik" {...register("nik")} placeholder="Nomor KTP" maxLength={16} />
                {errors.nik && <p className="text-xs text-red-500">{errors.nik.message}</p>}
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
                <Label htmlFor="alamat">Alamat Lengkap <span className="text-red-500">*</span></Label>
                <Textarea id="alamat" {...register("alamat")} placeholder="Jalan, RT/RW, Desa..." rows={3} />
                {errors.alamat && <p className="text-xs text-red-500">{errors.alamat.message}</p>}
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { id: "kelurahan", label: "Kelurahan/Desa" },
                  { id: "kecamatan", label: "Kecamatan" },
                  { id: "kotaKab", label: "Kota/Kab" },
                ].map(({ id, label }) => (
                  <div key={id} className="space-y-2">
                    <Label htmlFor={id}>{label}</Label>
                    <Input id={id} {...register(id as keyof NasabahInput)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><MapPin className="size-4" /> Kontak & Usaha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="noHp">No. HP Aktif <span className="text-red-500">*</span></Label>
                <Input id="noHp" {...register("noHp")} placeholder="08xxxxxxxxxx" />
                {errors.noHp && <p className="text-xs text-red-500">{errors.noHp.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pekerjaan">Pekerjaan</Label>
                <Input id="pekerjaan" {...register("pekerjaan")} placeholder="Wiraswasta, Pedagang, dll..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="namaUsaha">Nama Usaha</Label>
                <Input id="namaUsaha" {...register("namaUsaha")} placeholder="Jika ada..." />
              </div>
              <div className="space-y-2">
                <Label>Status Nasabah</Label>
                <Select defaultValue="AKTIF" onValueChange={(v) => setValue("status", v as NasabahInput["status"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AKTIF">Aktif</SelectItem>
                    <SelectItem value="NON_AKTIF">Non Aktif</SelectItem>
                    <SelectItem value="KELUAR">Keluar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Relasi & Dokumen Pendukung</CardTitle>
              <CardDescription>Pilih kelompok dan kolektor saat pembuatan nasabah</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kelompok</Label>
                  <Select onValueChange={(v) => setValue("kelompokId", !v || v === "__NONE__" ? undefined : v)} defaultValue="__NONE__">
                    <SelectTrigger><SelectValue placeholder="Pilih kelompok" /></SelectTrigger>
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
                  <Select onValueChange={(v) => setValue("kolektorId", !v || v === "__NONE__" ? undefined : v)} defaultValue="__NONE__">
                    <SelectTrigger><SelectValue placeholder="Pilih kolektor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">Belum ditentukan</SelectItem>
                      {kolektorList.map((k) => (
                        <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dokumenPendukung">Dokumen Pendukung Pelanggan Baru</Label>
                <Textarea
                  id="dokumenPendukung"
                  placeholder="Masukkan URL dokumen (1 baris 1 URL):\nhttps://.../ktp.jpg\nhttps://.../kk.jpg"
                  rows={5}
                  value={dokumenText}
                  onChange={(e) => {
                    const nextText = e.target.value
                    setDokumenText(nextText)
                    syncDokumenValue(nextText, uploadedDokumen)
                  }}
                />
                <div className="space-y-2">
                  <Label htmlFor="dokumenFile">Upload File Dokumen (jpg/png/webp/pdf, max 5MB)</Label>
                  <Input
                    id="dokumenFile"
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={(e) => {
                      void handleUploadDokumen(e.target.files)
                      e.currentTarget.value = ""
                    }}
                    disabled={isUploadingDokumen}
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Upload className="size-3" /> {isUploadingDokumen ? "Sedang upload..." : "Bisa pilih lebih dari satu file."}
                  </p>
                </div>
                {uploadedDokumen.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">File terupload:</p>
                    <div className="space-y-1">
                      {uploadedDokumen.map((url) => (
                        <div key={url} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
                          <div className="min-w-0 pr-2">
                            <div className="truncate font-medium">{docTitle(url)}</div>
                            <div className="truncate text-muted-foreground">{url}</div>
                          </div>
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => {
                              const nextUploaded = uploadedDokumen.filter((v) => v !== url)
                              setUploadedDokumen(nextUploaded)
                              syncDokumenValue(dokumenText, nextUploaded)
                            }}
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Bisa untuk KTP, KK, foto rumah, surat usaha, bukti lain.</p>
                {errors.dokumenUrls && <p className="text-xs text-red-500">Dokumen pendukung tidak valid.</p>}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between pt-4">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="size-4" /> Sebelumnya
            </Button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
              Berikutnya <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isPending}>
              <Save className="size-4" /> {isPending ? "Menyimpan..." : "Simpan Nasabah"}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
