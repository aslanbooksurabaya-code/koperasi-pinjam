"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, Users, Banknote, FileText,
  FileBarChart, Settings, CreditCard, PiggyBank,
  AlertTriangle, TrendingDown, LogOut, Building2, Activity
} from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const navigation = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Master Data",
    items: [
      { title: "Nasabah", url: "/nasabah", icon: Users },
      { title: "Kelompok", url: "/kelompok", icon: Users },
    ],
  },
  {
    label: "Transaksi",
    items: [
      { title: "Pengajuan Pinjaman", url: "/pengajuan", icon: FileText },
      { title: "Pencairan", url: "/pencairan", icon: Banknote },
      { title: "Pembayaran Angsuran", url: "/pembayaran", icon: CreditCard },
      { title: "Arus Kas", url: "/kas", icon: PiggyBank },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { title: "Tunggakan", url: "/monitoring/tunggakan", icon: AlertTriangle },
      { title: "Rekap Kolektor", url: "/monitoring/kolektor", icon: Activity },
    ],
  },
  {
    label: "Laporan",
    items: [
      { title: "Per Kelompok", url: "/laporan/per-kelompok", icon: FileBarChart },
      { title: "Arus Kas", url: "/laporan/arus-kas", icon: FileBarChart },
      { title: "Laba Rugi", url: "/laporan/laba-rugi", icon: TrendingDown },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r/40 bg-transparent">
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3 glass-panel rounded-xl p-3 shadow-sm">
          <div className="bg-gradient-to-br from-cyan-700 to-teal-900 rounded-lg p-1.5 text-white flex-shrink-0">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="font-heading font-extrabold text-sm leading-tight tracking-tight">KoperasiApp</p>
            <p className="text-xs text-muted-foreground">Management Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url))
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={
                          <Link
                            href={item.url}
                            className={cn(
                              "flex items-center gap-2 w-full",
                              isActive && "font-semibold text-primary"
                            )}
                          >
                            <item.icon className="size-4 shrink-0" />
                            <span>{item.title}</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Link href="/settings" className="flex items-center gap-2 w-full">
                  <Settings className="size-4" />
                  <span>Settings</span>
                </Link>
              }
            />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              render={
                <button className="flex items-center gap-2 w-full text-destructive">
                  <LogOut className="size-4" />
                  <span>Keluar</span>
                </button>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
