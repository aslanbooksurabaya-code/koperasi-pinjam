"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { approvePengajuan } from "@/actions/pengajuan"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { CheckCircle, XCircle } from "lucide-react"

export function ApprovalForm({ pengajuanId, plafonDiajukan }: { pengajuanId: string; plafonDiajukan: number }) {
  const [isPending, startTransition] = useTransition()
  const [plafonDisetujui, setPlafonDisetujui] = useState(plafonDiajukan)
  const [catatan, setCatatan] = useState("")
  const router = useRouter()

  function fmt(n: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
  }

  const handleAction = (aksi: "SETUJU" | "TOLAK") => {
    if (aksi === "SETUJU" && !plafonDisetujui) {
      toast.error("Isi plafon yang disetujui")
      return
    }
    startTransition(async () => {
      const result = await approvePengajuan({ pengajuanId, aksi, plafonDisetujui, catatanApproval: catatan })
      if (result.error) {
        toast.error(typeof result.error === "string" ? result.error : "Gagal memproses approval")
        return
      }
      toast.success(aksi === "SETUJU" ? "Pengajuan berhasil disetujui!" : "Pengajuan ditolak.")
      router.refresh()
    })
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-blue-900">Form Approval</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Plafon yang Disetujui</Label>
          <Input
            type="number"
            value={plafonDisetujui}
            onChange={(e) => setPlafonDisetujui(Number(e.target.value))}
            className="bg-white"
          />
          <p className="text-xs text-blue-700">{fmt(plafonDisetujui)}</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Catatan (opsional)</Label>
          <Textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={2}
            placeholder="Alasan disetujui atau ditolak..."
            className="bg-white text-xs"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleAction("SETUJU")}
            disabled={isPending}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
          >
            <CheckCircle className="size-3" /> Setujui
          </Button>
          <Button
            onClick={() => handleAction("TOLAK")}
            disabled={isPending}
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 text-xs h-8"
          >
            <XCircle className="size-3" /> Tolak
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
