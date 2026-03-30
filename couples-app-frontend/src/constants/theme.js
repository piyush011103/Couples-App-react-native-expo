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
  online: "#4ADE80",
  offline: "#94A3B8",

  // ── Borders (The No-Line Rule) ────────────────────
  border: "rgba(152,140,160,0.15)", // Subtle outline
  borderLight: "rgba(227,224,241,0.08)",

  // ── Glassmorphism ─────────────────────────────────
  glass: "rgba(52,52,64,0.50)", // surface_container_highest @ 50%
  glassBorder: "rgba(152,140,160,0.15)",
  glassHighlight: "rgba(255,255,255,0.06)",
};

export const LIGHT_COLORS = {
  // ── Core backgrounds (The Ethereal Editor) ────────
  background: "#FEF9EF",
  surface: "#FEF9EF",
  surfaceDim: "#DEDAD0",
  surfaceContainerLowest: "#FFFFFF",

  // ── Surface Containers (Layering) ─────────────────
  surfaceContainerLow: "#F8F3E9",
  surfaceContainer: "#F2EDE4",
  surfaceContainerHigh: "#ECE8DE",
  surfaceContainerHighest: "#E7E2D8",
  surfaceBright: "#FEF9EF",

  // ── Brand / Portal (Primary) ──────────────────────
  primary: "#A53B22",
  primaryContainer: "#FF7E5F",
  primaryFixed: "#FFDAD2",
  primaryFixedDim: "#FFB4A3",

  // ── Branding / Accent (The Warm Glow) ─────────────
  secondary: "#895121",
  secondaryContainer: "#FEB47B", // Soft Orange/Brown
  accent: "#FF7E5F", 

  // ── Text hierarchy (Editorial) ───────────────────
  text: "#1D1C16", // onSurface
  textSub: "#57423D", // onSurfaceVariant
  textMuted: "#8B716B", // outline

  // ── Status (Soft Tones) ──────────────────────────
  error: "#BA1A1A",
  errorContainer: "#FFDAD6",
  success: "#2E7D32", 
  warning: "#F57C00",
  online: "#A53B22",
  offline: "#8B716B",

  // ── Borders (The No-Line Rule) ────────────────────
  border: "rgba(139,113,107,0.12)", // Subtle outline
  borderLight: "rgba(139,113,107,0.06)",

  // ── Glassmorphism ─────────────────────────────────
  glass: "rgba(255,255,255,0.60)", // surface_container_lowest @ 60% with blur
  glassBorder: "rgba(139,113,107,0.08)",
  glassHighlight: "rgba(255,255,255,0.40)",
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
  brand: ["#A53B22", "#FF7E5F"], // Terracotta to Coral
  primary: ["#FF7E5F", "#A53B22"],
  surface: ["#FEF9EF", "#F2EDE4"],
  glass: ["rgba(255,255,255,0.7)", "rgba(255,255,255,0.4)"],
  overlay: ["rgba(254,249,239,0)", "rgba(254,249,239,0.95)"],
};

export const GRADIENTS = DARK_GRADIENTS;

export const getColors = (mode = "dark") =>
  mode === "light" ? LIGHT_COLORS : DARK_COLORS;
export const getGradients = (mode = "dark") =>
  mode === "light" ? LIGHT_GRADIENTS : DARK_GRADIENTS;
