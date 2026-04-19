"use client"

import { useTransition } from "react"
import { inputPembayaran } from "@/actions/pembayaran"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export function BayarButton({ jadwalId, total }: { jadwalId: string; total: number }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleBayar = () => {
    if (!confirm(`Konfirmasi pembayaran sebesar ${fmt(total)}?`)) return
    startTransition(async () => {
      const result = await inputPembayaran({
        jadwalAngsuranId: jadwalId,
        metode: "TUNAI",
      })
      if (result.error) {
        toast.error(result.error as string)
        return
      }
      toast.success(`Pembayaran berhasil! ${result.denda && result.denda > 0 ? `Termasuk denda ${fmt(result.denda)}` : ""}`)
      router.refresh()
    })
  }

  return (
    <Button
      size="sm"
      onClick={handleBayar}
      disabled={isPending}
      className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs gap-1"
    >
      <CheckCircle className="size-3" />
      {isPending ? "..." : "Bayar"}
    </Button>
  )
}
