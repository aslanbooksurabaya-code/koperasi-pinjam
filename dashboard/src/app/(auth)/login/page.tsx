"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setIsLoading(true)
    setError("")
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    setIsLoading(false)
    if (res?.error) {
      setError("Email atau password salah.")
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-800 to-emerald-600 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-xl p-2">
            <Building2 className="size-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight">KoperasiApp</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Sistem Informasi<br />Koperasi Simpan Pinjam
          </h1>
          <p className="text-emerald-100 text-lg leading-relaxed">
            Kelola nasabah, pinjaman, angsuran, dan laporan keuangan koperasi Anda dengan mudah, aman, dan terpercaya.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: "Nasabah Aktif", value: "1.2K+" },
              { label: "Pinjaman", value: "840+" },
              { label: "Akurasi Data", value: "99.9%" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-emerald-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-emerald-200 text-sm">© 2024 KoperasiApp. All rights reserved.</p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="bg-emerald-600 rounded-xl p-2 text-white">
              <Building2 className="size-6" />
            </div>
            <span className="text-xl font-bold">KoperasiApp</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight">Selamat Datang</h2>
            <p className="text-muted-foreground mt-2">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@koperasi.id"
                    autoComplete="email"
                    {...register("email")}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...register("password")}
                      className={errors.password ? "border-destructive pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading} size="lg">
                  {isLoading && <Loader2 className="size-4 animate-spin" />}
                  {isLoading ? "Masuk..." : "Masuk"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Demo:</span>{" "}
            admin@koperasi.id / admin123
          </p>
        </div>
      </div>
    </div>
  )
}
