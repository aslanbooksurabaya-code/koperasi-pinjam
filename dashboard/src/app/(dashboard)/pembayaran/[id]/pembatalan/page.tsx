import Link from "next/link"
import { notFound } from "next/navigation"
import { getPembatalanApprovalList, getPembayaranById } from "@/actions/pembayaran"
import { auth } from "@/lib/auth"
import { hasAnyRole } from "@/lib/roles"
import { RoleType } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApprovalActionButtons, RequestPembatalanForm } from "./pembatalan-actions"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function statusBadge(status: string) {
  if (status === "PENDING") return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
  if (status === "APPROVED") return <Badge className="bg-emerald-100 text-emerald-700">Approved</Badge>
  return <Badge className="bg-red-100 text-red-700">Rejected</Badge>
}

export default async function PembatalanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [session, pembayaran] = await Promise.all([auth(), getPembayaranById(id)])
  if (!session) notFound()
  if (!pembayaran) notFound()

  const approvalList = await getPembatalanApprovalList(id)
  const hasPending = approvalList.some((item) => item.status === "PENDING")
  const canApprove = hasAnyRole(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pembatalan Pembayaran</h1>
          <p className="text-sm text-muted-foreground">Flow approval manager untuk pembatalan transaksi pembayaran</p>
        </div>
        <Link href="/pembayaran">
          <Button variant="outline">Kembali</Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Detail Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Nasabah</p>
            <p className="font-medium">{pembayaran.pinjaman.pengajuan.nasabah.namaLengkap}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Nomor Kontrak</p>
            <p className="font-mono text-xs">{pembayaran.pinjaman.nomorKontrak}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Bayar</p>
            <p className="font-semibold">{fmt(Number(pembayaran.totalBayar))}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tanggal Bayar</p>
            <p>{new Date(pembayaran.tanggalBayar).toLocaleString("id-ID")}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Input Oleh</p>
            <p>{pembayaran.inputOleh.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <p>{pembayaran.isBatalkan ? "Sudah dibatalkan" : "Aktif"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pengajuan Pembatalan</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestPembatalanForm pembayaranId={pembayaran.id} disabled={pembayaran.isBatalkan || hasPending} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Riwayat Approval Pembatalan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Waktu</TableHead>
                <TableHead>Peminta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="w-[160px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvalList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada pengajuan pembatalan.
                  </TableCell>
                </TableRow>
              ) : (
                approvalList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">{new Date(item.createdAt).toLocaleString("id-ID")}</TableCell>
                    <TableCell>{item.requestedBy.name}</TableCell>
                    <TableCell>{statusBadge(item.status)}</TableCell>
                    <TableCell className="max-w-sm whitespace-pre-wrap text-sm">{item.catatan ?? "-"}</TableCell>
                    <TableCell>
                      {item.status === "PENDING" ? (
                        <ApprovalActionButtons approvalId={item.id} disabled={!canApprove || pembayaran.isBatalkan} />
                      ) : (
                        <span className="text-xs text-muted-foreground">{item.approvedBy?.name ?? "-"}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
