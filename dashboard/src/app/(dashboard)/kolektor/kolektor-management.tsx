"use client"

import { useState, useTransition } from "react"
import {
  createKolektorFromKetuaKelompok,
  createKolektorFromNasabah,
  createKolektorManual,
} from "@/actions/kolektor"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { UserCog, UserPlus, Users, ShieldCheck, Mail, Shield } from "lucide-react"

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
    <div className="p-6 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Kolektor & Role</h1>
        <p className="text-muted-foreground text-sm">Kelola hak akses petugas lapangan dan administrator sistem.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50">
            <div className="flex items-center gap-2 mb-1">
               <UserPlus className="size-4 text-primary" />
               <CardTitle className="text-base font-semibold">Input Manual</CardTitle>
            </div>
            <CardDescription>Tambah petugas baru secara langsung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama Lengkap</Label>
              <Input value={manualName} onChange={(e) => setManualName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email</Label>
              <Input type="email" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Password Sementara</Label>
              <Input value={manualPassword} onChange={(e) => setManualPassword(e.target.value)} />
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
               <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer">
                 <input type="checkbox" className="size-4 rounded-md border-slate-300 text-primary focus:ring-primary/20" checked={manualAdmin} onChange={(e) => setManualAdmin(e.target.checked)} /> 
                 Tambah role ADMIN
               </label>
            </div>
            <Button disabled={isPending} className="w-full h-10 font-bold uppercase tracking-widest text-[10px]" onClick={() => run(() => createKolektorManual({ name: manualName, email: manualEmail, password: manualPassword, isAdmin: manualAdmin }))}>Simpan Kolektor</Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50">
            <div className="flex items-center gap-2 mb-1">
               <Users className="size-4 text-primary" />
               <CardTitle className="text-base font-semibold">Promosi Nasabah</CardTitle>
            </div>
            <CardDescription>Jadikan nasabah aktif sebagai petugas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pilih Nasabah</Label>
              <select className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900" value={nasabahId} onChange={(e) => setNasabahId(e.target.value)}>
                <option value="">Pilih nasabah...</option>
                {sumberOptions.nasabah.map((n) => (
                  <option key={n.id} value={n.id}>{n.namaLengkap}</option>
                ))}
              </select>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
               <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer">
                 <input type="checkbox" className="size-4 rounded-md border-slate-300 text-primary focus:ring-primary/20" checked={nasabahAdmin} onChange={(e) => setNasabahAdmin(e.target.checked)} /> 
                 Tambah role ADMIN
               </label>
            </div>
            <Button disabled={isPending || !nasabahId} className="w-full h-10 font-bold uppercase tracking-widest text-[10px]" onClick={() => run(() => createKolektorFromNasabah({ nasabahId, isAdmin: nasabahAdmin }))}>Jadikan Kolektor</Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50">
            <div className="flex items-center gap-2 mb-1">
               <ShieldCheck className="size-4 text-primary" />
               <CardTitle className="text-base font-semibold">Promosi Ketua</CardTitle>
            </div>
            <CardDescription>Tetapkan ketua kelompok sebagai petugas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pilih Kelompok</Label>
              <select className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900" value={kelompokId} onChange={(e) => setKelompokId(e.target.value)}>
                <option value="">Pilih kelompok...</option>
                {sumberOptions.kelompok.map((k) => (
                  <option key={k.id} value={k.id}>{k.kode} - {k.nama}</option>
                ))}
              </select>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
               <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer">
                 <input type="checkbox" className="size-4 rounded-md border-slate-300 text-primary focus:ring-primary/20" checked={kelompokAdmin} onChange={(e) => setKelompokAdmin(e.target.checked)} /> 
                 Tambah role ADMIN
               </label>
            </div>
            <Button disabled={isPending || !kelompokId} className="w-full h-10 font-bold uppercase tracking-widest text-[10px]" onClick={() => run(() => createKolektorFromKetuaKelompok({ kelompokId, isAdmin: kelompokAdmin }))}>Tetapkan Kolektor Kelompok</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
            <CardTitle className="text-base font-semibold">Kolektor Lapangan</CardTitle>
            <CardDescription>Daftar petugas yang aktif melakukan penagihan</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nama Petugas</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Nasabah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialKolektor.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold tracking-tight text-slate-900 dark:text-slate-200">{k.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{k.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex gap-1.5 flex-wrap">
                         {k.roles.map((r) => (
                           <Badge key={r} className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0 h-5 px-1.5 text-[9px] font-black uppercase tracking-tight rounded-md">{r}</Badge>
                         ))}
                       </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <span className="text-sm font-bold tracking-tight text-primary">{k.totalNasabah.toLocaleString("id-ID")}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
            <CardTitle className="text-base font-semibold">Semua User & Role</CardTitle>
            <CardDescription>Daftar semua akun yang memiliki akses ke dashboard</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Daftar Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleTable.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                       <div className="flex flex-col">
                         <span className="font-bold tracking-tight text-slate-900 dark:text-slate-200">{u.name}</span>
                         <span className="text-[10px] text-muted-foreground font-medium">{u.email}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${u.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"} border-0 text-[10px] font-bold h-5 uppercase tracking-wide px-2`}>
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <div className="flex gap-1.5 flex-wrap">
                         {u.roles.map((r) => (
                           <Badge key={r} variant="outline" className="border-slate-200 dark:border-slate-800 h-5 px-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-tight rounded-md">{r}</Badge>
                         ))}
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
