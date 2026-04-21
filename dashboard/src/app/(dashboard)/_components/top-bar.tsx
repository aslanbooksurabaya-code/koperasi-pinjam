"use client"

import * as React from "react"
import { CalendarDays, Plus, Bell, User, Search, UserPlus, ClipboardList, CreditCard, PiggyBank, Sun, Moon, Laptop } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useTransition, addTransitionType } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import { useNavigationIndicator } from "@/components/navigation-indicator"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

export function TopBar() {
  const [date, setDate] = React.useState<Date>(() => new Date())
  const router = useRouter()
  const [, startTransition] = useTransition()
  const { setTheme } = useTheme()
  const { startNavigation } = useNavigationIndicator()

  React.useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const navigate = (url: string) => {
    startNavigation()
    startTransition(() => {
      addTransitionType("nav-forward")
      router.push(url)
    })
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-4 transition-all ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sticky top-0 z-30 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto bg-slate-200 dark:bg-slate-800"
        />
        <Breadcrumb className="hidden md:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                href="/"
                onClick={(e) => {
                  e.preventDefault()
                  navigate("/")
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground uppercase text-[10px] tracking-widest">Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-4 flex-1 justify-end max-w-4xl">
        {/* Search Input */}
        <div className="relative hidden lg:flex items-center flex-1 max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input type="search" placeholder="Cari nasabah atau transaksi..." className="pl-9 h-9 w-full focus-visible:border-slate-200 transition-all dark:focus-visible:bg-slate-950" />
        </div>

        {/* Date Header */}
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50/50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider xl:flex shadow-xs dark:border-slate-800 dark:bg-slate-900/50">
          <CalendarDays className="size-3 text-slate-500" />
          <span className="text-slate-600 dark:text-slate-400" suppressHydrationWarning>
            {format(date, "EEEE, d MMMM yyyy", { locale: id })}
          </span>
        </div>

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="p-1 rounded-xl border-slate-200/60 shadow-lg dark:border-slate-800/60">
            <DropdownMenuItem onSelect={() => setTheme("light")} className="rounded-lg gap-2">
              <Sun className="size-4 text-slate-500" />
              <span className="text-xs font-bold uppercase tracking-tight">Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme("dark")} className="rounded-lg gap-2">
              <Moon className="size-4 text-slate-500" />
              <span className="text-xs font-bold uppercase tracking-tight">Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme("system")} className="rounded-lg gap-2">
              <Laptop className="size-4 text-slate-500" />
              <span className="text-xs font-bold uppercase tracking-tight">System</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 border-slate-200 bg-white shadow-xs hover:bg-slate-50 transition-all dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-950 font-bold uppercase tracking-widest text-[10px]">
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Quick Action</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl border-slate-200/60 shadow-xl dark:border-slate-800/60">
            <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tambah Data Baru</DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1.5 bg-slate-100 dark:bg-slate-800" />
            <DropdownMenuItem onSelect={() => navigate("/nasabah/baru")} className="rounded-lg py-2">
              <UserPlus className="mr-2 h-4 w-4 text-slate-400" />
              <span className="font-semibold text-sm">Nasabah Baru</span>
              <DropdownMenuShortcut className="text-[10px]">⌘N</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate("/pengajuan")} className="rounded-lg py-2">
              <ClipboardList className="mr-2 h-4 w-4 text-slate-400" />
              <span className="font-semibold text-sm">Pengajuan Pinjaman</span>
              <DropdownMenuShortcut className="text-[10px]">⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate("/pembayaran")} className="rounded-lg py-2">
              <CreditCard className="mr-2 h-4 w-4 text-slate-400" />
              <span className="font-semibold text-sm">Input Pembayaran</span>
              <DropdownMenuShortcut className="text-[10px]">⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1.5 bg-slate-100 dark:bg-slate-800" />
            <DropdownMenuItem onSelect={() => navigate("/kas")} className="rounded-lg py-2">
              <PiggyBank className="mr-2 h-4 w-4 text-slate-400" />
              <span className="font-semibold text-sm">Input Kas Harian</span>
              <DropdownMenuShortcut className="text-[10px]">⌘K</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900">
            <Bell className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900">
            <User className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
