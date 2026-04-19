"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { approvePembatalanPembayaran, requestPembatalanPembayaran } from "@/actions/pembayaran"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export function RequestPembatalanForm({ pembayaranId, disabled }: { pembayaranId: string; disabled: boolean }) {
  const [alasan, setAlasan] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const submit = () => {
    if (!alasan.trim() || alasan.trim().length < 5) {
      toast.error("Alasan minimal 5 karakter.")
      return
    }

    startTransition(async () => {
      const result = await requestPembatalanPembayaran({
        pembayaranId,
        alasan: alasan.trim(),
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Permintaan pembatalan berhasil diajukan.")
      setAlasan("")
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={alasan}
        onChange={(e) => setAlasan(e.target.value)}
        placeholder="Tulis alasan pembatalan pembayaran..."
        disabled={disabled || isPending}
      />
      <Button onClick={submit} disabled={disabled || isPending} className="w-full sm:w-auto">
        {isPending ? "Memproses..." : "Ajukan Pembatalan"}
      </Button>
    </div>
  )
}

export function ApprovalActionButtons({ approvalId, disabled }: { approvalId: string; disabled: boolean }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const process = (action: "APPROVE" | "REJECT") => {
    const catatan = prompt(action === "APPROVE" ? "Catatan approval (opsional):" : "Catatan penolakan (opsional):")
    startTransition(async () => {
      const result = await approvePembatalanPembayaran({
        approvalId,
        action,
        catatan: catatan ?? undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(action === "APPROVE" ? "Pembatalan disetujui." : "Permintaan pembatalan ditolak.")
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={() => process("APPROVE")} disabled={disabled || isPending}>
        Setujui
      </Button>
      <Button size="sm" variant="outline" onClick={() => process("REJECT")} disabled={disabled || isPending}>
        Tolak
      </Button>
    </div>
  )
}
