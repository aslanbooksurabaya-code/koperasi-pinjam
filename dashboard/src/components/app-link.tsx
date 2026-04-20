"use client"

import * as React from "react"
import Link, { type LinkProps } from "next/link"
import { useNavigationIndicator } from "@/components/navigation-indicator"

type AppLinkProps = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children?: React.ReactNode
  }

export function AppLink({ onClick, href, ...props }: AppLinkProps) {
  const { startNavigation } = useNavigationIndicator()

  return (
    <Link
      {...props}
      href={href}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        if (e.button !== 0) return
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        startNavigation()
      }}
    />
  )
}
