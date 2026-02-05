"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { HabboButton, HabboPill, HabboTooltip } from "@/components/habbo-ui"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogIn, LogOut, User, ChevronDown } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function AuthButton() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error("Error signing in:", error.message)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error signing out:", error.message)
    }
  }

  if (loading) {
    return (
      <HabboButton variant="secondary" size="sm" disabled>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#ffcc00] border-t-transparent" />
      </HabboButton>
    )
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <HabboButton variant="secondary" size="sm" className="gap-2">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="h-5 w-5 rounded-full border-2 border-black"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
            <span className="hidden sm:inline text-[11px] max-w-[100px] truncate">
              {user.user_metadata?.name || user.email?.split("@")[0]}
            </span>
            <ChevronDown className="h-3 w-3" />
          </HabboButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-[#eef6fb] border-2 border-black rounded-lg shadow-[0_4px_0_#00000040]"
        >
          <div className="px-3 py-2 border-b-2 border-[#6fa6c3]">
            <p className="text-xs font-bold truncate text-[#0b2a3a]">{user.email}</p>
            <HabboPill variant="success" className="mt-1 text-[9px]">Human Contributor</HabboPill>
          </div>
          <DropdownMenuItem 
            onClick={signOut} 
            className="text-xs cursor-pointer mx-1 my-1 rounded hover:bg-[#dc2626]/10 text-[#0b2a3a]"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <HabboTooltip content="Sign in with Google">
      <HabboButton
        variant="go"
        size="sm"
        onClick={signInWithGoogle}
        className="gap-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="text-[11px]">Sign In</span>
      </HabboButton>
    </HabboTooltip>
  )
}
