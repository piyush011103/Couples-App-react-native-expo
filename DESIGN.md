# Design System: The Ethereal Connection

This document outlines the design tokens, typography, and component styling rules for the **Welcome** project (ID: `8528213988925980536`). This system is designed to create a "High-End Editorial Experience" that feels private, premium, and emotionally resonant.

## 1. Creative North Star: "The Ethereal Connection"
The UI acts as a digital sanctuary, bridging physical distance through atmospheric depth and tactile elegance. It embraces intentional asymmetry, overlapping glass surfaces, and a "breathing" composition.

---

## 2. Color Palette & Surface Philosophy

The palette is rooted in the depth of the night sky, punctuated by the vibrant energy of a digital heartbeat.

### Primary Colors
| Token | HEX | Usage |
| :--- | :--- | :--- |
| **Primary (The Pulse)** | `#DCB8FF` | High-intent actions and brand moments. |
| **Primary Container** | `#8A2BE2` | Container backgrounds for primary elements. |
| **Secondary (The Glow)** | `#FFB1C4` | Romantic triggers, notifications, partner interactions. |
| **Secondary Container** | `#B20055` | Secondary action containers. |

### Surface & Background
| Token | HEX | Alpha | Usage |
| :--- | :--- | :--- | :--- |
| **Surface (Base)** | `#12121D` | 100% | The deep, desaturated base ("The Void"). |
| **Surface Dim** | `#12121D` | 100% | Level 0 elevation. |
| **Surface Container Low** | `#1B1A26` | 100% | Level 1: Main sections. |
| **Surface Container** | `#1F1E2A` | 100% | Intermediate elevation. |
| **Surface Container High**| `#292935` | 60% | Level 2: Cards and modules. |
| **Surface Container Highest**| `#343440` | 40-60% | Level 3: High-level cards/Glassmorphism. |
| **Surface Bright** | `#383845` | - | Floating actions with backdrop-blur. |

### Typography Colors
| Token | HEX | Usage |
| :--- | :--- | :--- |
| **On Surface** | `#E3E0F1` | Primary text (avoid pure #FFFFFF). |
| **On Surface Variant** | `#CFC2D7` | Secondary text, reduces eye strain. |
| **Outline** | `#988CA0` | Subtle boundaries. |

### The "No-Line" Rule
Traditional 1px solid borders are prohibited. Structural boundaries are defined by background color shifts or tonal transitions. Use a 1px border with `outline_variant` at **15% opacity** only if strictly necessary.

---

## 3. Typography Scale

Utilizes **Manrope** for structural clarity and **Plus Jakarta Sans** for utility.

| Level | Size | Font Family | Usage |
| :--- | :--- | :--- | :--- |
| **Display LG** | 3.5rem | Manrope | Milestone counters, large headers. |
| **Headline MD** | 1.75rem | Manrope | Screen titles, sectional headers. |
| **Body LG** | 1.0rem | Manrope | Long-form messages, connection text. |
| **Label MD** | 0.75rem | Plus Jakarta Sans | Timestamps, micro-copy (all-caps, +0.05em tracking). |

---

## 4. Component Styling Rules

### Buttons
- **Primary**: Linear gradient from `#8A2BE2` to `#FF4D8D` (45°). Radius: `xl` (1.5rem).
- **Secondary**: Glass-effect (`surface_container_high` @ 30%) with a secondary ghost border (15% opacity).
- **Interaction**: On hover/press, increase backdrop-blur and scale to 1.02x.

### Glassmorphism
- **Material**: `surface_container_highest` at 40-60% opacity.
- **Glass Effect**: `backdrop-blur` of 20px to 40px is required for all glass elements.

### Navigation (Floating)
- **Shape**: "Pill" shape (Radius: `full`).
- **Position**: Floating 24px from the bottom.
- **Visuals**: `surface_container_highest` @ 50% opacity with 32px backdrop-blur.
- **Active State**: Icons use `secondary` color with a soft neon underglow.

### Input Fields
- **Background**: `surface_container_lowest`.
- **Corner Radius**: `xl` (1.5rem).
- **Icons**: Encased in a circular glass container within the input.
- **Error State**: Soft glow using `error` (#FFB4AB) around the border.

---

## 5. Elevation & Depth
- **Tonal Layering**: Achieve depth by stacking surfaces (e.g., Level 2 card on Level 0 base).
- **Ambient Shadows**: Use extra-diffused shadows for floating elements only.
  - *Spec:* `0px 24px 48px rgba(13, 13, 24, 0.5)`.
- **Neon Accents**: Use 2px outer glow (`box-shadow`) with `secondary` (#FFB1C4) for active/live states.

---

## 6. Layout Principles
- **Editorial Asymmetry**: Use intentional offset margins (e.g., 24px left, 32px right) for headlines.
- **Shared Timeline**: No divider lines. Use vertical whitespace (Spacing Scale 8 or 10) and alternating surface heights.
- **Softness**: Minimum corner radius of 16px (`lg`). No sharp corners.
