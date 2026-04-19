import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-background via-[#f4f8ff] to-[#eef4ff]">
            {/* Mobile sidebar trigger */}
            <header className="flex h-14 items-center gap-4 border-b/40 bg-background/90 backdrop-blur px-4 md:px-6 lg:hidden">
              <SidebarTrigger />
              <span className="font-semibold">KoperasiApp</span>
            </header>
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
