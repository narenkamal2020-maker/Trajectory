---
name: Orbital Precision
colors:
  surface: '#11131d'
  surface-dim: '#11131d'
  surface-bright: '#373944'
  surface-container-lowest: '#0b0e18'
  surface-container-low: '#191b26'
  surface-container: '#1d1f2a'
  surface-container-high: '#272935'
  surface-container-highest: '#323440'
  on-surface: '#e1e1f1'
  on-surface-variant: '#d3c5ac'
  inverse-surface: '#e1e1f1'
  inverse-on-surface: '#2e303b'
  outline: '#9c8f79'
  outline-variant: '#4f4633'
  surface-tint: '#f8be1d'
  primary: '#ffd371'
  on-primary: '#3f2e00'
  primary-container: '#edb40b'
  on-primary-container: '#614800'
  inverse-primary: '#785a00'
  secondary: '#ffb871'
  on-secondary: '#4a2800'
  secondary-container: '#da8001'
  on-secondary-container: '#472600'
  tertiary: '#ffceb9'
  on-tertiary: '#561f00'
  tertiary-container: '#ffa87e'
  on-tertiary-container: '#833300'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdf9d'
  primary-fixed-dim: '#f8be1d'
  on-primary-fixed: '#251a00'
  on-primary-fixed-variant: '#5b4300'
  secondary-fixed: '#ffdcbe'
  secondary-fixed-dim: '#ffb871'
  on-secondary-fixed: '#2d1600'
  on-secondary-fixed-variant: '#6a3c00'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb693'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7a3000'
  background: '#11131d'
  on-background: '#e1e1f1'
  surface-variant: '#323440'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0em
  body-lg:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0em
  body-md:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0.01em
  body-sm:
    fontFamily: Outfit
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-telemetry:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies an aerodynamic, data-dense spatial telemetry interface tailored for ambitious engineers, technical specialists, and leaders navigating high-stakes career moves. The aesthetic synthesizes the quiet discipline of orbital mechanics with the focused warmth of propulsion heat signatures. 

The emotional tone balances analytical rigor and kinetic acceleration: calm, highly competent, forward-directed, and technologically elite. By fusing frosted obsidian telemetry panels, warm luminescent velocity arcs, and high-precision typographic metrics, the interface avoids generic SaaS motifs in favor of an authentic flight director console aesthetic. It treats technical interview preparation and career trajectories not as checklists, but as precision ascents.

## Colors

The palette draws directly from the transition between deep space void and atmospheric re-entry luminescence.

- **Obsidian Voids (Neutrals):** Anchored by the deepest cosmos canvas `#070913`, tiered through `#0A0E1C` (structural baseline) up to `#121829` (elevated telemetry modules). Neutral text relies on crisp starlight silvers: `#F1F4F9` for primary values, `#94A3B8` for secondary labels, and `#475569` for inert borders.
- **Thermal Vector Accents (Primary & Warm Streaks):** `#EDB40B` (Solar Amber) serves as the primary focal tone for active status indicators, progress rings, and target trajectory nodes. `#FF9E2C` (Ion Amber) and `#FF6B00` (Kinetic Flame) handle secondary propulsion arcs, velocity surges, and interactive HUD hover states.
- **Atmospheric Support:** Subdued cyan `#00E5FF` and deep indigo `#1E293B` may be used strictly for micro-scalar data points, timeline crosshairs, and comparison vectors.

## Typography

The typographic hierarchy orchestrates clean architectural geometry with absolute metric precision.

- **Display & Headlines:** Space Grotesk offers sharp mechanical incisions and geometric structural balance, communicating engineered momentum across major milestones and telemetry readouts.
- **Body & Longform:** Outfit delivers high legibility and geometric warmth, balancing deep cosmic contrast against dense interview breakdowns and technical feedback without eye strain.
- **Technical & Metric Layer:** JetBrains Mono powers system indicators, coordinates, status counters, timestamps, and interactive code scenarios. Uppercase tracking is pushed wide (`0.08em`) on micro telemetry labels to mirror avionics displays.

## Layout & Spacing

The interface uses a 12-column dynamic grid designed around tactical modules, situational HUD panels, and persistent trajectory paths. 

- **Desktop (1200px+):** 12-column layout with 24px gutters (`1.5rem`) and 32px canvas margins (`2rem`). Panels align along unified metric axes to maintain cockpit-like density without visual clutter. Trajectory curves flow asynchronously across structural borders.
- **Tablet (768px - 1199px):** 8-column layout with 20px gutters. Secondary telemetry bars collapse into collapsible split drawers or sliding tray sheets.
- **Mobile (< 768px):** 4-column layout with 16px gutters (`gutter-sm`) and 16px margins (`margin-sm`). High-density metric groups convert into horizontally scrollable ticker strips, and interactive trajectory nodes collapse into step-linked vertical milestones.

## Elevation & Depth

Visual hierarchy relies on slate glassmorphism, surface translucency, and focused thermal back-glows rather than traditional dropping shadows:

- **Deep Void Base:** `#070913` solid foundation with subtle radial noise and faint coordinate gridlines (opacity 0.04).
- **Surface Level 1 (Telemetry Panels):** Obsidian slate tinted at `rgba(10, 14, 28, 0.72)` with an intense backdrop blur (`20px`) and a crisp `1px` inner rim border of `rgba(255, 255, 255, 0.08)`.
- **Surface Level 2 (Floating Inspect Panels & Flyouts):** Higher contrast glass `rgba(18, 24, 41, 0.85)` with `28px` blur and high-precision top highlight borders (`rgba(237, 180, 11, 0.3)` gradient running down to transparent).
- **Luminescence & Vector Glows:** High-priority elements use radiant aura emission rather than drop shadows: `box-shadow: 0 0 24px rgba(237, 180, 11, 0.25), 0 0 4px rgba(255, 158, 44, 0.4)`. Trajectory arcs use SVG drop-filters producing a soft 8px feather along the path.

## Shapes

The design uses tight, machined corner profiles (`roundedness: 1`, 0.25rem baseline) to reflect aerospace engineering consoles, technical instruments, and cockpit displays.

- **Panels & Telemetry Modules:** Rounded at `0.5rem` (`rounded-lg`) to balance structural rigour with modern ergonomics.
- **Buttons, Badges, and Input Fields:** Retain the baseline `0.25rem` radius for a crisp, machined edge. 
- **Orbital Orbit Nodes & Status Beacons:** Kept fully circular (`rounded-full`) to differentiate spatial coordinates and progress gauges from structural frames.

## Components

### Buttons
- **Primary Kinetic Button:** Jet-black base overlaid with a linear trajectory gradient (`#EDB40B` to `#FF6B00`), black bold typography (`JetBrains Mono`), `0.25rem` radius, and a subtle amber perimeter flare on hover (`0 0 16px rgba(237, 180, 11, 0.45)`).
- **Secondary Glass Action:** Translucent slate (`rgba(255, 255, 255, 0.04)`), `1px` border of `rgba(255, 255, 255, 0.15)`, and starlight text. Hover transitions border color to `#FF9E2C` with an inner starlight sheen.
- **HUD Ghost Button:** Transparent background, monospaced uppercase tracking, bracketed by kinetic corner notches (`[` and `]`).

### Progress Rings & Trajectory Curves
- Dynamic SVG rings featuring a slate track (`rgba(255, 255, 255, 0.06)`) and an illuminated stroke driving from `#FF6B00` through `#EDB40B`. Active nodes radiate a pulsing concentric beacon.
- Orbit curve connectors are rendered with variable stroke widths that thicken as user interview readiness increases.

### Cards & Telemetry Containers
- Framed in slate glass with a top hairline highlight. Card headers feature monospaced coordinate badges (e.g., `TRJ-SYS // 04.9`) in `#94A3B8`.
- Metric tiles emphasize numeric readouts in Space Grotesk, accompanied by micro vector charts illustrating trajectory velocity.

### Inputs & Terminal Fields
- Dark recessed input fields (`#0A0E1C`) bounded by `1px` subtle slate borders (`#1E293B`).
- Active focus state instantly ignites an amber edge glow (`#EDB40B`) with zero layout shift, coupled with an active monospaced terminal cursor.

### Chips & Status Indicators
- Low-profile status tags (`0.25rem` radius) utilizing semi-transparent status colors (e.g., `#EDB40B` at 12% fill) paired with a high-saturation 6px core beacon dot and `JetBrains Mono` uppercase text.