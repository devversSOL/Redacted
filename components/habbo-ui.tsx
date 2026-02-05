"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* =============================================================================
   HABBO UI COMPONENT LIBRARY
   
   A complete set of retro pixel-art style UI components inspired by Habbo Hotel.
   Import these components to recreate the nostalgic 2000s virtual world aesthetic.
   
   Components included:
   - HabboButton (primary action buttons)
   - HabboInput (text inputs)
   - HabboTextarea (multi-line inputs)
   - HabboWindow (draggable floating windows)
   - HabboNavbar (top navigation bar)
   - HabboTab / HabboTabBar (tab navigation)
   - HabboPill (status badges)
   - HabboCard (content cards)
   - HabboListItem (list rows with icons)
   - HabboLogo (branded logo block)
   - HabboSeparator (divider lines)
   - HabboTooltip (hover tooltips)
============================================================================= */

// =============================================================================
// COLOR PALETTE
// =============================================================================
export const habboPalette = {
  // Blues
  blueLight: "#b6d5e9",
  blueMid: "#6fa6c3",
  blueDark: "#3b5f76",
  blueEdge: "#0b2a3a",
  // Window colors
  windowBg: "#d9e6ef",
  windowInner: "#eef6fb",
  // Accents
  yellow: "#ffcc00",
  yellowDark: "#f3b700",
  yellowEdge: "#a67c00",
  orange: "#f59e0b",
  orangeDark: "#f97316",
  orangeEdge: "#a04f06",
  red: "#dc2626",
  green: "#22c55e",
  greenDark: "#16a34a",
  greenLight: "#86efac",
  // Neutrals
  sky: "#9bbad3",
  dark: "#2f2f2f",
  black: "#000000",
  white: "#ffffff",
}

// =============================================================================
// HABBO BUTTON
// =============================================================================
export interface HabboButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "go" | "danger"
  size?: "sm" | "md" | "lg"
  children: React.ReactNode
}

export const HabboButton = React.forwardRef<HTMLButtonElement, HabboButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-gradient-to-b from-[#ffcf4d] to-[#f59e0b] shadow-[0_2px_0_#00000040,inset_0_0_0_2px_#a67c00] text-[#1f1300]",
      secondary: "bg-gradient-to-b from-[#b6d5e9] to-[#6fa6c3] shadow-[0_2px_0_#00000040,inset_0_0_0_2px_#3b5f76] text-[#0b2a3a]",
      go: "bg-gradient-to-b from-[#ffb84d] to-[#f97316] shadow-[0_2px_0_#00000040,inset_0_0_0_2px_#a04f06] text-[#1f1300]",
      danger: "bg-gradient-to-b from-[#f87171] to-[#dc2626] shadow-[0_2px_0_#00000040,inset_0_0_0_2px_#991b1b] text-white",
    }
    const sizes = {
      sm: "h-7 px-2.5 text-[11px]",
      md: "h-9 px-4 text-[12px]",
      lg: "h-11 px-6 text-[14px]",
    }
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 border-2 border-black rounded-md font-bold transition-all",
          "hover:brightness-105 active:translate-y-[1px] active:shadow-[0_1px_0_#00000040,inset_0_0_0_2px_inherit]",
          "disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
HabboButton.displayName = "HabboButton"

// =============================================================================
// HABBO INPUT
// =============================================================================
export interface HabboInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const HabboInput = React.forwardRef<HTMLInputElement, HabboInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-9 w-full rounded-md border-2 border-black bg-white px-3 text-[13px]",
          "shadow-[inset_0_0_0_2px_#6fa6c3] placeholder:text-black/40",
          "focus:outline-none focus:ring-2 focus:ring-[#3b5f76] focus:ring-offset-1",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    )
  }
)
HabboInput.displayName = "HabboInput"

// =============================================================================
// HABBO TEXTAREA
// =============================================================================
export interface HabboTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const HabboTextarea = React.forwardRef<HTMLTextAreaElement, HabboTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[80px] w-full rounded-md border-2 border-black bg-white px-3 py-2 text-[13px]",
          "shadow-[inset_0_0_0_2px_#6fa6c3] placeholder:text-black/40 resize-none",
          "focus:outline-none focus:ring-2 focus:ring-[#3b5f76] focus:ring-offset-1",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    )
  }
)
HabboTextarea.displayName = "HabboTextarea"

// =============================================================================
// HABBO LOGO
// =============================================================================
export interface HabboLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string
}

export const HabboLogo = React.forwardRef<HTMLDivElement, HabboLogoProps>(
  ({ className, text = "PIXEL PLAZA", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center h-7 px-2.5 border-2 border-black rounded-md",
          "bg-gradient-to-b from-[#ffcc00] to-[#f3b700] shadow-[0_2px_0_#00000040]",
          className
        )}
        {...props}
      >
        <span className="font-black text-[13px] tracking-wide text-black drop-shadow-[1px_1px_0_#ffe680]">
          {text}
        </span>
      </div>
    )
  }
)
HabboLogo.displayName = "HabboLogo"

// =============================================================================
// HABBO NAVBAR
// =============================================================================
export interface HabboNavbarProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode
  title?: string
  children?: React.ReactNode
}

export const HabboNavbar = React.forwardRef<HTMLElement, HabboNavbarProps>(
  ({ className, logo, title, children, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          "border-b border-black/40 bg-[#2f2f2f]",
          className
        )}
        {...props}
      >
        <div className="max-w-6xl mx-auto px-3 py-2 flex items-center gap-3">
          {logo || <HabboLogo />}
          <HabboSeparator orientation="vertical" className="h-6" />
          {title && <div className="text-sm text-white/80 hidden sm:block">{title}</div>}
          <div className="ml-auto flex items-center gap-2">
            {children}
          </div>
        </div>
      </header>
    )
  }
)
HabboNavbar.displayName = "HabboNavbar"

// =============================================================================
// HABBO SEPARATOR
// =============================================================================
export interface HabboSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
}

export const HabboSeparator = React.forwardRef<HTMLDivElement, HabboSeparatorProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-black/50",
          orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch",
          className
        )}
        {...props}
      />
    )
  }
)
HabboSeparator.displayName = "HabboSeparator"

// =============================================================================
// HABBO TAB BAR & TABS
// =============================================================================
export interface HabboTabBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const HabboTabBar = React.forwardRef<HTMLDivElement, HabboTabBarProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex gap-0.5 px-1.5 pt-1.5 pb-0 border-b-2 border-[#3b5f76]",
          "bg-gradient-to-b from-[#b6d5e9] to-[#6fa6c3]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
HabboTabBar.displayName = "HabboTabBar"

export interface HabboTabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  children: React.ReactNode
}

export const HabboTab = React.forwardRef<HTMLButtonElement, HabboTabProps>(
  ({ className, active, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "px-3 py-1.5 border-2 border-black border-b-0 rounded-t-lg text-[12px] font-bold transition-colors",
          active
            ? "bg-[#eef6fb] text-[#0b2a3a]"
            : "bg-[#9ec3d8] text-[#0b2a3a]/80 hover:bg-[#b6d5e9]",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
HabboTab.displayName = "HabboTab"

// =============================================================================
// HABBO PILL (Status Badge)
// =============================================================================
export interface HabboPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info"
  children: React.ReactNode
}

export const HabboPill = React.forwardRef<HTMLSpanElement, HabboPillProps>(
  ({ className, variant = "success", children, ...props }, ref) => {
    const variants = {
      success: "bg-[#22c55e] text-[#072f14]",
      warning: "bg-[#f59e0b] text-[#1f1300]",
      danger: "bg-[#dc2626] text-white",
      info: "bg-[#6fa6c3] text-[#0b2a3a]",
    }
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2 py-0.5 text-[11px] font-semibold border-2 border-black rounded-full",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)
HabboPill.displayName = "HabboPill"

// =============================================================================
// HABBO CARD
// =============================================================================
export interface HabboCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "green" | "blue"
  children: React.ReactNode
}

export const HabboCard = React.forwardRef<HTMLDivElement, HabboCardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-[#eef6fb] shadow-[inset_0_0_0_2px_#6fa6c3]",
      green: "bg-gradient-to-b from-[#d7f5dd] to-[#b6eec3] shadow-[inset_0_0_0_2px_#3aa86b]",
      blue: "bg-gradient-to-b from-[#d9e6ef] to-[#c6d9e6] shadow-[inset_0_0_0_2px_#3b5f76]",
    }
    return (
      <div
        ref={ref}
        className={cn(
          "border-2 border-black rounded-lg p-3",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
HabboCard.displayName = "HabboCard"

// =============================================================================
// HABBO LIST ITEM (Navigation Row)
// =============================================================================
export interface HabboListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  label: string
  status?: React.ReactNode
  action?: React.ReactNode
}

export const HabboListItem = React.forwardRef<HTMLDivElement, HabboListItemProps>(
  ({ className, icon, label, status, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 border-2 border-black rounded-lg",
          "bg-gradient-to-b from-[#d7f5dd] to-[#b6eec3] shadow-[inset_0_0_0_2px_#3aa86b]",
          className
        )}
        {...props}
      >
        {icon || (
          <span className="w-2.5 h-2.5 bg-[#16a34a] border-2 border-black rounded-full shrink-0" />
        )}
        <span className="truncate text-[13px] font-medium">{label}</span>
        {status && <div className="ml-auto">{status}</div>}
        {action && <div className="shrink-0">{action}</div>}
      </div>
    )
  }
)
HabboListItem.displayName = "HabboListItem"

// =============================================================================
// HABBO WINDOW (Draggable floating panel)
// =============================================================================
export interface HabboWindowProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  initialPosition?: { x: number; y: number }
  initialSize?: { width: number; height?: number }
  onClose?: () => void
  children: React.ReactNode
}

export const HabboWindow = React.forwardRef<HTMLDivElement, HabboWindowProps>(
  (
    {
      className,
      title = "Window",
      initialPosition = { x: 24, y: 24 },
      initialSize = { width: 360, height: 300 },
      onClose,
      children,
      ...props
    },
    ref
  ) => {
    const [position, setPosition] = React.useState(initialPosition)
    const lastPointer = React.useRef<{ x: number; y: number } | null>(null)

    const handlePointerMove = React.useCallback((e: PointerEvent) => {
      if (!lastPointer.current) return
      const dx = e.clientX - lastPointer.current.x
      const dy = e.clientY - lastPointer.current.y
      lastPointer.current = { x: e.clientX, y: e.clientY }
      setPosition((p) => ({ x: p.x + dx, y: p.y + dy }))
    }, [])

    const handlePointerUp = React.useCallback(() => {
      lastPointer.current = null
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }, [handlePointerMove])

    const handleTitleBarPointerDown = React.useCallback(
      (e: React.PointerEvent) => {
        const target = e.target as HTMLElement
        if (target.closest("[data-no-drag]")) return
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        lastPointer.current = { x: e.clientX, y: e.clientY }
        window.addEventListener("pointermove", handlePointerMove, { passive: true })
        window.addEventListener("pointerup", handlePointerUp, { passive: true })
      },
      [handlePointerMove, handlePointerUp]
    )

    return (
      <div
        ref={ref}
        role="dialog"
        aria-label={title}
        className={cn(
          "fixed z-50 border-2 border-black rounded-[10px] overflow-hidden",
          "bg-[#d9e6ef] shadow-[0_4px_0_#00000040,0_0_0_2px_#3b5f76_inset]",
          className
        )}
        style={{
          left: position.x,
          top: position.y,
          width: initialSize.width,
          height: initialSize.height,
        }}
        {...props}
      >
        {/* Title Bar */}
        <div
          onPointerDown={handleTitleBarPointerDown}
          className={cn(
            "h-10 flex items-center justify-between px-2 cursor-move select-none",
            "border-b-2 border-black bg-gradient-to-b from-[#b6d5e9] to-[#6fa6c3]"
          )}
        >
          <span className="font-bold text-[13px] text-[#0b2a3a] truncate pr-2 drop-shadow-[0_1px_#e6f3fa]">
            {title}
          </span>
          <button
            data-no-drag
            onClick={onClose}
            className={cn(
              "w-7 h-7 rounded-full border-2 border-black bg-[#dc2626] flex items-center justify-center",
              "hover:brightness-95 active:translate-y-[1px] shadow-[0_0_0_2px_#000_inset]"
            )}
            aria-label="Close window"
          >
            <CloseIcon className="w-3 h-3" />
          </button>
        </div>
        {/* Content */}
        <div className="h-[calc(100%-2.5rem)] bg-[#eef6fb] border-t-2 border-[#3b5f76] overflow-auto">
          {children}
        </div>
      </div>
    )
  }
)
HabboWindow.displayName = "HabboWindow"

// Close icon helper
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} fill="none" stroke="black" strokeWidth="2">
      <path d="M2 2L10 10M10 2L2 10" />
    </svg>
  )
}

// =============================================================================
// HABBO FRAME (Container with border)
// =============================================================================
export interface HabboFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const HabboFrame = React.forwardRef<HTMLDivElement, HabboFrameProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "border-2 border-black rounded-[10px] overflow-hidden",
          "bg-[#c6d9e6] shadow-[0_4px_0_#00000040,inset_0_0_0_2px_#3b5f76]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
HabboFrame.displayName = "HabboFrame"

// =============================================================================
// HABBO TOOLTIP
// =============================================================================
export interface HabboTooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
}

export function HabboTooltip({ content, children, side = "top" }: HabboTooltipProps) {
  const [visible, setVisible] = React.useState(false)

  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 px-2 py-1 text-[11px] font-medium whitespace-nowrap",
            "bg-[#2f2f2f] text-white border-2 border-black rounded-md shadow-md",
            positions[side]
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// HABBO SWITCH
// =============================================================================
export interface HabboSwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export const HabboSwitch = React.forwardRef<HTMLButtonElement, HabboSwitchProps>(
  ({ className, checked = false, onCheckedChange, ...props }, ref) => {
    return (
      <button
        ref={ref}
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full border-2 border-black transition-colors",
          checked ? "bg-[#22c55e]" : "bg-[#6fa6c3]",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full border-2 border-black bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    )
  }
)
HabboSwitch.displayName = "HabboSwitch"

// =============================================================================
// HABBO SLIDER
// =============================================================================
export interface HabboSliderProps {
  value?: number
  min?: number
  max?: number
  step?: number
  onChange?: (value: number) => void
  className?: string
}

export function HabboSlider({
  value = 50,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  className,
}: HabboSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={cn("relative w-full h-6 flex items-center", className)}>
      <div className="relative w-full h-3 border-2 border-black rounded-full bg-[#6fa6c3] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ffcc00] to-[#f59e0b]"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div
        className="absolute w-5 h-5 border-2 border-black rounded-full bg-white shadow-md pointer-events-none"
        style={{ left: `calc(${percentage}% - 10px)` }}
      />
    </div>
  )
}

// =============================================================================
// HABBO CHAT BUBBLE
// =============================================================================
export interface HabboChatBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  author?: string
  message: string
  variant?: "default" | "self" | "system"
}

export const HabboChatBubble = React.forwardRef<HTMLDivElement, HabboChatBubbleProps>(
  ({ className, author, message, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-white/90 border-black/15",
      self: "bg-[#ffcc00]/20 border-[#f59e0b]/30",
      system: "bg-[#6fa6c3]/20 border-[#3b5f76]/30 italic",
    }
    return (
      <div
        ref={ref}
        className={cn(
          "inline-block max-w-[92%] border rounded px-2 py-1",
          variants[variant],
          className
        )}
        {...props}
      >
        {author && <span className="font-semibold text-[12px]">{author}: </span>}
        <span className="text-[13px] whitespace-pre-wrap break-words">{message}</span>
      </div>
    )
  }
)
HabboChatBubble.displayName = "HabboChatBubble"

// =============================================================================
// HABBO AVATAR (Simple pixel avatar placeholder)
// =============================================================================
export interface HabboAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  color?: string
  size?: "sm" | "md" | "lg"
}

export const HabboAvatar = React.forwardRef<HTMLDivElement, HabboAvatarProps>(
  ({ className, name, color = "#3b82f6", size = "md", ...props }, ref) => {
    const sizes = {
      sm: "w-8 h-8 text-[10px]",
      md: "w-12 h-12 text-[12px]",
      lg: "w-16 h-16 text-[14px]",
    }
    const initial = name ? name[0].toUpperCase() : "?"
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center border-2 border-black rounded-lg font-bold text-white",
          sizes[size],
          className
        )}
        style={{ backgroundColor: color }}
        title={name}
        {...props}
      >
        {initial}
      </div>
    )
  }
)
HabboAvatar.displayName = "HabboAvatar"

// =============================================================================
// HABBO PROGRESS BAR
// =============================================================================
export interface HabboProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  variant?: "default" | "success" | "warning" | "danger"
}

export const HabboProgress = React.forwardRef<HTMLDivElement, HabboProgressProps>(
  ({ className, value = 0, max = 100, variant = "default", ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))
    const variants = {
      default: "from-[#ffcc00] to-[#f59e0b]",
      success: "from-[#86efac] to-[#22c55e]",
      warning: "from-[#ffb84d] to-[#f97316]",
      danger: "from-[#f87171] to-[#dc2626]",
    }
    return (
      <div
        ref={ref}
        className={cn(
          "w-full h-4 border-2 border-black rounded-full bg-[#6fa6c3] overflow-hidden",
          className
        )}
        {...props}
      >
        <div
          className={cn("h-full bg-gradient-to-r transition-all duration-300", variants[variant])}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    )
  }
)
HabboProgress.displayName = "HabboProgress"

// =============================================================================
// HABBO CHECKBOX
// =============================================================================
export interface HabboCheckboxProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
}

export const HabboCheckbox = React.forwardRef<HTMLButtonElement, HabboCheckboxProps>(
  ({ className, checked = false, onCheckedChange, label, ...props }, ref) => {
    return (
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <button
          ref={ref}
          type="button"
          role="checkbox"
          aria-checked={checked}
          onClick={() => onCheckedChange?.(!checked)}
          className={cn(
            "w-5 h-5 border-2 border-black rounded flex items-center justify-center transition-colors",
            checked ? "bg-[#22c55e]" : "bg-white",
            className
          )}
          {...props}
        >
          {checked && (
            <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="white" strokeWidth="2">
              <path d="M2 6L5 9L10 3" />
            </svg>
          )}
        </button>
        {label && <span className="text-[13px]">{label}</span>}
      </label>
    )
  }
)
HabboCheckbox.displayName = "HabboCheckbox"

// =============================================================================
// HABBO RADIO
// =============================================================================
export interface HabboRadioProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
}

export const HabboRadio = React.forwardRef<HTMLButtonElement, HabboRadioProps>(
  ({ className, checked = false, onCheckedChange, label, ...props }, ref) => {
    return (
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <button
          ref={ref}
          type="button"
          role="radio"
          aria-checked={checked}
          onClick={() => onCheckedChange?.(!checked)}
          className={cn(
            "w-5 h-5 border-2 border-black rounded-full flex items-center justify-center transition-colors",
            checked ? "bg-[#6fa6c3]" : "bg-white",
            className
          )}
          {...props}
        >
          {checked && <span className="w-2 h-2 bg-[#0b2a3a] rounded-full" />}
        </button>
        {label && <span className="text-[13px]">{label}</span>}
      </label>
    )
  }
)
HabboRadio.displayName = "HabboRadio"

// =============================================================================
// HABBO SELECT
// =============================================================================
export interface HabboSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
}

export const HabboSelect = React.forwardRef<HTMLSelectElement, HabboSelectProps>(
  ({ className, options, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "h-9 w-full rounded-md border-2 border-black bg-white px-3 text-[13px] appearance-none cursor-pointer",
          "shadow-[inset_0_0_0_2px_#6fa6c3] focus:outline-none focus:ring-2 focus:ring-[#3b5f76]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }
)
HabboSelect.displayName = "HabboSelect"

// =============================================================================
// HABBO BADGE (Icon badge for notifications)
// =============================================================================
export interface HabboBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count?: number
  max?: number
}

export const HabboBadge = React.forwardRef<HTMLSpanElement, HabboBadgeProps>(
  ({ className, count = 0, max = 99, children, ...props }, ref) => {
    const display = count > max ? `${max}+` : count
    return (
      <span className="relative inline-flex" ref={ref} {...props}>
        {children}
        {count > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center",
              "text-[10px] font-bold text-white bg-[#dc2626] border-2 border-black rounded-full px-1",
              className
            )}
          >
            {display}
          </span>
        )}
      </span>
    )
  }
)
HabboBadge.displayName = "HabboBadge"

// =============================================================================
// HABBO SPINNER (Loading indicator)
// =============================================================================
export interface HabboSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

export const HabboSpinner = React.forwardRef<HTMLDivElement, HabboSpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizes = {
      sm: "w-4 h-4 border-2",
      md: "w-6 h-6 border-2",
      lg: "w-8 h-8 border-[3px]",
    }
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-full border-black border-t-[#ffcc00] animate-spin",
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
HabboSpinner.displayName = "HabboSpinner"

// =============================================================================
// HABBO ALERT
// =============================================================================
export interface HabboAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "danger"
  title?: string
  children: React.ReactNode
}

export const HabboAlert = React.forwardRef<HTMLDivElement, HabboAlertProps>(
  ({ className, variant = "info", title, children, ...props }, ref) => {
    const variants = {
      info: "bg-gradient-to-b from-[#d9e6ef] to-[#c6d9e6] shadow-[inset_0_0_0_2px_#3b5f76]",
      success: "bg-gradient-to-b from-[#d7f5dd] to-[#b6eec3] shadow-[inset_0_0_0_2px_#3aa86b]",
      warning: "bg-gradient-to-b from-[#fef3cd] to-[#fde68a] shadow-[inset_0_0_0_2px_#a67c00]",
      danger: "bg-gradient-to-b from-[#fee2e2] to-[#fecaca] shadow-[inset_0_0_0_2px_#991b1b]",
    }
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "border-2 border-black rounded-lg p-3",
          variants[variant],
          className
        )}
        {...props}
      >
        {title && <div className="font-bold text-[13px] mb-1">{title}</div>}
        <div className="text-[12px]">{children}</div>
      </div>
    )
  }
)
HabboAlert.displayName = "HabboAlert"

// =============================================================================
// HABBO MODAL (Full-screen overlay)
// =============================================================================
export interface HabboModalProps {
  open?: boolean
  onClose?: () => void
  title?: string
  children: React.ReactNode
}

export function HabboModal({ open, onClose, title = "Modal", children }: HabboModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* Modal window */}
      <div className="relative z-10">
        <HabboWindow
          title={title}
          onClose={onClose}
          initialPosition={{ x: 0, y: 0 }}
          initialSize={{ width: 400, height: undefined }}
          className="relative"
          style={{ position: "relative", left: 0, top: 0 }}
        >
          {children}
        </HabboWindow>
      </div>
    </div>
  )
}
