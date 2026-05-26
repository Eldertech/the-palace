import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const FPS = 30;
export const WIDTH = 1280;
export const HEIGHT = 720;

type Card = {
  kicker: string;
  title: string;
  body: string;
  K: string;
};

const CARDS: Card[] = [
  {
    kicker: "biology",
    title: "Fireflies in a forest",
    body:
      "Each beetle has its own flash rhythm. When they can see each other across the dark, the rhythms pull toward a shared beat — the forest blinks together.",
    K: "K = visibility through the trees",
  },
  {
    kicker: "neuroscience",
    title: "Neurons in the cortex",
    body:
      "Populations of neurons that fire at nearby intrinsic rates synchronize when their coupling is strong enough. Cognition rides on these locked rhythms.",
    K: "K = synaptic density",
  },
  {
    kicker: "music",
    title: "A jazz bassist",
    body:
      "Has a natural beat, but listens to the drummer with one ear and the soloist with the other. Coupling — yes; surrender — no. The whole groove is asymmetric Kuramoto.",
    K: "K = how hard you listen",
  },
  {
    kicker: "geophysics",
    title: "Tidal friction, locked moons",
    body:
      "Earth tugs the Moon, the Moon tugs back, friction dissipates the difference. Over deep time their rotations lock — one face of the Moon, always toward us. K winning.",
    K: "K = tidal coupling × geological time",
  },
];

const CARD_FRAMES = 4 * FPS; // 4 seconds per card
export const DURATION_IN_FRAMES = CARDS.length * CARD_FRAMES;

const PALETTE = {
  bg: "#0B0B10",
  ink: "#E5E7EB",
  axis: "#9CA3AF",
  indigo: "#6366F1",
  amber: "#F59E0B",
  panel: "#15151D",
  border: "#1F1F2A",
};

const TitleCard: React.FC<{ card: Card; localFrame: number }> = ({ card, localFrame }) => {
  const { fps } = useVideoConfig();

  const inSpring = spring({ frame: localFrame, fps, config: { damping: 18, mass: 0.6 } });
  const titleY = interpolate(inSpring, [0, 1], [40, 0]);
  const titleOpacity = interpolate(inSpring, [0, 1], [0, 1]);
  const bodyOpacity = interpolate(localFrame, [12, 30], [0, 1], { extrapolateRight: "clamp" });

  // Hold for 3.5 s, then ease out over the last 0.5 s.
  const outOpacity = interpolate(
    localFrame,
    [CARD_FRAMES - 15, CARD_FRAMES],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.bg,
        opacity: outOpacity,
        fontFamily: "Georgia, 'Times New Roman', serif",
        padding: "80px 120px",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          color: PALETTE.amber,
          fontSize: 22,
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 18,
          opacity: titleOpacity,
        }}
      >
        {card.kicker}
      </div>
      <div
        style={{
          color: PALETTE.ink,
          fontSize: 62,
          fontWeight: 600,
          marginBottom: 26,
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          lineHeight: 1.1,
        }}
      >
        {card.title}
      </div>
      <div
        style={{
          color: PALETTE.axis,
          fontSize: 26,
          maxWidth: 980,
          lineHeight: 1.45,
          opacity: bodyOpacity,
          marginBottom: 36,
        }}
      >
        {card.body}
      </div>
      <div
        style={{
          color: PALETTE.indigo,
          fontSize: 18,
          fontStyle: "italic",
          opacity: bodyOpacity,
        }}
      >
        {card.K}
      </div>
    </AbsoluteFill>
  );
};

export const PhenomenaWalk: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: PALETTE.bg }}>
      {CARDS.map((card, i) => (
        <Sequence key={i} from={i * CARD_FRAMES} durationInFrames={CARD_FRAMES}>
          <TitleCard card={card} localFrame={frame - i * CARD_FRAMES} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
