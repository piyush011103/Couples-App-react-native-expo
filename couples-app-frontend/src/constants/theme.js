// ═══════════════════════════════════════════════════════
// THEME — The Ethereal Connection Design System
// ═══════════════════════════════════════════════════════

export const DARK_COLORS = {
  // ── Core backgrounds (The Void) ───────────────────
  background: "#12121D",
  surface: "#12121D",
  surfaceDim: "#12121D",
  surfaceContainerLowest: "#0D0D18",

  // ── Surface Containers (Layering) ─────────────────
  surfaceContainerLow: "#1B1A26",
  surfaceContainer: "#1F1E2A",
  surfaceContainerHigh: "#292935",
  surfaceContainerHighest: "#343440",
  surfaceBright: "#383845",

  // ── Brand / Pulse (Primary) ───────────────────────
  primary: "#DCB8FF",
  primaryContainer: "#8A2BE2",
  primaryFixed: "#EFDBFF",
  primaryFixedDim: "#DCB8FF",

  // ── Branding / Accent (The Glow) ──────────────────
  secondary: "#FFB1C4",
  secondaryContainer: "#B20055", // Deep Pink
  accent: "#FF4D8D", // Creative North Star Highlight

  // ── Text hierarchy (Editorial) ───────────────────
  text: "#E3E0F1", // onSurface
  textSub: "#CFC2D7", // onSurfaceVariant
  textMuted: "#988CA0", // outline

  // ── Status (Soft Tones) ──────────────────────────
  error: "#FFB4AB",
  errorContainer: "#93000A",
  success: "#00E676",
  warning: "#FFD740",

  // ── Borders (The No-Line Rule) ────────────────────
  border: "rgba(152,140,160,0.15)", // Subtle outline
  borderLight: "rgba(227,224,241,0.08)",

  // ── Glassmorphism ─────────────────────────────────
  glass: "rgba(52,52,64,0.50)", // surface_container_highest @ 50%
  glassBorder: "rgba(152,140,160,0.15)",
  glassHighlight: "rgba(255,255,255,0.06)",
};

export const LIGHT_COLORS = {
  // Keeping fallback structure, though project is primarily Dark Mode
  background: "#F7F8FF",
  surface: "#FFFFFF",
  primary: "#7B35E8",
  secondary: "#E6488B",
  text: "#16172B",
  textSub: "#52577A",
  textMuted: "#7A81A6",
  border: "rgba(123,53,232,0.18)",
};

export const COLORS = DARK_COLORS;

export const FONTS = {
  // Google Fonts mappings
  display: "Manrope_800ExtraBold",
  headline: "Manrope_700Bold",
  body: "Manrope_400Regular",
  label: "PlusJakartaSans_500Medium",
  // Standard weights
  thin: "100",
  light: "300",
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
};

export const SIZES = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 56, // 3.5rem equivalent
  title: 28,   // 1.75rem equivalent
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24, // Matches 1.5rem
  xxl: 28,
  xxxl: 36,
  full: 999,
};

export const SHADOWS = {
  purple: {
    shadowColor: "#8A2BE2",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 14,
  },
  neon: {
    shadowColor: "#FFB1C4",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  ambient: {
    shadowColor: "#0D0D18",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.5,
    shadowRadius: 48,
    elevation: 20,
  },
};

export const DARK_GRADIENTS = {
  brand: ["#8A2BE2", "#FF4D8D"], // The "Pulse" to "Creative Pink"
  primary: ["#DCB8FF", "#8A2BE2"],
  surface: ["#1B1A26", "#12121D"],
  glass: ["rgba(52,52,64,0.4)", "rgba(52,52,64,0.2)"],
  overlay: ["rgba(18,18,29,0)", "rgba(18,18,29,0.95)"],
};

export const LIGHT_GRADIENTS = {
  brand: ["#7B35E8", "#E6488B"],
};

export const GRADIENTS = DARK_GRADIENTS;

export const getColors = (mode = "dark") =>
  mode === "light" ? LIGHT_COLORS : DARK_COLORS;
export const getGradients = (mode = "dark") =>
  mode === "light" ? LIGHT_GRADIENTS : DARK_GRADIENTS;
