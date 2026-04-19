"use client"

import { useState, useTransition } from "react"
import { createAccount } from "@/actions/akuntansi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export function AccountCreateForm() {
  const [isPending, startTransition] = useTransition()
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState<"ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE">("EXPENSE")

  const submit = () => {
    startTransition(async () => {
      const res = await createAccount({ code, name, type })
      if (!res.success) {
        const err = "error" in res ? res.error : null
        toast.error(typeof err === "string" ? err : "Gagal menambah akun.")
        return
      }
      toast.success("Akun berhasil ditambahkan.")
      setCode("")
      setName("")
      setType("EXPENSE")
      window.location.reload()
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Tambah Akun</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Kode Akun</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: BEBAN_ATK" />
          <p className="text-xs text-muted-foreground">Kode akan dinormalisasi menjadi huruf besar dan underscore.</p>
        </div>
        <div className="space-y-2">
          <Label>Nama Akun</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Beban ATK" />
        </div>
        <div className="space-y-2">
          <Label>Tipe Akun</Label>
          <Select value={type} onValueChange={(v) => setType((v as typeof type) ?? "EXPENSE")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ASSET">Asset</SelectItem>
              <SelectItem value="LIABILITY">Liability</SelectItem>
              <SelectItem value="EQUITY">Equity</SelectItem>
              <SelectItem value="REVENUE">Revenue</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button disabled={isPending} onClick={submit} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {isPending ? "Menyimpan..." : "Tambah Akun"}
        </Button>
      </CardContent>
    </Card>
  )
}

