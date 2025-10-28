# Move10K - Base Mini App Redesign Specification
**Apple Design Award Aesthetic meets Modern Web3**

## Design Philosophy
Contemporary • Minimalist • Dimensional
Clean layouts with subtle depth, motion, and emotional character

## Core References
- **Coinbase Wallet**: Clean crypto UI, card-based layouts
- **Apple Weather**: Smooth gradients, dimensional cards, physics-based motion
- **Linear.app**: Minimal color palette, generous whitespace, confident typography
- **Notion**: Hierarchy clarity, subtle interactions
- **Framer**: Smooth animations, dimensional depth

---

## 1. Color System

### Base Brand Colors
```css
/* Primary - Base Blue */
--color-base-blue: #0052FF;
--color-base-blue-light: #5B8DEF;
--color-base-blue-dark: #0042CC;

/* Base Blue Scale */
--blue-50: #EFF6FF;
--blue-100: #DBEAFE;
--blue-200: #BFDBFE;
--blue-300: #93C5FD;
--blue-400: #60A5FA;
--blue-500: #0052FF;  /* Primary */
--blue-600: #0042CC;
--blue-700: #003399;
--blue-800: #002266;
--blue-900: #001133;
```

### Accent Colors (Minimal Palette)
```css
/* Success - Soft Green */
--color-success: #10B981;
--success-50: #ECFDF5;
--success-500: #10B981;

/* Warning - Soft Amber */
--color-warning: #F59E0B;
--warning-50: #FFFBEB;
--warning-500: #F59E0B;

/* Neutral Base (Warm) */
--gray-0: #FFFFFF;
--gray-25: #FCFCFC;
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;
```

### Gradient System
```css
--gradient-base: linear-gradient(135deg, #0052FF 0%, #5B8DEF 100%);
--gradient-success: linear-gradient(135deg, #10B981 0%, #059669 100%);
--gradient-glow: radial-gradient(circle at 50% 0%, rgba(0, 82, 255, 0.15), transparent 70%);
--gradient-shimmer: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
```

---

## 2. Typography System

### Font Stack
```css
--font-primary: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI",
                system-ui, sans-serif;
--font-mono: "SF Mono", "Roboto Mono", "Consolas", monospace;
```

### Type Scale (Confident Weight Pairing)
```css
/* Display - Hero numbers */
--text-display: 64px;    /* font-weight: 700 */
--text-hero: 48px;       /* font-weight: 700 */

/* Headings */
--text-h1: 36px;         /* font-weight: 700 */
--text-h2: 28px;         /* font-weight: 600 */
--text-h3: 22px;         /* font-weight: 600 */
--text-h4: 18px;         /* font-weight: 600 */

/* Body */
--text-lg: 17px;         /* font-weight: 400-500 */
--text-base: 15px;       /* font-weight: 400-500 */
--text-sm: 13px;         /* font-weight: 400-500 */
--text-xs: 11px;         /* font-weight: 500-600 */

/* Line Heights (Generous) */
--leading-tight: 1.1;
--leading-snug: 1.4;
--leading-normal: 1.6;
--leading-relaxed: 1.75;
```

---

## 3. Spacing & Grid System

### 8pt Grid Base
```css
--space-0: 0;
--space-1: 4px;    /* 0.25rem */
--space-2: 8px;    /* 0.5rem */
--space-3: 12px;   /* 0.75rem */
--space-4: 16px;   /* 1rem */
--space-5: 20px;   /* 1.25rem */
--space-6: 24px;   /* 1.5rem */
--space-8: 32px;   /* 2rem */
--space-10: 40px;  /* 2.5rem */
--space-12: 48px;  /* 3rem */
--space-16: 64px;  /* 4rem */
--space-20: 80px;  /* 5rem */
```

### Container Sizes
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
```

---

## 4. Depth & Shadows (Dimensional Layers)

### Shadow System
```css
/* Subtle Elevation */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);

/* Card Elevation */
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.03);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04);

/* Floating Elements */
--shadow-xl: 0 16px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.06);
--shadow-2xl: 0 24px 64px rgba(0, 0, 0, 0.16), 0 12px 24px rgba(0, 0, 0, 0.08);

/* Colored Shadows */
--shadow-base-glow: 0 8px 32px rgba(0, 82, 255, 0.15);
--shadow-success-glow: 0 8px 32px rgba(16, 185, 129, 0.15);
```

### Glass Effects
```css
--glass-subtle: rgba(255, 255, 255, 0.8);
--glass-strong: rgba(255, 255, 255, 0.95);
--glass-blur: blur(24px) saturate(180%);
```

---

## 5. Border Radius (Soft, Approachable)

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-2xl: 32px;
--radius-full: 9999px;
```

---

## 6. Animation System (Physics-Based)

### Easing Functions
```css
/* Spring curves */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);

/* Apple-style */
--ease-apple: cubic-bezier(0.25, 0.1, 0.25, 1);
```

### Duration
```css
--duration-fast: 150ms;
--duration-base: 250ms;
--duration-slow: 400ms;
--duration-slower: 600ms;
```

### Framer Motion Configs
```javascript
export const springConfig = {
  type: "spring",
  damping: 25,
  stiffness: 300,
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: springConfig,
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: springConfig,
};
```

---

## 7. Iconography

### Icon Library: Lucide React
- Consistent 2px stroke width
- 24px default size (adjustable)
- Rounded corners for approachability
- Match brand geometry

### Usage
```jsx
<Activity
  size={24}
  strokeWidth={2}
  className="text-gray-700"
/>
```

---

## 8. Component Patterns

### Card Anatomy
```
┌─────────────────────────────────┐
│  Glow gradient (optional)       │
│  ┌─────────────────────────┐   │
│  │ Glass/white background   │   │
│  │ Shadow: --shadow-lg      │   │
│  │ Radius: --radius-xl      │   │
│  │ Padding: --space-8       │   │
│  │                          │   │
│  │ [Content with generous   │   │
│  │  spacing and hierarchy]  │   │
│  │                          │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Button Hierarchy
```
Primary:   Base blue gradient, white text, shadow-base-glow
Secondary: White bg, gray text, shadow-sm
Ghost:     Transparent, gray text, no shadow
```

### Micro-interactions
- **Hover**: Lift 2px, enhance shadow
- **Press**: Scale 0.98, reduce shadow
- **Focus**: Base blue ring, 4px offset
- **Success**: Confetti or checkmark spring animation

---

## 9. Redesigned Components

### StepsCard
**Before**: Flat white card, basic progress bar, grid stats
**After**:
- Dimensional card with glow gradient backdrop
- Large, confident step count (--text-display)
- Circular progress ring with gradient stroke
- Glass stat pills below
- Smooth number counter animation
- Celebration animation on goal reached

### DashboardHeader
**Before**: Standard header bar
**After**:
- Minimal top bar with glass effect
- Avatar with subtle shadow
- Generous padding (--space-8)
- Smooth slide-in animation

### Buttons
**Before**: Basic rounded buttons
**After**:
- Gradient backgrounds for primary actions
- Spring-based hover/press animations
- Ripple effect on touch
- Loading states with shimmer

---

## 10. Layout Principles

### Negative Space
- Minimum padding: --space-6 (24px)
- Card gaps: --space-8 (32px)
- Section spacing: --space-16 (64px)

### Grid Alignment
- 8pt grid system
- Optical alignment over mathematical
- Generous breathing room

### Hierarchy
1. **Primary action**: Gradient button, largest hit target
2. **Step count**: Display size (64px), bold weight
3. **Stats**: Body size (15px), medium weight
4. **Labels**: Small size (13px), gray color

---

## 11. Accessibility Standards

- Contrast ratio: WCAG AA minimum (4.5:1 for text)
- Focus indicators: 4px blue ring
- Reduce motion: Respect `prefers-reduced-motion`
- Touch targets: Minimum 44x44px
- Keyboard navigation: Full support

---

## 12. Implementation Checklist

- [ ] Install Framer Motion
- [ ] Create refined design tokens CSS file
- [ ] Build circular progress component
- [ ] Redesign StepsCard with animations
- [ ] Redesign DashboardHeader
- [ ] Enhanced button components
- [ ] Add number counter animation
- [ ] Add celebration confetti effect
- [ ] Test on mobile devices
- [ ] Verify accessibility
- [ ] Deploy to production
