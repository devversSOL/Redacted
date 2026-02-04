"use client"

import { useEffect, useRef, useCallback } from "react"

interface AsciiShaderProps {
  mode?: "waves" | "spiral" | "plasma" | "tunnel" | "grid" | "pulse" | "moire" | "metaballs" | "matrix"
  speed?: number
  density?: number
  opacity?: number
  bloom?: boolean
  color?: string
  className?: string
}

const NUMBER_RAMP = "0123456789"
const ASCII_RAMP = " .:+*#%@@@"
const TARGET_FRAME_TIME = 16
const ADAPTIVE_THRESHOLD = 20
const ADAPTIVE_SAMPLE_COUNT = 10

export function AsciiShader({
  mode = "waves",
  speed = 1,
  density = 1,
  opacity = 0.15,
  bloom = false,
  color = "#22c55e", // Green by default
  className = "",
}: AsciiShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bloomCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number>(0)
  const stateRef = useRef({
    time: 0,
    cellSize: 16,
    cols: 0,
    rows: 0,
    atlas: null as HTMLCanvasElement | null,
    glyphWidth: 0,
    glyphHeight: 0,
    brightnessBuffer: new Float32Array(0),
    indexBuffer: new Uint8Array(0),
    frameTimes: new Float32Array(ADAPTIVE_SAMPLE_COUNT),
    frameIndex: 0,
    paused: false,
    lastTime: 0,
  })

  // Create glyph atlas with numbers
  const createAtlas = useCallback((cellW: number, cellH: number, useNumbers: boolean): HTMLCanvasElement => {
    const ramp = useNumbers ? NUMBER_RAMP : ASCII_RAMP
    const atlas = document.createElement("canvas")
    atlas.width = cellW * ramp.length
    atlas.height = cellH
    const ctx = atlas.getContext("2d")!
    
    ctx.fillStyle = color
    ctx.font = `bold ${cellH}px "Courier New", monospace`
    ctx.textBaseline = "top"
    ctx.textAlign = "center"
    
    // Add glow for bloom effect
    if (bloom) {
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
    
    for (let i = 0; i < ramp.length; i++) {
      ctx.fillText(ramp[i], i * cellW + cellW / 2, 0)
    }
    
    return atlas
  }, [color, bloom])

  // Field functions for different modes
  const fields = {
    waves: (x: number, y: number, t: number): number => {
      const wave1 = Math.sin(x * 4 + t) * 0.5
      const wave2 = Math.sin(y * 3 + t * 0.7) * 0.5
      const wave3 = Math.sin((x + y) * 2 + t * 1.3) * 0.3
      return (wave1 + wave2 + wave3 + 1.3) / 2.6
    },
    
    spiral: (x: number, y: number, t: number): number => {
      const dist = Math.sqrt(x * x + y * y)
      const angle = Math.atan2(y, x)
      return (Math.sin(dist * 6 - t * 2 + angle * 3) + 1) * 0.5
    },
    
    plasma: (x: number, y: number, t: number): number => {
      // Gentle, smooth plasma - calming effect
      const v1 = Math.sin(x * 3 + t * 0.5) * 0.5
      const v2 = Math.sin(y * 2.5 + t * 0.4) * 0.5
      const v3 = Math.sin((x + y) * 2 + t * 0.3) * 0.4
      const dist = Math.sqrt(x * x + y * y)
      const radial = Math.sin(dist * 3 - t * 0.6) * 0.3
      return (v1 + v2 + v3 + radial + 1.7) / 3.4
    },
    
    tunnel: (x: number, y: number, t: number): number => {
      const dist = Math.sqrt(x * x + y * y) + 0.001
      const angle = Math.atan2(y, x)
      const tunnel = Math.sin(8 / dist + angle * 4 - t * 3)
      return (tunnel + 1) * 0.5 * Math.min(1, 0.5 / dist)
    },
    
    grid: (x: number, y: number, t: number): number => {
      const rotX = x * Math.cos(t * 0.3) - y * Math.sin(t * 0.3)
      const rotY = x * Math.sin(t * 0.3) + y * Math.cos(t * 0.3)
      const gridX = Math.abs(Math.sin(rotX * 8))
      const gridY = Math.abs(Math.sin(rotY * 8))
      return gridX * gridY
    },
    
    pulse: (x: number, y: number, t: number): number => {
      // Signal-like pulse lines
      const line1 = Math.exp(-Math.pow((y - Math.sin(x * 3 + t) * 0.3) * 8, 2))
      const line2 = Math.exp(-Math.pow((y + 0.3 - Math.sin(x * 2 - t * 1.5) * 0.2) * 6, 2))
      const bars = Math.abs(Math.sin(x * 15 + t)) * Math.exp(-Math.pow(y * 3, 2)) * 0.5
      return Math.min(1, line1 + line2 * 0.7 + bars)
    },
    
    moire: (x: number, y: number, t: number): number => {
      const pattern1 = Math.sin(x * 20 + t)
      const pattern2 = Math.sin(y * 20 + t * 0.7)
      const pattern3 = Math.sin((x * Math.cos(t * 0.2) + y * Math.sin(t * 0.2)) * 15)
      return (pattern1 * pattern2 + pattern3 + 2) / 4
    },
    
    metaballs: (x: number, y: number, t: number): number => {
      let sum = 0
      const balls = [
        { x: Math.sin(t) * 0.4, y: Math.cos(t * 0.7) * 0.4 },
        { x: Math.sin(t * 0.8 + 2) * 0.5, y: Math.cos(t * 0.6 + 1) * 0.3 },
        { x: Math.sin(t * 1.2 + 4) * 0.3, y: Math.cos(t * 0.9 + 3) * 0.5 },
      ]
      for (const ball of balls) {
        const dx = x - ball.x
        const dy = y - ball.y
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1
        sum += 0.15 / dist
      }
      return Math.min(1, sum)
    },
    
    matrix: (x: number, y: number, t: number): number => {
      // Static grid with gentle pulse - no parallax/falling motion
      const gridX = Math.sin(x * 8) * 0.5 + 0.5
      const gridY = Math.sin(y * 6) * 0.5 + 0.5
      const pulse = Math.sin(t * 0.5) * 0.1 + 0.9
      return gridX * gridY * pulse * 0.8
    },
  }

  // Main render function
  const render = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const state = stateRef.current
    if (state.paused || !state.atlas) return

    const now = performance.now()
    const delta = state.lastTime ? (now - state.lastTime) / 1000 : 0.016
    state.lastTime = now
    state.time += delta * speed

    // Adaptive quality
    state.frameTimes[state.frameIndex % ADAPTIVE_SAMPLE_COUNT] = delta * 1000
    state.frameIndex++
    
    if (state.frameIndex >= ADAPTIVE_SAMPLE_COUNT) {
      let avgFrameTime = 0
      for (let i = 0; i < ADAPTIVE_SAMPLE_COUNT; i++) {
        avgFrameTime += state.frameTimes[i]
      }
      avgFrameTime /= ADAPTIVE_SAMPLE_COUNT
      
      if (avgFrameTime > ADAPTIVE_THRESHOLD && state.cellSize < 20) {
        state.cellSize += 2
        initBuffers(canvas)
      } else if (avgFrameTime < TARGET_FRAME_TIME * 0.7 && state.cellSize > 8) {
        state.cellSize -= 1
        initBuffers(canvas)
      }
    }

    const { cols, rows, cellSize, atlas, glyphWidth, glyphHeight, brightnessBuffer, indexBuffer, time } = state
    const field = fields[mode]
    const useNumbers = mode === "waves" || mode === "matrix"
    const ramp = useNumbers ? NUMBER_RAMP : ASCII_RAMP
    
    // Calculate brightness for each cell
    let idx = 0
    for (let row = 0; row < rows; row++) {
      const y = (row / rows) * 2 - 1
      for (let col = 0; col < cols; col++) {
        const x = (col / cols) * 2 - 1
        const brightness = field(x * density, y * density, time)
        brightnessBuffer[idx] = brightness
        indexBuffer[idx] = Math.floor(Math.min(0.999, Math.max(0, brightness)) * ramp.length)
        idx++
      }
    }

    // Clear and render
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Apply bloom effect if enabled
    if (bloom) {
      ctx.filter = 'blur(1px)'
      ctx.globalAlpha = 0.6
    }
    
    idx = 0
    for (let row = 0; row < rows; row++) {
      const dy = row * cellSize
      for (let col = 0; col < cols; col++) {
        const charIdx = indexBuffer[idx]
        if (charIdx > 0) { // Skip empty for performance
          const dx = col * cellSize
          ctx.drawImage(
            atlas,
            charIdx * glyphWidth, 0, glyphWidth, glyphHeight,
            dx, dy, cellSize, cellSize
          )
        }
        idx++
      }
    }
    
    // Second pass for bloom glow
    if (bloom) {
      ctx.filter = 'none'
      ctx.globalAlpha = 1.0
      idx = 0
      for (let row = 0; row < rows; row++) {
        const dy = row * cellSize
        for (let col = 0; col < cols; col++) {
          const charIdx = indexBuffer[idx]
          if (charIdx > 0) {
            const dx = col * cellSize
            ctx.drawImage(
              atlas,
              charIdx * glyphWidth, 0, glyphWidth, glyphHeight,
              dx, dy, cellSize, cellSize
            )
          }
          idx++
        }
      }
    }

    animationRef.current = requestAnimationFrame(() => render(canvas, ctx))
  }, [mode, speed, density, bloom])

  // Initialize buffers
  const initBuffers = useCallback((canvas: HTMLCanvasElement) => {
    const state = stateRef.current
    state.cols = Math.ceil(canvas.width / state.cellSize)
    state.rows = Math.ceil(canvas.height / state.cellSize)
    const totalCells = state.cols * state.rows
    
    if (state.brightnessBuffer.length !== totalCells) {
      state.brightnessBuffer = new Float32Array(totalCells)
      state.indexBuffer = new Uint8Array(totalCells)
    }
    
    state.glyphWidth = state.cellSize
    state.glyphHeight = state.cellSize
    // Use numbers for waves/matrix modes, ASCII for others
    const useNumbers = mode === "waves" || mode === "matrix"
    state.atlas = createAtlas(state.glyphWidth, state.glyphHeight, useNumbers)
  }, [createAtlas, mode])

  // Handle resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.scale(dpr, dpr)
    }
    
    initBuffers(canvas)
  }, [initBuffers])

  // Handle visibility
  const handleVisibility = useCallback(() => {
    stateRef.current.paused = document.hidden
    if (!document.hidden && canvasRef.current) {
      stateRef.current.lastTime = 0
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        animationRef.current = requestAnimationFrame(() => render(canvasRef.current!, ctx))
      }
    }
  }, [render])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    handleResize()
    
    // Start animation
    animationRef.current = requestAnimationFrame(() => render(canvas, ctx))

    // Event listeners
    window.addEventListener("resize", handleResize)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [handleResize, handleVisibility, render])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ opacity }}
    />
  )
}
