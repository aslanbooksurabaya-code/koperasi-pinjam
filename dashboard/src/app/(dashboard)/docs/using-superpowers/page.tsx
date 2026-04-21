import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata = {
  title: "Panduan Agent",
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Step {n}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        </div>
        <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 border-0">
          using-superpowers
        </Badge>
      </div>
      <Separator className="my-3 bg-slate-100 dark:bg-slate-800" />
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  )
}

export default function UsingSuperpowersDocPage() {
  return (
    <div className="p-6 space-y-6">
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Panduan Penggunaan `$using-superpowers`</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
                Tujuannya: agent selalu cek skill dulu sebelum melakukan apa pun, supaya workflow konsisten dan tidak “langsung nembak” tanpa aturan repo.
              </p>
            </div>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Untuk user
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4 text-sm text-muted-foreground">
            Versi markdown lengkap ada di `dashboard/USING-SUPERPOWERS.md` (lebih enak dibaca, bisa dipakai sebagai template prompt).
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Step n={1} title="Mulai dengan menyebut skill-nya">
          <p>
            Di awal prompt, tulis <span className="font-mono text-xs">`$using-superpowers`</span> atau <span className="font-mono text-xs">`using-superpowers`</span>.
            Ini sinyal ke agent: “cek dan pakai skill sebelum tindakan apa pun”.
          </p>
          <p className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-muted/20 p-3 font-mono text-xs text-slate-700 dark:text-slate-300">
            $using-superpowers{"\n\n"}
            Tolong buat page baru /roadmap…
          </p>
        </Step>

        <Step n={2} title="Tulis output yang diinginkan (jelas)">
          <p>
            Sebutkan: route, komponen/menu yang harus ditambah, dan file doc yang harus dibuat.
            Kalau ada batasan: tulis eksplisit (contoh: “jangan refactor modul lain”).
          </p>
        </Step>

        <Step n={3} title="Kirim konteks minimum yang membantu">
          <p>
            Jika ada contoh UI yang ingin ditiru, sebut route/file rujukan.
            Jika ingin format tertentu (checklist, kategori, status), tulis kriterianya.
          </p>
        </Step>

        <Step n={4} title="Minta verifikasi yang Anda butuhkan">
          <p>
            Contoh: “jalankan lint”, “pastikan route bisa diakses”, “tambahkan link di sidebar”.
            Jika Anda ingin tanpa test dulu, tulis: “jangan jalankan build/test”.
          </p>
        </Step>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Template Prompt (copy)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <pre className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-4 text-xs overflow-auto">
{`$using-superpowers

Tujuan:
- (contoh) Tambah page /roadmap + checklist fitur
- Tambah menu di sidebar
- Buat doc step-by-step untuk user

Output yang harus ada:
- Route: /roadmap
- Route: /docs/using-superpowers (bila perlu)
- File doc: dashboard/USING-SUPERPOWERS.md

Batasan:
- Jangan refactor modul lain
- Fokus hanya file yang diperlukan

Verifikasi:
- Jalankan lint setelah selesai`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

