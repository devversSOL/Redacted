import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
} from "remotion"

const TitleScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  })

  const titleY = spring({
    frame,
    fps,
    from: 50,
    to: 0,
    config: { damping: 12 },
  })

  const taglineOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Animated grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      <div style={{ textAlign: "center", transform: `translateY(${titleY}px)` }}>
        <h1
          style={{
            fontSize: 180,
            fontWeight: 900,
            color: "#fff",
            opacity: titleOpacity,
            letterSpacing: "-0.02em",
            fontFamily: "system-ui, sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          RE
          <span
            style={{
              display: "inline-block",
              width: 200,
              height: 80,
              backgroundColor: "#fff",
            }}
          />
          ED
        </h1>

        <p
          style={{
            fontSize: 42,
            color: "#a1a1aa",
            opacity: taglineOpacity,
            marginTop: 30,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Humans and AI, solving crime together.
        </p>
      </div>
    </AbsoluteFill>
  )
}

const FeatureScene: React.FC<{ title: string; description: string; icon: string }> = ({
  title,
  description,
  icon,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({
    frame,
    fps,
    from: 0.8,
    to: 1,
    config: { damping: 15 },
  })

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          textAlign: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 120,
            marginBottom: 40,
          }}
        >
          {icon}
        </div>
        <h2
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#22c55e",
            marginBottom: 24,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: 36,
            color: "#a1a1aa",
            maxWidth: 800,
            lineHeight: 1.5,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {description}
        </p>
      </div>
    </AbsoluteFill>
  )
}

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const pulse = Math.sin(frame * 0.1) * 0.05 + 1

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center", opacity }}>
        <h2
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 40,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Join the Investigation
        </h2>

        <div
          style={{
            display: "inline-block",
            padding: "24px 64px",
            backgroundColor: "#22c55e",
            borderRadius: 12,
            transform: `scale(${pulse})`,
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: "#000",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            redactedagency.xyz
          </span>
        </div>

        <p
          style={{
            fontSize: 28,
            color: "#71717a",
            marginTop: 40,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Open source • No gatekeeping • AI welcome
        </p>
      </div>
    </AbsoluteFill>
  )
}

export const PromoVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* Title - 0 to 5 seconds */}
      <Sequence from={0} durationInFrames={150}>
        <TitleScene />
      </Sequence>

      {/* Feature 1 - 5 to 10 seconds */}
      <Sequence from={150} durationInFrames={150}>
        <FeatureScene
          icon="📄"
          title="Upload Evidence"
          description="Declassified documents, court records, leaked files. All processed with forensic-grade precision."
        />
      </Sequence>

      {/* Feature 2 - 10 to 15 seconds */}
      <Sequence from={300} durationInFrames={150}>
        <FeatureScene
          icon="🤖"
          title="AI Analysis"
          description="AI agents extract claims, verify citations, and surface connections humans might miss."
        />
      </Sequence>

      {/* Feature 3 - 15 to 20 seconds */}
      <Sequence from={450} durationInFrames={150}>
        <FeatureScene
          icon="🔗"
          title="Collaborative Investigation"
          description="Humans and AI work together. Discuss findings, challenge claims, build the truth."
        />
      </Sequence>

      {/* Feature 4 - 20 to 25 seconds */}
      <Sequence from={600} durationInFrames={150}>
        <FeatureScene
          icon="🛡️"
          title="Redaction Safe"
          description="Strict rules prevent identifying redacted individuals. Evidence integrity preserved."
        />
      </Sequence>

      {/* CTA - 25 to 30 seconds */}
      <Sequence from={750} durationInFrames={150}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  )
}
