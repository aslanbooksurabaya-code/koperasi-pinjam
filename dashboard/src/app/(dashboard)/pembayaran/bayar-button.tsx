"use client"

import { useTransition } from "react"
import { inputPembayaran } from "@/actions/pembayaran"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CheckCircle, Coins, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export function BayarButton({ jadwalId, total }: { jadwalId: string; total: number }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const runPayment = (mode: "FULL" | "PARSIAL" | "PELUNASAN") => {
    let jumlahBayar: number | undefined
    const metode = (prompt("Metode bayar: TUNAI / TRANSFER", "TUNAI") ?? "TUNAI").toUpperCase() as "TUNAI" | "TRANSFER"
    if (metode !== "TUNAI" && metode !== "TRANSFER") {
      toast.error("Metode bayar hanya boleh TUNAI atau TRANSFER.")
      return
    }

    const buktiBayarUrl = prompt("URL bukti bayar (opsional, kosongkan jika tidak ada)", "") ?? ""

    if (mode === "PARSIAL") {
      const raw = prompt(`Masukkan jumlah bayar parsial (maks ${fmt(total)})`, Math.floor(total / 2).toString())
      if (!raw) return
      jumlahBayar = Number(raw.replace(/[^\d]/g, ""))
      if (!Number.isFinite(jumlahBayar) || jumlahBayar <= 0) {
        toast.error("Jumlah bayar parsial tidak valid.")
        return
      }
    }

    const modeLabel = mode === "FULL" ? "pembayaran penuh" : mode === "PARSIAL" ? "pembayaran parsial" : "pelunasan dipercepat"
    if (!confirm(`Konfirmasi ${modeLabel}?`)) return

    startTransition(async () => {
      const result = await inputPembayaran({
        jadwalAngsuranId: jadwalId,
        mode,
        jumlahBayar,
        metode,
        buktiBayarUrl: buktiBayarUrl.trim() || undefined,
      })
      if (!("success" in result) || !result.success) {
        toast.error("error" in result ? result.error : "Gagal memproses pembayaran.")
        return
      }
      const dendaInfo = result.denda > 0 ? ` (denda ${fmt(result.denda)})` : ""
      toast.success(`Pembayaran ${modeLabel} berhasil${dendaInfo}.`)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        onClick={() => runPayment("FULL")}
        disabled={isPending}
        className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs gap-1"
      >
        <CheckCircle className="size-3" />
        {isPending ? "..." : "Penuh"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => runPayment("PARSIAL")}
        disabled={isPending}
        className="h-7 text-xs gap-1"
      >
        <Coins className="size-3" />
        Parsial
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => runPayment("PELUNASAN")}
        disabled={isPending}
        className="h-7 text-xs gap-1"
      >
        <Wallet className="size-3" />
        Lunas
      </Button>
    </div>
  )
}
