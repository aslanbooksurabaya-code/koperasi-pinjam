"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateRankingConfig } from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { RankingConfig } from "@/lib/ranking"

export function RankingSettingsForm({ initial }: { initial: RankingConfig }) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<RankingConfig>(initial)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pengaturan Ranking Risiko</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Mengatur batasan ranking A/B/C/D berdasarkan jumlah angsuran telat dan nominal tunggakan.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bMaxTelat">B: Maks Telat (angsuran)</Label>
            <Input
              id="bMaxTelat"
              type="number"
              min={0}
              value={form.bMaxTelat}
              onChange={(e) => setForm((s) => ({ ...s, bMaxTelat: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bMaxTunggakan">B: Maks Tunggakan (Rp)</Label>
            <Input
              id="bMaxTunggakan"
              type="number"
              min={0}
              value={form.bMaxTunggakan}
              onChange={(e) => setForm((s) => ({ ...s, bMaxTunggakan: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cMaxTelat">C: Maks Telat (angsuran)</Label>
            <Input
              id="cMaxTelat"
              type="number"
              min={0}
              value={form.cMaxTelat}
              onChange={(e) => setForm((s) => ({ ...s, cMaxTelat: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cMaxTunggakan">C: Maks Tunggakan (Rp)</Label>
            <Input
              id="cMaxTunggakan"
              type="number"
              min={0}
              value={form.cMaxTunggakan}
              onChange={(e) => setForm((s) => ({ ...s, cMaxTunggakan: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
          <div>A: telat = 0 dan tunggakan = 0</div>
          <div>B: telat ≤ B.maksTelat dan tunggakan &lt; B.maksTunggakan</div>
          <div>C: telat ≤ C.maksTelat dan tunggakan &lt; C.maksTunggakan</div>
          <div>D: selain itu</div>
        </div>

        <Button
          disabled={isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => {
            startTransition(async () => {
              const res = await updateRankingConfig(form)
              if (res?.error) {
                toast.error(typeof res.error === "string" ? res.error : "Gagal menyimpan pengaturan.")
                return
              }
              toast.success("Pengaturan ranking tersimpan.")
            })
          }}
        >
          {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </CardContent>
    </Card>
  )
}
