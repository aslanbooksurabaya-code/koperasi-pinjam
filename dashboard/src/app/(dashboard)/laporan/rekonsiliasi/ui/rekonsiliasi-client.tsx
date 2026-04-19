"use client"

import { useState, useTransition } from "react"
import { createRekonsiliasiKas } from "@/actions/akuntansi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NumericFormat } from "react-number-format"
import { Upload } from "lucide-react"
import { toast } from "sonner"

type CashAccount = {
  id: string
  code: string
  name: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

export function RekonsiliasiClient({ cashAccounts }: { cashAccounts: CashAccount[] }) {
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [accountId, setAccountId] = useState(cashAccounts[0]?.id ?? "")
  const now = new Date()
  const [month, setMonth] = useState<number>(now.getMonth() + 1)
  const [year, setYear] = useState<number>(now.getFullYear())
  const [saldoStatement, setSaldoStatement] = useState<number>(0)
  const [catatan, setCatatan] = useState("")
  const [buktiUrl, setBuktiUrl] = useState("")

  const uploadBukti = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files.item(0)
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran file melebihi 5 MB.")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("files", file)
      const res = await fetch("/api/upload/kas", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error ?? "Upload bukti gagal.")
        return
      }
      const urls = (json?.urls as string[] | undefined) ?? []
      if (urls.length === 0) {
        toast.error("Upload bukti gagal.")
        return
      }
      setBuktiUrl(urls[0] ?? "")
      toast.success("Bukti berhasil diupload.")
    } catch {
      toast.error("Upload bukti gagal.")
    } finally {
      setIsUploading(false)
    }
  }

  const submit = () => {
    if (!accountId) {
      toast.error("Pilih akun kas terlebih dahulu.")
      return
    }
    startTransition(async () => {
      const res = await createRekonsiliasiKas({
        accountId,
        month,
        year,
        saldoStatement,
        catatan,
        ...(buktiUrl ? { buktiUrl } : {}),
      })
      if (!res.success) {
        const err = "error" in res ? res.error : null
        toast.error(typeof err === "string" ? err : "Gagal menyimpan rekonsiliasi.")
        return
      }
      toast.success("Rekonsiliasi tersimpan.")
      window.location.reload()
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Buat Rekonsiliasi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Akun Kas</Label>
          <Select value={accountId || "__NONE__"} onValueChange={(v) => setAccountId(v === "__NONE__" ? "" : (v ?? ""))}>
            <SelectTrigger><SelectValue placeholder="Pilih akun..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__NONE__">Pilih akun</SelectItem>
              {cashAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Bulan</Label>
            <NumericFormat
              customInput={Input}
              value={month}
              onValueChange={(v) => setMonth(Math.max(1, Math.min(12, v.floatValue ?? 1)))}
            />
          </div>
          <div className="space-y-2">
            <Label>Tahun</Label>
            <NumericFormat
              customInput={Input}
              value={year}
              onValueChange={(v) => setYear(v.floatValue ?? now.getFullYear())}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Saldo Statement</Label>
          <NumericFormat
            customInput={Input}
            thousandSeparator="."
            decimalSeparator=","
            value={saldoStatement || ""}
            onValueChange={(v) => setSaldoStatement(v.floatValue ?? 0)}
            placeholder="Contoh: 25.000.000"
          />
        </div>

        <div className="space-y-2">
          <Label>Catatan (opsional)</Label>
          <Input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan periode, nomor statement, dll." />
        </div>

        <div className="space-y-2">
          <Label>Bukti (opsional)</Label>
          <Input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            disabled={isUploading || isPending}
            onChange={(e) => {
              void uploadBukti(e.target.files)
              e.currentTarget.value = ""
            }}
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Upload className="size-3" /> {isUploading ? "Sedang upload..." : "Upload bukti (max 5MB)."}
          </p>
          {buktiUrl ? (
            <a href={buktiUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline break-all">
              {buktiUrl}
            </a>
          ) : null}
        </div>

        <Button disabled={isPending} onClick={submit} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {isPending ? "Menyimpan..." : "Simpan Rekonsiliasi"}
        </Button>
      </CardContent>
    </Card>
  )
}

