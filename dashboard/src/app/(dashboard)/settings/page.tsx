import { auth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Shield, User, Mail, Phone } from "lucide-react"
import { getRankingConfig } from "@/actions/settings"
import { RankingSettingsForm } from "./ranking-settings-form"

const roleLabels: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Admin", color: "bg-purple-100 text-purple-700" },
  TELLER: { label: "Teller", color: "bg-blue-100 text-blue-700" },
  KOLEKTOR: { label: "Kolektor", color: "bg-green-100 text-green-700" },
  SURVEYOR: { label: "Surveyor", color: "bg-cyan-100 text-cyan-700" },
  MANAGER: { label: "Manager", color: "bg-amber-100 text-amber-700" },
  PIMPINAN: { label: "Pimpinan", color: "bg-red-100 text-red-700" },
  AKUNTANSI: { label: "Akuntansi", color: "bg-pink-100 text-pink-700" },
}

export default async function SettingsPage() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRoles: string[] = (session?.user as any)?.roles ?? []
  const rankingConfig = await getRankingConfig()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Akun</h1>
        <p className="text-muted-foreground text-sm">Kelola profil dan informasi akun Anda</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profil */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-4" /> Profil Saya
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarFallback className="text-xl bg-emerald-600 text-white">
                  {session?.user?.name?.[0] ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{session?.user?.name ?? "—"}</p>
                <p className="text-muted-foreground text-sm flex items-center gap-1">
                  <Mail className="size-3" /> {session?.user?.email ?? "—"}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Shield className="size-4 text-muted-foreground" /> Hak Akses (Role)
              </p>
              {userRoles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userRoles.map((role) => {
                    const r = roleLabels[role] ?? { label: role, color: "bg-gray-100 text-gray-700" }
                    return (
                      <Badge key={role} className={`${r.color} hover:${r.color} border-0`}>
                        {r.label}
                      </Badge>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Belum ada role yang ditetapkan.</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Role menentukan fitur apa yang dapat Anda akses. Hubungi Admin untuk mengubah role.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info panel */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm">Informasi Sistem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { label: "Versi Aplikasi", value: "1.0.0" },
              { label: "Database", value: "PostgreSQL (Supabase)" },
              { label: "Framework", value: "Next.js 15" },
              { label: "Status", value: "🟢 Online" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <RankingSettingsForm initial={rankingConfig} />
    </div>
  )
}
