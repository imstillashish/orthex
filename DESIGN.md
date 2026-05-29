# Orthex — Design System

## Overview

The Orthex extension uses a premium, highly dynamic interface combining **editorial typography**, **glassmorphism**, and **fluid background animations**. It features two distinct but cohesive surfaces:
1. **The Extension Popup**: A compact, utility-driven interface using modern grotesk typography (`Bricolage Grotesque`) and a darker, highly saturated fluid background.
2. **The Content Panel (Injected into LeetCode)**: An editorial, spacious interface using serif display typography (`Cormorant Garamond`) that draws inspiration from the Claude.com aesthetic, adapted for an in-editor overlay.

**Key Characteristics:**
- **Fluid Gradient Backgrounds**: Deep, animated radial blobs blurred intensely (`40px` blur) to create a breathing, alive foundation.
- **Glassmorphism**: UI containers float above the background with `backdrop-filter: blur(12px)` and semi-transparent backgrounds.
- **Micro-animations**: Elements cascade in with `slide-up` animations. Interactive elements like tags and cards scale up seamlessly on hover.
- **Dual Typography**: The popup feels modern and punchy (`Bricolage Grotesque`), while the main analysis panel feels literary and considered (`Cormorant Garamond` + `Inter`).
- **Signature Blue**: Ocean blue (`#1591dc`) serves as the primary accent across both surfaces.

## Colors

### Brand & Accent
- **Primary Blue** (`var(--c-primary)` / `var(--lca-primary)`): `#1591dc`. Used for main CTAs, active toggles, graph lines, and active states.
- **Primary Deep** (`var(--c-primary-deep)` / `var(--lca-primary-active)`): `#2c5ead`. Hover state for primary buttons.
- **Teal Accent** (`var(--lca-teal)`): `#5db8a6`. Used for "Good" performance tier (`O(log n)`).
- **Amber Accent** (`var(--lca-amber)`): `#e8a55a`. Used for "Fair" performance tier (`O(n log n)`).

### Surfaces
- **Canvas** (`#f4f8fb`): The pristine ice off-white base.
- **Glass Light** (`rgba(250, 249, 245, 0.8)`): Used for standard widget panels and sections with backdrop blurs.
- **Glass Dark / Header** (`rgba(24, 23, 21, 0.85)`): Used for the popup header and dark mode widgets.
- **Card Backgrounds** (`#e0ebf3` / `rgba(255, 255, 255, 0.7)`): Slightly distinguished containers resting inside glass panels.
- **Hairlines** (`rgba(32,32,32,0.12)` / `#dbe4eb`): Used for subtle component borders and dividers.

### Semantic
- **Success** (`#2b9a66` / `#5db872`): "Optimal" performance (`O(1)`), ready status indicators.
- **Warning** (`#f59e0b` / `#d4a017`): "Poor" performance (`O(n^2)`), warnings.
- **Error** (`#ef4444` / `#c64545`): "Terrible" performance (`O(2^n)`), failed analysis states.

### Gradient Animation Palette
The background uses a blend of `screen` (in popup) or `hard-light` (in panel) with moving radial blobs:
- Start/End base: `rgb(24, 23, 21)` to `rgb(40, 38, 35)`.
- Blobs: Blue (`#1591dc`), Light Blue (`#4bb8fa`), Dark Blue (`#2c5ead`), Pale Blue (`#c4e2f5`).

## Typography

### Font Stack
- **Popup Display**: `Bricolage Grotesque` — used for headers and stat values. 
- **Panel Display**: `Cormorant Garamond` (fallback `Tiempos Headline`) — used for main widget titles. Gives the panel an editorial, considered voice.
- **Body**: `Inter` — standard sans-serif for running text, labels, and descriptions.
- **Monospace**: `JetBrains Mono` — used for code snippets, time/space complexity values, and terminal-like outputs.

### Hierarchy & Usage
- **Popup Title** (`15px`, `700`, `-0.3px` tracking): `Bricolage Grotesque`.
- **Panel Widget Title** (`18px`, `400`, `-0.3px` tracking): `Cormorant Garamond`.
- **Stat Values** (`18px`, `700`, `-0.5px` tracking): `Bricolage Grotesque`.
- **Section/Label Text** (`10px`-`12px`, `500`/`600`, uppercase): `Inter` with generous letter-spacing (`0.5px`-`0.8px`).
- **Body Text** (`13px`-`14px`, `400`): `Inter` with `1.5` line height.

## Layout & Containers

### Border Radius (`--r-sm`, `--r-md`, `--r-lg`, `--r-full`)
- **4px - 6px**: Small badges, inline tags, verdicts.
- **8px - 10px**: Buttons, inputs, stat cards.
- **12px - 16px**: Main content cards, graph wrappers.
- **9999px**: Toggles, pill badges, inputs (in popup).

### Glassmorphism System
Virtually all containers sit on top of the `.lca-bg-anim` or `.lca-gradient-bg`. They achieve depth not through heavy drop shadows, but through semi-transparent backgrounds and `backdrop-filter: blur(12px)`.

### Panel Border Styling
The main injected content panel uses a unique decorative border system:
- A sharp `1px solid var(--lca-primary)` border (no border radius).
- A dot pattern background: `radial-gradient(var(--lca-primary-border) 1px, transparent 1px)`.
- Four absolute-positioned corner squares (8x8px) styled with linear gradients to create a technical, HUD-like frame.

## Components

### Buttons & Toggles
- **Primary Button**: Solid blue (`#1591dc`), rounded corners, white text. Scales down (`transform: scale(0.98)`) on active state.
- **Toggle Switch**: Pill-shaped track. Active state uses primary blue, with a white circular thumb carrying a subtle shadow.
- **Tags (`.lca-tag`)**: Pill-shaped. Solid (`.lca-tag-s`) or outlined (`.lca-tag-o`). They scale to `1.04` on hover.

### Stats & Mini Cards
- **Stat Strip (Popup)**: A horizontal flex layout separated by hairline dividers. Values are large `Bricolage Grotesque`, labels are small, uppercase `Inter`.
- **Mini Cards (Panel)**: Flex-based metric cards (`.lca-card`). They lift up (`translateY(-2px)`) and gain a soft shadow on hover. Used to display complexity grades.

### Loading States
- **Tetris Loader (`.lca-tetris`)**: A grid of `7x7px` cells that scale up and fill with primary color, or pulse when clearing.
- **Skeleton Shimmer (`.lca-skel`)**: Linear gradient background animating its background-position (`lca-shim` keyframes).
- **Cascading Entrance**: All direct children of `.lca-widget` animate in with `lca-slide-up`, staggered by `0.05s` delays.

### Complexity Graph (`.lca-svg-graph`)
- **Grid Lines**: Dashed (`2, 4`), subtle opacity.
- **Complexity Curves**: Smooth SVG paths (`.lca-curve`), transparent by default (`0.35`), becoming opaque and thicker on hover. Color-coded by complexity (Green for `O(1)`, Red for `O(2^n)`).
- **Plotted Nodes**: Circular dots that expand on hover (`r: 7.5px`). Target dots pulse continuously using the `lca-pulse-ani` keyframe.
- **Tooltips**: Floating, absolutely positioned dark glass tooltips (`rgba(24, 23, 21, 0.95)`) that snap into visibility on hover.

## Animations

- **`moveInCircle` / `moveVertical` / `moveHorizontal`**: Long-running (12s-40s) translations and rotations applied to gradient blobs.
- **`lca-slide-up`**: A standard entrance animation (`translateY(8px)` to `0`, opacity `0` to `1`) using an easing curve `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- **`lca-pulse-ani`**: Used for graph nodes. A stroke expanding from `4px` to `15px` while fading out over `2s`.
- **`lca-dash`**: A continuous linear movement of the `stroke-dashoffset` for the optimal target dashed line.
