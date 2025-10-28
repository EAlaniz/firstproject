# Move10K UX Redesign Proposal
## Apple/Linear/Base Hybrid — Minimal, Intuitive, Emotionally Intelligent

---

## 📊 Current State Analysis

### Current User Flow
```
Landing Page (Unauthenticated)
  ↓ "Get Started"
  ↓ Wallet Connection Modal
  ↓
Dashboard (Authenticated)
  ├─ Steps Card (Primary Focus)
  ├─ Wearables Manager
  ├─ Quick Actions Grid (Social, Messages, Rewards)
  ├─ Recent Activity Feed
  └─ Quick Actions Section

Secondary View: Messages (XMTP)
  └─ Full-screen messaging interface
```

### Current Navigation Structure
- **Primary**: Dashboard (default) ⟷ Messages (toggle)
- **Secondary**: Mobile hamburger menu (Settings, Disconnect)
- **Modals**: Wallet connector, XMTP initialization

### Identified UX Issues
1. **Cognitive Overload**: Too many competing CTAs (Social Hub, Messages, Rewards, Wearables)
2. **Unclear Hierarchy**: Recent Activity and Quick Actions sections repeat functionality
3. **Disconnected Flows**: Wearables, Steps, and Rewards feel siloed rather than unified
4. **Onboarding Gap**: No progressive disclosure—users hit everything at once after wallet connection
5. **Navigation Confusion**: Two-state toggle (Dashboard/Messages) limits future expansion
6. **Permission Friction**: Multiple banners (Health, Whoop, XMTP) create visual noise
7. **Reward Feedback**: Token rewards lack emotional payoff or celebration

---

## 🎯 Redesigned UX Structure

### Core Philosophy
**"Depth through Simplicity"** — Each screen has one primary purpose, revealed through gentle motion and clear hierarchy.

---

## 🗺️ 1. New Navigation Structure

### Primary Navigation (Bottom Tab Bar — Mobile First)
```
┌────────────────────────────────────────┐
│                                        │
│         [Content Area]                 │
│                                        │
└────────────────────────────────────────┘
┌────────────────────────────────────────┐
│  🏃  Today    💬  Connect   🏆  Rewards │
│  [Active]    [Default]     [Default]   │
└────────────────────────────────────────┘
```

#### Tab 1: Today (Home)
- **Purpose**: Daily progress and immediate actions
- **Content**: Steps ring, daily goal, streak, quick wearable status
- **CTA**: "Sync Now" or "Connect Device" (contextual)

#### Tab 2: Connect (Social + Messaging)
- **Purpose**: Community, conversations, sharing
- **Content**: XMTP messages, share achievements, friend activity feed
- **CTA**: "Start Conversation" or "Share Progress"

#### Tab 3: Rewards (Gamification + Wallet)
- **Purpose**: Token balance, reward history, redemption
- **Content**: Token count, reward tiers, achievement badges, wallet info
- **CTA**: "Claim Rewards" or "View History"

### Secondary Navigation (Top Right Avatar Menu)
```
┌─ Profile Avatar ─────────────────┐
│  [Avatar] John Doe               │
│  0x1234...5678                   │
├──────────────────────────────────┤
│  ⚙️  Settings                    │
│  🔗  Connected Devices           │
│  🎯  Set Goals                   │
│  ℹ️  Help & Support              │
│  🚪  Disconnect Wallet           │
└──────────────────────────────────┘
```

### Desktop Navigation (Persistent Sidebar)
```
┌──────┬───────────────────────────┐
│ 🏃   │                           │
│Today │                           │
│      │                           │
│ 💬   │      Content Area         │
│Conn  │                           │
│      │                           │
│ 🏆   │                           │
│Rwds  │                           │
│      │                           │
│ ━━━  │                           │
│ 👤   │                           │
│Menu  │                           │
└──────┴───────────────────────────┘
```

**Rationale**:
- Mimics Apple Health, Coinbase Wallet tab structure
- Removes cognitive load of toggling between views
- Scales to add future features (Challenges, Leaderboard, Shop)
- Provides spatial consistency (always know where you are)

---

## 🎬 2. Motion & Animation Principles

### Core Animation Philosophy
**"Physics-Based Narrative"** — Every motion should feel natural, intentional, and emotionally resonant.

### Animation System

#### Timing Function Hierarchy
```css
/* Primary: Organic, confident */
--ease-primary: cubic-bezier(0.34, 1.56, 0.64, 1); /* Spring overshoot */

/* Secondary: Smooth, refined */
--ease-secondary: cubic-bezier(0.4, 0, 0.2, 1); /* Apple ease-out */

/* Tertiary: Instant feedback */
--ease-micro: cubic-bezier(0.25, 0.1, 0.25, 1); /* Snappy */

/* Exit: Quick, subtle */
--ease-exit: cubic-bezier(0.5, 0, 1, 1); /* Fast acceleration */
```

#### Duration Scale
```css
--duration-instant: 100ms;  /* Hover states, button press */
--duration-quick: 200ms;    /* Fade in/out, micro-interactions */
--duration-base: 350ms;     /* Card transitions, page changes */
--duration-slow: 600ms;     /* Complex animations, celebrations */
--duration-emphasis: 1000ms; /* Goal completion, rewards */
```

### Key Animation Patterns

#### 1. **Page Transitions** (Apple-inspired)
```
Entry: Fade + Scale (0.95 → 1) + Y-translate (20px → 0)
Exit: Fade + Scale (1 → 0.97) + Blur (0 → 4px)
Duration: 350ms ease-primary
```

#### 2. **Card Interactions** (Linear-inspired)
```
Idle: shadow-sm, scale(1)
Hover: shadow-lg, scale(1.01), y-translate(-2px)
Active: shadow-base, scale(0.99)
Duration: 200ms ease-secondary
```

#### 3. **Number Counters** (Base-inspired)
```
Steps/Tokens: Count-up animation with elastic ease
Duration: 1500ms, 60 frames
Overshoot: Slight spring past target, settle back
```

#### 4. **Progress Rings**
```
Draw: Stroke-dashoffset animation
Duration: 1000ms ease-primary
Delay: Stagger by 150ms per ring layer
Glow: Opacity pulse on completion
```

#### 5. **Goal Celebrations**
```
Trigger: When steps >= dailyGoal
Sequence:
  1. Ring completes (glow pulse) — 600ms
  2. Confetti burst from center — 800ms
  3. Success banner scales in — 400ms
  4. Haptic feedback (native)
Total: 1800ms choreographed
```

#### 6. **Micro-Interactions**
- **Button Press**: Scale 0.97, brightness 95%, shadow collapse — 100ms
- **Toggle Switch**: Background slides, thumb scales 1.1 → 1 — 200ms
- **Checkbox**: Checkmark draws with stroke-dashoffset — 250ms
- **Tab Switch**: Underline slides, icon fills — 300ms

### Gesture-Driven Motion (Mobile)

#### Pull-to-Refresh
```
Pull down: Circular spinner rotates (0° → 360°)
Release: Elastic snap back + data refresh animation
Success: Green checkmark replaces spinner
Duration: 600ms
```

#### Swipe Gestures
```
Swipe left/right on cards: Reveal actions (Share, Delete)
Threshold: 60px
Friction: Follows finger, elastic resistance
Snap: 250ms ease-out to action or reset
```

### Parallax & Depth

#### Layer System
```
Layer 0 (Background): Y-scroll × 0.3 (subtle parallax)
Layer 1 (Cards): Y-scroll × 1.0 (normal)
Layer 2 (Floating elements): Y-scroll × 1.1 (lead motion)
```

#### Glass Morphism Depth Cue
```
Foreground glass: blur(20px), opacity 0.7
Midground: blur(12px), opacity 0.5
Background mesh: blur(40px), opacity 0.3
```

---

## 🧭 3. Ideal User Onboarding Flow

### Goal: Progressive Disclosure + Emotional Connection

### Onboarding Journey (First-Time User)

#### Stage 0: Landing Page (Unauthenticated)
**Emotion**: Curiosity, Intrigue
**Copy**: "Move more. Earn more. Feel more."
**Visual**: Large circular progress ring (empty) with gentle pulse animation
**CTA**: "Start Your Journey" (gradient button)

```
Motion: Hero ring scales in (0.9 → 1) with glow
Duration: 800ms ease-primary
```

---

#### Stage 1: Wallet Connection
**Emotion**: Trust, Security
**Copy**: "Your wallet, your data. We don't store anything."
**Visual**: Minimal modal, Coinbase logo, lock icon
**CTA**: [Coinbase Smart Wallet Button]

```
Motion: Modal slides up with backdrop blur
Duration: 400ms ease-secondary
```

**Success State**:
- Green checkmark animates in
- "Welcome, [Name]" personalizes experience
- Auto-advances to Stage 2 after 1.5s

---

#### Stage 2: Goal Setting (First-Time Setup)
**Emotion**: Empowerment, Personalization
**Copy**: "What's your daily step goal?"
**Visual**: Large draggable slider (5K–15K), real-time preview ring updates
**Helper Text**: "Most people start at 7,500. You can change this anytime."

```
Interaction: Drag slider → ring fills in real-time
Haptics: Subtle tick at each 500-step increment
Duration: Instant feedback (0ms latency)
```

**CTA**: "Set My Goal" → Triggers celebration micro-animation

---

#### Stage 3: Permission Request (Health Data)
**Emotion**: Transparency, Opt-in Empowerment
**Copy**: "Let's track your steps automatically"
**Visual**: Illustration of Apple Health / Health Connect icon with animated connection line
**Options**:
- "Enable Tracking" (primary)
- "I'll connect later" (ghost button)

**Why This Matters** (expandable):
"We only read step count—nothing else. Your health data stays private."

```
Motion: Permission sheet slides up (native feel)
Success: Green connection line animates phone → 10K logo
```

**Success State**:
- "You're all set! Here's your first 100 steps." (loads real data)
- Progress ring animates from 0 to current count

---

#### Stage 4: First Achievement (Immediate Gratification)
**Emotion**: Joy, Validation
**Copy**: "You've already walked [X] steps today! 🎉"
**Visual**: Steps counter with number count-up animation, confetti burst
**Token Reward**: "+5 tokens for joining" (scales in)

```
Sequence:
  1. Steps count up (0 → X) — 1000ms
  2. Progress ring fills — 800ms (overlapping)
  3. Confetti burst — 600ms
  4. Token badge bounces in — 400ms
Total: 2000ms choreographed delight
```

**CTA**: "Explore the App" → Dismisses onboarding overlay

---

#### Stage 5: Dashboard Introduction (Contextual Tooltips)
**Emotion**: Guidance, Discovery
**Visual**: Subtle spotlight highlights each feature (one at a time)

1. **Today Tab**: "This is your home. Check daily progress here."
2. **Connect Tab**: "Share wins and chat with other movers."
3. **Rewards Tab**: "Earn tokens for every goal you crush."

```
Motion: Soft glow + scale highlight (1.02)
Dismissal: Tap anywhere or auto-advance after 3s
```

**Optional**: "Show me around" vs "I'll explore myself"

---

### Onboarding Completion Metrics
- **Time to First Value**: < 60 seconds (connection → see steps)
- **Completion Rate Target**: > 85%
- **Emotional Peaks**: 3 celebrations (wallet connect, goal set, first steps)

---

## ✍️ 4. Microcopy Tone & Voice

### Brand Voice Attributes
**Warm** • **Confident** • **Concise** • **Human**

### Writing Principles

#### 1. **Warm but Not Cheesy**
❌ "OMG you're crushing it! 🔥🔥🔥"
✅ "Nice work today. Keep it up."

❌ "Oopsie! Something went wrong 🙈"
✅ "We couldn't load your data. Try refreshing."

#### 2. **Confident, Not Bossy**
❌ "You MUST connect your wallet to continue"
✅ "Connect your wallet to get started"

❌ "COMPLETE YOUR GOAL NOW"
✅ "You're [X] steps away from your goal"

#### 3. **Concise, Not Robotic**
❌ "Your daily step count has been successfully synchronized with the server"
✅ "Steps synced"

❌ "Please wait while we process your request"
✅ "One moment..."

#### 4. **Human, Not Corporate**
❌ "Authentication required to proceed with transaction"
✅ "Sign in to continue"

❌ "An error has occurred. Error code: 0x4f2a"
✅ "Something went wrong. Try again?"

---

### Microcopy Library

#### Empty States
```
No steps yet today
"Take your first steps to get started"

No wearables connected
"Connect a device to track automatically"

No rewards earned
"Complete your first goal to earn tokens"

No messages
"Your conversations will appear here"
```

#### Success States
```
Goal completed
"Goal reached! Keep moving."

Steps synced
"Latest: [X] steps"

Wearable connected
"[Device] connected successfully"

Reward earned
"+[X] tokens earned"
```

#### Error States
```
Sync failed
"Couldn't sync. Check your connection."

Permission denied
"We need health access to track steps"

Wallet disconnected
"Reconnect your wallet to continue"

Network error
"Connection lost. Retrying..."
```

#### Loading States
```
"Syncing steps..."
"Loading your progress..."
"Connecting to [Device]..."
"Initializing wallet..."
```

#### Call-to-Actions

| Context | Button Label | Ghost Alternative |
|---------|--------------|-------------------|
| Landing | Start Your Journey | Learn More |
| Wallet | Connect Wallet | Not Now |
| Goal Setting | Set My Goal | Skip for Now |
| Health Permission | Enable Tracking | I'll Connect Later |
| Wearable Connection | Connect Device | Maybe Later |
| Goal Completion | Share Progress | Continue |
| Reward Claim | Claim Tokens | View Details |
| Messaging | Send Message | Cancel |

#### Inline Help (Tooltips)
```
Daily Goal: "Your target step count. Change anytime."
Streak: "Consecutive days hitting your goal"
Tokens: "Earned by completing daily goals"
Wearables: "Auto-sync steps from connected devices"
```

#### Celebration Copy (Goal Milestones)
```
First goal: "First goal complete! Many more to come."
7-day streak: "One week strong. Keep going."
30-day streak: "30 days! You're unstoppable."
100K steps total: "100,000 steps! Incredible."
```

---

## 🎨 5. Visual Metaphors

### Core Visual Language
**Depth** • **Light** • **Glass** • **Motion**

---

### Metaphor 1: **Depth Through Layering**

#### Layer Hierarchy
```
Layer 1 (Deepest): Mesh gradient background (static, ambient)
Layer 2: Glass cards (floating, interactive)
Layer 3: Content within cards (text, icons, data)
Layer 4 (Highest): Modals, tooltips, floating buttons
```

#### Shadow System (Depth Cues)
```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);          /* Flat elements */
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);          /* Subtle lift */
--shadow-base: 0 4px 8px rgba(0, 0, 0, 0.08);        /* Default cards */
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.10);         /* Hover state */
--shadow-xl: 0 16px 32px rgba(0, 0, 0, 0.12);        /* Modals */
--shadow-2xl: 0 24px 48px rgba(0, 0, 0, 0.15);       /* Max emphasis */

/* Colored glows for brand moments */
--shadow-base-glow: 0 8px 32px rgba(0, 82, 255, 0.15);
--shadow-success-glow: 0 8px 32px rgba(34, 197, 94, 0.20);
```

#### Implementation
- **Cards**: `shadow-base` at rest, `shadow-lg` on hover
- **Modals**: `shadow-2xl` with backdrop blur
- **Progress ring**: `shadow-base-glow` when goal reached
- **Tokens**: `shadow-success-glow` on reward earn

---

### Metaphor 2: **Light as Information**

#### Lighting Principles
1. **Bright = Active/Important**
2. **Dim = Inactive/Secondary**
3. **Glow = Success/Achievement**

#### Color Brightness Scale
```css
/* Base Blue */
--blue-50: #EFF6FF;   /* Ambient background */
--blue-100: #DBEAFE;  /* Subtle highlight */
--blue-500: #0052FF;  /* Primary brand */
--blue-600: #0047E6;  /* Hover/active */
--blue-900: #002070;  /* Text on light bg */

/* Neutral Grays */
--gray-0: #FFFFFF;    /* Pure backgrounds */
--gray-50: #FAFAFA;   /* Off-white surfaces */
--gray-100: #F5F5F5;  /* Dividers, borders */
--gray-500: #737373;  /* Secondary text */
--gray-900: #171717;  /* Primary text */
```

#### Lighting States
- **Default**: Cards at `gray-0` (white) with `shadow-base`
- **Hover**: Cards brighten to `blue-50` with `shadow-lg`
- **Active**: Cards darken to `blue-100` with `shadow-sm`
- **Success**: Cards glow with `shadow-success-glow`

#### Gradient Lighting
```css
/* Ambient mesh gradient (background) */
--gradient-mesh:
  radial-gradient(circle at 20% 30%, rgba(0, 82, 255, 0.08) 0%, transparent 50%),
  radial-gradient(circle at 80% 70%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
  linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%);

/* Spotlight effect (hero sections) */
--gradient-spotlight:
  radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
```

---

### Metaphor 3: **Glass as Clarity**

#### Glassmorphism Hierarchy
```css
/* Foreground glass (high clarity) */
--glass-foreground:
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);

/* Midground glass (balanced) */
--glass-midground:
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.2);

/* Background glass (subtle) */
--glass-background:
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(12px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.1);
```

#### Usage Guidelines
- **Stat Pills**: `glass-foreground` (high contrast, readable)
- **Cards**: `glass-midground` (primary content)
- **Backgrounds**: `glass-background` (ambient, non-distracting)

#### Dark Mode Glass
```css
/* Inverted glass for dark backgrounds */
--glass-dark-foreground:
  background: rgba(23, 23, 23, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
```

---

### Metaphor 4: **Motion as Narrative**

#### Motion States Tell a Story

**Idle State**: Gentle breathing animation
```css
animation: breathe 4s ease-in-out infinite;

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.01); opacity: 0.95; }
}
```

**Active State**: Energetic pulse
```css
animation: pulse 1s ease-out infinite;

@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: var(--shadow-base); }
  50% { transform: scale(1.02); box-shadow: var(--shadow-base-glow); }
}
```

**Success State**: Celebratory bounce
```css
animation: celebrate 600ms cubic-bezier(0.34, 1.56, 0.64, 1);

@keyframes celebrate {
  0% { transform: scale(1); }
  50% { transform: scale(1.15) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
}
```

**Loading State**: Confident shimmer
```css
animation: shimmer 2s linear infinite;

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

background: linear-gradient(
  90deg,
  var(--gray-100) 0%,
  var(--gray-50) 50%,
  var(--gray-100) 100%
);
background-size: 200% 100%;
```

---

### Metaphor Integration: **Example Flow**

#### User Completes Daily Goal

1. **Depth**: Progress ring reaches 100%, lifts with `shadow-xl`
2. **Light**: Ring glows with `shadow-success-glow`, background brightens
3. **Glass**: Success banner slides up with `glass-foreground` clarity
4. **Motion**: Confetti burst, number count-up, haptic feedback

**Total Duration**: 1800ms
**Emotional Peak**: 600ms (confetti burst)
**Settle Time**: 1200ms (ring glow fades to steady state)

---

## 🎨 6. Text-to-UI Moodboard

### Color Palette

#### Primary Colors (Base Blue System)
```
Base Blue:      #0052FF  ███████  Primary brand, CTAs, progress
Base Blue 50:   #EFF6FF  ███████  Ambient backgrounds
Base Blue 100:  #DBEAFE  ███████  Hover states, highlights
Base Blue 600:  #0047E6  ███████  Active states
Base Blue 900:  #002070  ███████  Text on light backgrounds
```

#### Accent Colors
```
Success Green:  #10B981  ███████  Goal completion, positive actions
Warning Orange: #F59E0B  ███████  Streaks, achievements
Error Red:      #EF4444  ███████  Errors, destructive actions
Purple:         #8B5CF6  ███████  Premium features, XMTP messaging
```

#### Neutral Grays
```
Gray 0:         #FFFFFF  ███████  Pure white (cards, backgrounds)
Gray 50:        #FAFAFA  ███████  Off-white (page backgrounds)
Gray 100:       #F5F5F5  ███████  Borders, dividers
Gray 500:       #737373  ███████  Secondary text
Gray 900:       #171717  ███████  Primary text
```

#### Gradient Palette
```
Gradient Base (Blue):
  linear-gradient(135deg, #0052FF 0%, #5B8DEF 100%)

Gradient Mesh (Background):
  radial-gradient(circle at 20% 30%, rgba(0, 82, 255, 0.08) 0%, transparent 50%),
  radial-gradient(circle at 80% 70%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
  linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%)

Gradient Success (Celebration):
  linear-gradient(135deg, #10B981 0%, #34D399 100%)

Gradient Glow (Depth):
  radial-gradient(circle, rgba(0, 82, 255, 0.2) 0%, transparent 70%)
```

---

### Shape Language

#### Primary Shapes: **Circles & Rounded Rectangles**

**Rationale**: Circles suggest movement, completion, wellness. Rounded rectangles feel modern, friendly, touchable.

#### Border Radius Scale
```css
--radius-sm: 8px;   /* Small pills, badges */
--radius-md: 12px;  /* Buttons, inputs */
--radius-lg: 16px;  /* Cards, modals */
--radius-xl: 24px;  /* Large cards, hero sections */
--radius-full: 9999px; /* Circles, avatar, tags */
```

#### Shape Usage
- **Progress Ring**: Perfect circle (240px diameter)
- **Cards**: `radius-lg` (16px) for primary cards
- **Buttons**: `radius-full` for primary CTAs, `radius-md` for secondary
- **Stat Pills**: `radius-lg` (16px) with horizontal padding
- **Avatars**: `radius-full` (circles)
- **Badges**: `radius-sm` (8px)

#### Geometric Balance
```
Card Aspect Ratios:
- StepsCard: 1:1.2 (portrait, emphasis on ring)
- WearableCard: 1:1 (square, grid layout)
- ActivityCard: 3:1 (landscape, list item)
```

---

### Textures

#### 1. **Noise Texture** (Subtle grain for depth)
```css
background-image: url('data:image/svg+xml,...'); /* 2% opacity grain */
mix-blend-mode: overlay;
opacity: 0.02;
```
**Usage**: Apply to large white surfaces to reduce digital flatness

#### 2. **Mesh Gradients** (Ambient backgrounds)
```css
--gradient-mesh:
  radial-gradient(circle at 20% 30%, rgba(0, 82, 255, 0.08) 0%, transparent 50%),
  radial-gradient(circle at 80% 70%, rgba(99, 102, 241, 0.06) 0%, transparent 50%);
```
**Usage**: Page backgrounds, hero sections

#### 3. **Blur Textures** (Glassmorphism)
```css
backdrop-filter: blur(20px) saturate(180%);
```
**Usage**: Floating cards, modals, stat pills

#### 4. **Gradient Overlays** (Depth cues)
```css
/* Top-to-bottom fade for infinite scroll */
linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%);

/* Spotlight effect for hero */
radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 70%);
```

#### 5. **Shadow Textures** (Colored glows)
```css
box-shadow: 0 8px 32px rgba(0, 82, 255, 0.15); /* Base Blue glow */
box-shadow: 0 8px 32px rgba(16, 185, 129, 0.20); /* Success Green glow */
```
**Usage**: Active states, goal completion, reward moments

---

### Typographic Pairings

#### Font Stack
```css
/* Primary: SF Pro Display (Apple-inspired) */
--font-primary:
  -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI",
  system-ui, sans-serif;

/* Monospace: For wallet addresses, token counts */
--font-mono:
  "SF Mono", "Monaco", "Courier New", monospace;
```

#### Type Scale (Based on 16px base)
```css
--text-xs: 12px;     /* Labels, captions */
--text-sm: 14px;     /* Secondary text, helper copy */
--text-base: 16px;   /* Body text */
--text-lg: 18px;     /* Emphasized body */
--text-xl: 20px;     /* Subheadings */
--text-2xl: 24px;    /* Section headers */
--text-3xl: 30px;    /* Page titles */
--text-4xl: 36px;    /* Display text */
--text-hero: 48px;   /* Landing page hero */
--text-display: 64px; /* Steps counter */
```

#### Weight Pairing (Confident Hierarchy)
```css
--weight-light: 300;   /* Large display text (hero, steps counter) */
--weight-normal: 400;  /* Body text */
--weight-medium: 500;  /* Subheadings, emphasized text */
--weight-semibold: 600; /* CTAs, labels */
--weight-bold: 700;    /* Strong emphasis, numbers */
```

#### Line Height (Generous Spacing)
```css
--leading-tight: 1.2;   /* Display text, numbers */
--leading-snug: 1.4;    /* Headings */
--leading-normal: 1.6;  /* Body text */
--leading-relaxed: 1.8; /* Long-form content */
```

#### Letter Spacing
```css
--tracking-tight: -0.02em; /* Large display text */
--tracking-normal: 0em;    /* Body text */
--tracking-wide: 0.02em;   /* Labels, small caps */
```

#### Typographic Pairings (Context Examples)

**Landing Hero**
```
Font: SF Pro Display
Size: 48px (--text-hero)
Weight: 300 (--weight-light)
Line Height: 1.2 (--leading-tight)
Letter Spacing: -0.02em (--tracking-tight)
```

**Steps Counter (Primary Data)**
```
Font: SF Pro Display
Size: 64px (--text-display)
Weight: 700 (--weight-bold)
Line Height: 1.0
Gradient: var(--gradient-base)
```

**Body Text**
```
Font: SF Pro Display
Size: 16px (--text-base)
Weight: 400 (--weight-normal)
Line Height: 1.6 (--leading-normal)
Color: var(--gray-900)
```

**Microcopy (Labels, Helper Text)**
```
Font: SF Pro Display
Size: 12px (--text-xs)
Weight: 500 (--weight-medium)
Line Height: 1.4
Letter Spacing: 0.02em (--tracking-wide)
Text Transform: uppercase
Color: var(--gray-500)
```

**Button Text (CTAs)**
```
Font: SF Pro Display
Size: 16px (--text-base)
Weight: 600 (--weight-semibold)
Line Height: 1.0
Letter Spacing: 0em
```

---

### Visual System Summary Table

| Element | Color | Shape | Texture | Type |
|---------|-------|-------|---------|------|
| **Page Background** | Gray 50 | — | Mesh gradient + 2% noise | — |
| **Primary Card** | White (Gray 0) | radius-lg (16px) | shadow-base, glass-midground | text-base, weight-normal |
| **Steps Counter** | Gradient Base | Circle (240px) | shadow-base-glow | text-display, weight-bold |
| **CTA Button** | Base Blue | radius-full | shadow-sm → shadow-lg (hover) | text-base, weight-semibold |
| **Stat Pill** | White (Glass) | radius-lg (16px) | glass-foreground, shadow-sm | text-sm, weight-medium |
| **Section Header** | Gray 900 | — | — | text-2xl, weight-medium |
| **Microcopy** | Gray 500 | — | — | text-xs, weight-medium, uppercase |
| **Success Banner** | Success Green 50 | radius-lg (16px) | shadow-success-glow | text-base, weight-medium |

---

## 🎯 Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Implement new bottom tab navigation
- [ ] Create tab views: Today, Connect, Rewards
- [ ] Migrate existing dashboard content to "Today" tab
- [ ] Add page transition animations

### Phase 2: Onboarding (Week 2)
- [ ] Build progressive onboarding flow
- [ ] Create goal-setting interface
- [ ] Add celebration animations
- [ ] Implement contextual tooltips

### Phase 3: Polish (Week 3)
- [ ] Refine microcopy across all screens
- [ ] Add micro-interactions (button press, hover states)
- [ ] Implement pull-to-refresh gesture
- [ ] Add haptic feedback (native)

### Phase 4: Expansion (Week 4)
- [ ] Build out Connect tab (social features)
- [ ] Build out Rewards tab (token history, tiers)
- [ ] Add profile settings menu
- [ ] Desktop sidebar navigation

---

## 📐 Design Principles Summary

**1. Depth through Simplicity**: Use shadows, blur, and layering—not clutter.
**2. Light as Signal**: Brightness = importance, glows = success.
**3. Glass for Clarity**: Blur backgrounds, sharpen content.
**4. Motion with Purpose**: Every animation tells part of the story.
**5. Warm but Confident**: Human tone, not robotic or overly casual.
**6. Progressive Disclosure**: Show users one thing at a time, when they need it.
**7. Celebration by Default**: Reward micro-wins with motion and feedback.

---

## 🔗 References & Inspiration

**Apple Design Award Winners**:
- Apple Weather (circular data visualization, glassmorphism)
- Apple Health (ring progress, color-coded categories)

**Linear.app**:
- Keyboard-first navigation
- Minimal chrome, maximum content
- Fast, spring-based animations

**Coinbase Wallet**:
- Tab-based navigation
- Base Blue brand color
- Clear hierarchy, generous spacing

**Base (Coinbase L2)**:
- Blue gradient brand identity
- Modern, Web3-native feel
- Clean, approachable design

---

## 📊 Success Metrics

**UX Quality Indicators**:
- Time to first value: < 60s
- Onboarding completion rate: > 85%
- Daily active users (DAU): Baseline + 20% after redesign
- Session duration: Baseline + 30%
- User sentiment (NPS): Target 50+

**Technical Performance**:
- Page load (LCP): < 1.5s
- First input delay (FID): < 100ms
- Cumulative layout shift (CLS): < 0.1
- Animation frame rate: 60fps (no jank)

---

**End of UX Redesign Proposal**

*Generated with Claude Code*
*Version 1.0 — 2025*
