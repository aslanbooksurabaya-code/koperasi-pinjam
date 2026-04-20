"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateAccountingMode } from "@/actions/settings"
import type { AccountingMode } from "@/lib/accounting-mode"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const accountingModeOptions: { value: AccountingMode; label: string }[] = [
  { value: "SIMPLE", label: "Simple" },
  { value: "PROPER", label: "Proper" },
]

export function AccountingModeCard({
  initialMode,
  canEdit,
}: {
  initialMode: AccountingMode
  canEdit: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<AccountingMode>(initialMode)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mode Akuntansi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Pilih mode akuntansi yang digunakan oleh aplikasi. Simple untuk pencatatan ringkas, Proper
          untuk pencatatan akuntansi yang lebih lengkap.
        </p>

        <div className="space-y-2 max-w-sm">
          <Label>Mode Akuntansi</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as AccountingMode)} disabled={!canEdit}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih mode akuntansi..." />
            </SelectTrigger>
            <SelectContent>
              {accountingModeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Mode baru akan aktif setelah halaman dimuat ulang.
            {!canEdit ? " Hanya Admin yang dapat mengubah pengaturan ini." : ""}
          </p>
        </div>

        {canEdit ? (
          <Button
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              startTransition(async () => {
                const res = await updateAccountingMode(mode)
                if (res?.error) {
                  toast.error(typeof res.error === "string" ? res.error : "Gagal menyimpan mode akuntansi.")
                  return
                }
                toast.success("Mode akuntansi tersimpan. Muat ulang halaman untuk menerapkan mode baru.")
              })
            }}
          >
            {isPending ? "Menyimpan..." : "Simpan Mode Akuntansi"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
