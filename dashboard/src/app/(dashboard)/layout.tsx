import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TopBar } from "./_components/top-bar"
import { getCompanyInfo, getAccountingMode } from "@/actions/settings"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  const [company, accountingMode] = await Promise.all([
    getCompanyInfo(),
    getAccountingMode(),
  ])
  const user = {
    name: session.user?.name ?? "User",
    email: session.user?.email ?? "-",
    avatar: undefined as string | undefined,
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar user={user} company={company} accountingMode={accountingMode} />
        <SidebarInset className="bg-background">
          <div className="flex flex-col min-h-screen relative">
            <TopBar />
            <div className="flex-1 overflow-auto bg-gradient-to-br from-background via-slate-50/50 to-slate-100/50 dark:via-slate-950 dark:to-slate-900 p-4 md:p-6 lg:p-8">
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
