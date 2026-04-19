import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Route protection map: path prefix → allowed roles
const routePermissions: Record<string, string[]> = {
  "/laporan": ["MANAGER", "PIMPINAN", "AKUNTANSI"],
  "/settings": ["ADMIN", "PIMPINAN"],
  "/kas": ["TELLER", "ADMIN", "MANAGER", "PIMPINAN"],
  "/pencairan": ["ADMIN", "MANAGER", "PIMPINAN", "TELLER"],
}

// Helper: cek apakah user minimal punya 1 role yang diizinkan
function hasAccess(userRoles: string[], requiredRoles: string[]): boolean {
  return userRoles.some((r) => requiredRoles.includes(r))
}

export default auth(function middleware(req) {
  const { pathname } = req.nextUrl
  const session = req.auth
  // Auth.js puts custom fields in session.user via callbacks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRoles: string[] = (session?.user as any)?.roles ?? []

  // Redirect ke login jika belum terautentikasi (kecuali public paths)
  const isPublicPath = pathname.startsWith("/api") || pathname === "/"
  if (!isPublicPath && !session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Cek permission per route
  for (const [routePrefix, allowedRoles] of Object.entries(routePermissions)) {
    if (pathname.startsWith(routePrefix)) {
      if (!hasAccess(userRoles, allowedRoles)) {
        return NextResponse.redirect(new URL("/?unauthorized=true", req.url))
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
