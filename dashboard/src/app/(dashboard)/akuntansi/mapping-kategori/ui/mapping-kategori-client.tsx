"use client"

import { useMemo, useState, useTransition } from "react"
import { updateKasKategoriMapping } from "@/actions/akuntansi"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type AccountRow = {
  id: string
  code: string
  name: string
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
}

type KategoriRow = {
  id: string
  nama: string
  key: string
  jenis: "MASUK" | "KELUAR"
  accountId: string | null
  account: AccountRow | null
}

export function MappingKategoriClient({
  initial,
}: {
  initial: {
    accounts: AccountRow[]
    kategori: KategoriRow[]
  }
}) {
  const [isPending, startTransition] = useTransition()
  const [rows, setRows] = useState<KategoriRow[]>(initial.kategori)

  const groupedAccounts = useMemo(() => {
    const groups: Record<string, AccountRow[]> = { ASSET: [], LIABILITY: [], EQUITY: [], REVENUE: [], EXPENSE: [] }
    for (const a of initial.accounts) groups[a.type].push(a)
    return groups
  }, [initial.accounts])

  const setMapping = (kategoriId: string, accountId: string | null) => {
    startTransition(async () => {
      const res = await updateKasKategoriMapping({ kategoriId, accountId })
      if (!res.success) {
        const err = "error" in res ? res.error : null
        toast.error(typeof err === "string" ? err : "Gagal menyimpan mapping.")
        return
      }
      toast.success("Mapping tersimpan.")
      setRows((prev) =>
        prev.map((r) =>
          r.id === kategoriId
            ? {
                ...r,
                accountId: res.data.accountId,
                account: res.data.account
                  ? {
                      id: res.data.account.id,
                      code: res.data.account.code,
                      name: res.data.account.name,
                      type: res.data.account.type,
                    }
                  : null,
              }
            : r
        )
      )
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Rekomendasi: kategori kas masuk dipetakan ke akun revenue/liability; kategori kas keluar dipetakan ke akun expense/asset.
      </p>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Jenis</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Akun</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((k) => (
            <TableRow key={k.id} className="hover:bg-muted/30">
              <TableCell>
                <Badge className={k.jenis === "MASUK" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                  {k.jenis}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{k.nama}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{k.key}</TableCell>
              <TableCell className="min-w-[18rem]">
                <Select
                  value={k.accountId ?? "__NONE__"}
                  onValueChange={(v) => {
                    if (v === "__NONE__" || !v) {
                      setMapping(k.id, null)
                      return
                    }
                    setMapping(k.id, v)
                  }}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih akun..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">Belum dipetakan</SelectItem>
                    {(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"] as const).map((t) => (
                      groupedAccounts[t].length === 0 ? null : (
                        <div key={t}>
                          <div className="px-2 py-1 text-xs text-muted-foreground">{t}</div>
                          {groupedAccounts[t].map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.code} · {a.name}
                            </SelectItem>
                          ))}
                        </div>
                      )
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

