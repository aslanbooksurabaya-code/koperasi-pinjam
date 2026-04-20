import { getDashboardStats } from "@/actions/dashboard"
import Link from "next/link"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "./_components/dashboard-header"
import { ViewTransition } from "react"
import { getCompanyInfo } from "@/actions/settings"
import { formatTimeId, normalizeTimeZone } from "@/lib/datetime"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users, Banknote, TrendingUp, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Clock, UserPlus, ClipboardList,
  HandCoins, WalletCards, Layers3, BarChart3,
} from "lucide-react"

function fmt(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}Jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}Rb`
  return `Rp ${n.toLocaleString("id-ID")}`
}

function BarChart({ data }: { data: { bulan: string; masuk: number; keluar: number }[] }) {
  const max = Math.max(...data.flatMap((d) => [d.masuk, d.keluar]), 1)
  return (
    <div className="flex items-end gap-3 h-40 pt-2">
      {data.map((d) => (
        <div key={d.bulan} className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-end gap-0.5 w-full" style={{ height: "120px" }}>
            <div className="flex-1 bg-emerald-500 rounded-t-sm opacity-90 transition-all hover:opacity-100" style={{ height: `${(d.masuk / max) * 100}%` }} />
            <div className="flex-1 bg-rose-400 rounded-t-sm opacity-80 transition-all hover:opacity-100" style={{ height: `${(d.keluar / max) * 100}%` }} />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{d.bulan}</span>
        </div>
      ))}
    </div>
  )
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  const company = await getCompanyInfo()
  const timeZone = normalizeTimeZone(company.timeZone)

  const today = new Intl.DateTimeFormat("id-ID", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date())
  const currentTime = formatTimeId(new Date(), { timeZone })

  const surplusBulanIni = stats.arusKas6Bulan.at(-1)
  const surplusVal = (surplusBulanIni?.masuk ?? 0) - (surplusBulanIni?.keluar ?? 0)

  const statCards = [
    { title: "Total Nasabah Aktif", value: stats.totalNasabah.toLocaleString("id-ID"), change: "Nasabah aktif", trend: "up", icon: Users, color: "text-blue-600", bg: "bg-blue-50/80", id: "total-nasabah" },
    { title: "Pinjaman Aktif", value: stats.pinjamanAktif.toLocaleString("id-ID"), change: "Kontrak berjalan", trend: "up", icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50/80", id: "pinjaman-aktif" },
    { title: "Total Outstanding", value: fmt(stats.totalOutstanding), change: "Sisa pokok pinjaman", trend: "neutral", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50/80", id: "total-outstanding" },
    { title: "Total Tunggakan", value: fmt(stats.totalTunggakan), change: "Angsuran belum dibayar", trend: "down", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50/80", id: "total-tunggakan" },
  ]

  const quickMenus = [
    {
      title: "Tambah Nasabah",
      description: "Input anggota baru",
      href: "/nasabah/baru",
      icon: UserPlus,
      className: "from-sky-500 to-cyan-500",
      id: "tambah-nasabah",
    },
    {
      title: "Ajukan Pinjaman",
      description: "Buat pengajuan baru",
      href: "/pengajuan/baru",
      icon: ClipboardList,
      className: "from-emerald-500 to-teal-500",
      id: "ajukan-pinjaman",
    },
    {
      title: "Proses Pencairan",
      description: "Tindak lanjut pengajuan",
      href: "/pencairan",
      icon: HandCoins,
      className: "from-amber-500 to-orange-500",
      id: "proses-pencairan",
    },
    {
      title: "Catat Pembayaran",
      description: "Input angsuran masuk",
      href: "/pembayaran",
      icon: WalletCards,
      className: "from-violet-500 to-fuchsia-500",
      id: "catat-pembayaran",
    },
    {
      title: "Data Kelompok",
      description: "Kelola kelompok nasabah",
      href: "/kelompok",
      icon: Layers3,
      className: "from-slate-700 to-slate-900",
      id: "data-kelompok",
    },
    {
      title: "Laporan Kas",
      description: "Pantau laporan utama",
      href: "/laporan/arus-kas",
      icon: BarChart3,
      className: "from-rose-500 to-pink-500",
      id: "laporan-kas",
    },
  ]

  return (
    <div className="p-6 space-y-8">
      <DashboardHeader
        title="Dashboard Overview"
        description="Ringkasan cepat kondisi koperasi, arus kas, tunggakan, dan notifikasi penagihan hari ini."
        dateLabel={today}
        initialTimeLabel={currentTime}
        notificationCount={stats.penagihanHariIni}
      />

      {/* Quick Menu */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Quick Menu</CardTitle>
              <CardDescription>Akses cepat ke modul yang paling sering dipakai</CardDescription>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Fast access
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            {quickMenus.map((menu) => (
              <Button key={menu.href} asChild variant="outline" className="h-auto items-stretch justify-start p-0 border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-all">
                <Link href={menu.href} className="w-full">
                  <div className="flex h-full w-full flex-col gap-3 rounded-xl p-4 text-left transition-colors">
                    <ViewTransition name={`quick-icon-${menu.id}`} share="morph">
                      <div className={`inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${menu.className} text-white shadow-md shadow-slate-200/50 dark:shadow-none`}>
                        <menu.icon className="size-4.5" />
                      </div>
                    </ViewTransition>
                    <div className="space-y-1">
                      <ViewTransition name={`quick-text-${menu.id}`} share="text-morph">
                        <p className="text-sm font-semibold leading-none tracking-tight">{menu.title}</p>
                      </ViewTransition>
                      <p className="text-[10px] text-muted-foreground/80 leading-relaxed">{menu.description}</p>
                    </div>
                  </div>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{stat.title}</p>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className={`text-[11px] font-medium flex items-center gap-1 ${stat.trend === "up" ? "text-emerald-600" : stat.trend === "down" ? "text-red-500" : "text-slate-500"}`}>
                    {stat.trend === "up" && <ArrowUpRight className="size-3" />}
                    {stat.trend === "down" && <ArrowDownRight className="size-3" />}
                    {stat.change}
                  </p>
                </div>
                <ViewTransition name={`stat-icon-${stat.id}`} share="morph">
                  <div className={`${stat.bg} ${stat.color} p-2.5 rounded-xl shadow-sm border border-current/5`}>
                    <stat.icon className="size-5" />
                  </div>
                </ViewTransition>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Top Tunggakan */}
      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Arus Kas Bulanan</CardTitle>
                <CardDescription>6 bulan terakhir</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="size-2.5 bg-emerald-500 rounded-full inline-block" /> Masuk</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 bg-rose-400 rounded-full inline-block" /> Keluar</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BarChart data={stats.arusKas6Bulan} />
            {surplusVal !== 0 && (
              <div className="mt-6 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between dark:bg-emerald-950/20 dark:border-emerald-900/30">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/80 dark:text-emerald-400/80">Surplus Bulan Ini</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmt(surplusVal)}</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400 rounded-lg font-bold">
                  {surplusBulanIni?.bulan}
                </Badge>
              </div>
            )}
            {surplusVal === 0 && (
              <div className="mt-6 p-4 bg-muted/40 rounded-xl text-xs text-muted-foreground text-center border border-dashed border-slate-200 dark:border-slate-800">
                Belum ada data kas bulan ini. Mulai input transaksi di menu Arus Kas.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Top 5 Tunggakan Kelompok</CardTitle>
            <CardDescription>Outstanding tertinggi</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {stats.topTunggakan.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">🎉 Tidak ada tunggakan saat ini.</p>
            ) : (
              <div className="overflow-hidden rounded-b-xl border-t border-slate-100 dark:border-slate-800">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 dark:bg-slate-900/50 dark:hover:bg-slate-900/50 border-b-slate-100 dark:border-b-slate-800">
                      <TableHead className="w-12 text-center text-[10px] font-bold uppercase tracking-widest">No</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest">Kelompok</TableHead>
                      <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.topTunggakan.map((item, i) => (
                      <TableRow key={item.nama} className="border-b-slate-50 dark:border-b-slate-900/50 hover:bg-slate-50/30 transition-colors">
                        <TableCell className="text-center">
                          <div className={`size-6 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-red-100 text-red-700" : i === 1 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}>
                            {i + 1}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold truncate max-w-[120px] tracking-tight">{item.nama}</span>
                            <span className="text-[10px] font-medium text-muted-foreground/80">{item.wilayah} · {item.count} angs</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-bold text-red-600 tracking-tight">{fmt(item.total)}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.penagihanHariIni > 0 && (
        <Card className="border-none bg-gradient-to-br from-amber-50 to-orange-50/50 shadow-sm dark:from-amber-950/20 dark:to-orange-950/10">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="size-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 dark:bg-amber-900/50 dark:text-amber-400 shadow-sm">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-sm tracking-tight dark:text-amber-200">Penagihan Hari Ini</p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed dark:text-amber-400">
                Terdapat <strong>{stats.penagihanHariIni} angsuran</strong> yang jatuh tempo hari ini.
                Pastikan kolektor sudah mendapat jadwal kunjungan.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
