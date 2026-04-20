"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateCompanyInfo, type CompanyInfo } from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TIME_ZONE_OPTIONS, DEFAULT_TIME_ZONE } from "@/lib/datetime"

async function fileToDataUrl(file: File): Promise<string> {
  const maxBytes = 600 * 1024 // ~600KB
  if (file.size > maxBytes) {
    throw new Error("Ukuran logo terlalu besar. Maksimal 600KB.")
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("File logo harus berupa gambar (PNG/JPG/SVG).")
  }

  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Gagal membaca file logo."))
    reader.readAsDataURL(file)
  })
}

export function CompanySettingsForm({ initial }: { initial: CompanyInfo }) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<CompanyInfo>(initial)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Company Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Informasi ini digunakan untuk kop dokumen/print (logo & identitas) dan branding aplikasi.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nama Perusahaan / Koperasi</Label>
            <Input
              id="company-name"
              value={form.name ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="Contoh: Koperasi Simpan Pinjam"
            />
          </div>

          <div className="space-y-2">
            <Label>Zona Waktu</Label>
            <Select
              value={form.timeZone ?? DEFAULT_TIME_ZONE}
              onValueChange={(v) => setForm((s) => ({ ...s, timeZone: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih zona waktu..." />
              </SelectTrigger>
              <SelectContent>
                {TIME_ZONE_OPTIONS.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Default: WIB (UTC+7). Digunakan untuk format tanggal & jam di aplikasi.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-tagline">Tagline (opsional)</Label>
            <Input
              id="company-tagline"
              value={form.tagline ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, tagline: e.target.value }))}
              placeholder="Contoh: Sistem Informasi Manajemen Koperasi"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="company-address">Alamat (opsional)</Label>
            <Textarea
              id="company-address"
              value={form.address ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
              placeholder="Alamat lengkap untuk ditampilkan di dokumen"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-phone">Telepon (opsional)</Label>
            <Input
              id="company-phone"
              value={form.phone ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
              placeholder="Contoh: 0812xxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-email">Email (opsional)</Label>
            <Input
              id="company-email"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              placeholder="Contoh: admin@koperasi.co.id"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="company-website">Website (opsional)</Label>
            <Input
              id="company-website"
              value={form.website ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))}
              placeholder="Contoh: https://koperasi.co.id"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="company-logo">Logo (opsional)</Label>
            <div className="flex flex-col gap-3 rounded-md border bg-muted/20 p-3">
              {form.logoDataUrl ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.logoDataUrl}
                    alt="Logo"
                    className="h-12 w-12 rounded-md border bg-white object-contain p-1"
                  />
                  <div className="flex-1 text-xs text-muted-foreground">
                    Logo akan muncul di kop dokumen print.
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm((s) => ({ ...s, logoDataUrl: "" }))}
                  >
                    Hapus
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Belum ada logo. Upload PNG/JPG/SVG (maks 600KB).
                </div>
              )}

              <Input
                id="company-logo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  startTransition(async () => {
                    try {
                      const dataUrl = await fileToDataUrl(file)
                      setForm((s) => ({ ...s, logoDataUrl: dataUrl }))
                      toast.success("Logo siap disimpan.")
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Gagal memproses logo.")
                    } finally {
                      e.target.value = ""
                    }
                  })
                }}
              />
            </div>
          </div>
        </div>

        <Button
          disabled={isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => {
            startTransition(async () => {
              const res = await updateCompanyInfo(form)
              if (res?.error) {
                toast.error(typeof res.error === "string" ? res.error : "Gagal menyimpan pengaturan.")
                return
              }
              toast.success("Company information tersimpan.")
            })
          }}
        >
          {isPending ? "Menyimpan..." : "Simpan Company Information"}
        </Button>
      </CardContent>
    </Card>
  )
}
