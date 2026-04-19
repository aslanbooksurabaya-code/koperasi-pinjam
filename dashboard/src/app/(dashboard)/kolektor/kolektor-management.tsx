"use client"

import { useState, useTransition } from "react"
import {
  createKolektorFromKetuaKelompok,
  createKolektorFromNasabah,
  createKolektorManual,
} from "@/actions/kolektor"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

type Props = {
  initialKolektor: {
    id: string
    name: string
    email: string
    roles: string[]
    totalNasabah: number
  }[]
  sumberOptions: {
    nasabah: { id: string; namaLengkap: string; noHp: string }[]
    kelompok: { id: string; kode: string; nama: string; ketua: string | null }[]
  }
  roleTable: {
    id: string
    name: string
    email: string
    isActive: boolean
    roles: string[]
  }[]
}

export function KolektorManagement({ initialKolektor, sumberOptions, roleTable }: Props) {
  const [isPending, startTransition] = useTransition()
  const [manualName, setManualName] = useState("")
  const [manualEmail, setManualEmail] = useState("")
  const [manualPassword, setManualPassword] = useState("Kolektor123")
  const [manualAdmin, setManualAdmin] = useState(false)

  const [nasabahId, setNasabahId] = useState("")
  const [nasabahAdmin, setNasabahAdmin] = useState(false)

  const [kelompokId, setKelompokId] = useState("")
  const [kelompokAdmin, setKelompokAdmin] = useState(false)

  const run = (fn: () => Promise<{ success?: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await fn()
      if (!result?.success) {
        toast.error(result?.error ?? "Gagal memproses data kolektor.")
        return
      }
      toast.success("Data kolektor berhasil diperbarui.")
      window.location.reload()
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daftar Kolektor</h1>
        <p className="text-muted-foreground text-sm">Tambah kolektor dari nasabah, ketua kelompok, atau input manual. Dapat sekaligus assign role admin.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Manual Input</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2"><Label>Nama</Label><Input value={manualName} onChange={(e) => setManualName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label>Password</Label><Input value={manualPassword} onChange={(e) => setManualPassword(e.target.value)} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={manualAdmin} onChange={(e) => setManualAdmin(e.target.checked)} /> Tambah juga role ADMIN</label>
            <Button disabled={isPending} className="w-full" onClick={() => run(() => createKolektorManual({ name: manualName, email: manualEmail, password: manualPassword, isAdmin: manualAdmin }))}>Simpan Kolektor</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Dari Nasabah</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Pilih Nasabah</Label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={nasabahId} onChange={(e) => setNasabahId(e.target.value)}>
                <option value="">Pilih nasabah...</option>
                {sumberOptions.nasabah.map((n) => (
                  <option key={n.id} value={n.id}>{n.namaLengkap}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={nasabahAdmin} onChange={(e) => setNasabahAdmin(e.target.checked)} /> Tambah juga role ADMIN</label>
            <Button disabled={isPending || !nasabahId} className="w-full" onClick={() => run(() => createKolektorFromNasabah({ nasabahId, isAdmin: nasabahAdmin }))}>Jadikan Kolektor</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Dari Ketua Kelompok</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Pilih Kelompok</Label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={kelompokId} onChange={(e) => setKelompokId(e.target.value)}>
                <option value="">Pilih kelompok...</option>
                {sumberOptions.kelompok.map((k) => (
                  <option key={k.id} value={k.id}>{k.kode} - {k.nama}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={kelompokAdmin} onChange={(e) => setKelompokAdmin(e.target.checked)} /> Tambah juga role ADMIN</label>
            <Button disabled={isPending || !kelompokId} className="w-full" onClick={() => run(() => createKolektorFromKetuaKelompok({ kelompokId, isAdmin: kelompokAdmin }))}>Tetapkan Kolektor Kelompok</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Kolektor Aktif</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Nasabah Ditangani</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialKolektor.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.name}</TableCell>
                  <TableCell className="text-xs">{k.email}</TableCell>
                  <TableCell className="space-x-1">{k.roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}</TableCell>
                  <TableCell className="text-right">{k.totalNasabah.toLocaleString("id-ID")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Tabel User Role</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roleTable.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell>
                    <Badge className={u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}>
                      {u.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-1">{u.roles.map((r) => <Badge key={r} variant="outline">{r}</Badge>)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
