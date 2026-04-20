import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

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

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Redirect ke login jika belum terautentikasi (kecuali public paths)
  // "/" as root dashboard is NOT public anymore.
  const isPublicPath = pathname.startsWith("/api") || pathname === "/login"
  if (isPublicPath) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRoles: string[] = Array.isArray((token as any)?.roles) ? (token as any).roles : []

  // Cek permission per route
  for (const [routePrefix, allowedRoles] of Object.entries(routePermissions)) {
    if (pathname.startsWith(routePrefix)) {
      if (!hasAccess(userRoles, allowedRoles)) {
        return NextResponse.redirect(new URL("/?unauthorized=true", req.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
