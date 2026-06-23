# Rello Design System

## 1. Design Philosophy
- Rello's current UI is a squared editorial rental platform with full-bleed property photography, visible rule borders, dark teal surfaces, and gold accents.
- The implementation uses large Fraunces display headings, compact Syne uppercase labels, and DM Sans body text to create a premium real estate feel.
- Layouts favor strong section bands, asymmetric image grids, and direct CTAs over card-heavy composition.

## 2. Color Tokens

Source: `src/app/globals.css`.

```css
:root {
  --font-display: var(--rello-font-display);
  --font-body: var(--rello-font-body);
  --font-accent: var(--rello-font-accent);
  --color-primary: #04344c;
  --color-primary-dark: #04344c;
  --color-primary-soft: #04344c;
  --color-accent: #c9913a;
  --color-accent-alt: #b57e2e;
  --color-bg: #fafaf8;
  --color-surface: #04344c;
  --color-surface-soft: #faf8f5;
  --color-footer: #04344c;
  --color-text: #111827;
  --color-text-muted: #6b7280;
  --color-border: #e5e7eb;
}
```

| Token | Value | Usage |
|-------|-------|-------|
| `--font-display` | `var(--rello-font-display)` | Font variable, not a color token. |
| `--font-body` | `var(--rello-font-body)` | Font variable, not a color token. |
| `--font-accent` | `var(--rello-font-accent)` | Font variable, not a color token. |
| `--color-primary` | `#04344c` | Primary backgrounds, CTAs, borders, links, headings, and hover states. |
| `--color-primary-dark` | `#04344c` | Dark primary backgrounds and gradient end utility. |
| `--color-primary-soft` | `#04344c` | Primary soft utility and legacy-compatible token. |
| `--color-accent` | `#c9913a` | Gold CTAs, labels, icons, borders, focus rings, and badges. |
| `--color-accent-alt` | `#b57e2e` | Accent-alt utility and legacy-compatible gradient token. |
| `--color-bg` | `#fafaf8` | Body background and active page background. |
| `--color-surface` | `#04344c` | Surface background utility. |
| `--color-surface-soft` | `#faf8f5` | Soft section background on property preview. |
| `--color-footer` | `#04344c` | Footer background. |
| `--color-text` | `#111827` | Body text color. |
| `--color-text-muted` | `#6b7280` | Muted text and muted SVG stroke utility. |
| `--color-border` | `#e5e7eb` | Surface border utility. |
| `--tw-gradient-from` | `var(--color-primary)` | Defined in `.from-primary` utility for Tailwind gradient stops. |
| `--tw-gradient-to` | `rgb(4 52 76 / 0)` | Defined in `.from-primary` utility as transparent primary gradient end. |
| `--tw-gradient-stops` | `var(--tw-gradient-from), var(--tw-gradient-to)` | Defined in `.from-primary` utility for gradient composition. |
| `--tw-gradient-to` | `var(--color-primary-dark)` | Defined in `.to-primary-dark` utility for Tailwind gradient end. |

Tailwind extends font families through `tailwind.config.ts` but does not extend colors there.

```ts
fontFamily: {
  display: ["var(--font-display)", "serif"],
  body: ["var(--font-body)", "sans-serif"],
  accent: ["var(--font-accent)", "sans-serif"],
}
```

Hardcoded colors appear in documented pages and retained components.

```txt
bg-black/10
bg-black/50
bg-white
text-red-500
text-red-700
text-slate-400
text-slate-600
text-slate-950
text-white
text-white/50
text-white/65
text-white/70
text-white/75
text-white/[0.12]
border-red-500
border-red-700
border-white
border-white/20
border-white/30
```

## 3. Typography

Source: `src/app/layout.tsx`, `src/app/globals.css`, and `tailwind.config.ts`.

| Role | Family | CSS Variable | Tailwind Class | Used For |
|------|--------|--------------|----------------|----------|
| Display | `Fraunces` | `--rello-font-display`, exposed as `--font-display` | `font-display` | `h1`, `h2`, `h3`, hero headlines, section headings, property card titles, and step numerals. |
| Body | `DM Sans` | `--rello-font-body`, exposed as `--font-body` | `font-body` | Body text, inputs, buttons, labels, navigation CTAs, and default `body`. |
| Accent | `Syne` | `--rello-font-accent`, exposed as `--font-accent` | `font-accent` | Eyebrows, navigation links, marquee text, badges, and text links. |

Font weights loaded from `next/font/google`.

| Family | Weights |
|--------|---------|
| `DM Sans` | Default Google font weights from `DM_Sans({ subsets: ["latin"] })`. |
| `Fraunces` | `500`, `600`, `700`, `800`. |
| `Syne` | `500`, `600`, `700`, `800`. |

Type scale actively used by documented pages and retained components.

| Tailwind Class | Context |
|----------------|---------|
| `text-xs` | Eyebrows, navigation links, footer links, property badges, and marquee labels. |
| `text-sm` | Buttons, labels, mobile nav links, footer meta text, and toast text. |
| `text-base` | Body copy, form controls, buttons, feature copy, and property price text. |
| `text-lg` | Section body text, waitlist copy, success copy, and button responsive sizes. |
| `text-xl` | Hero body copy at `md`, feature titles, and verify email OTP cells. |
| `text-2xl` | Active landing step titles. |
| `text-3xl` | Property card titles. |
| `text-4xl` | Active section headings. |
| `text-5xl` | Hero headings, waitlist headings, CTA headings, and responsive section headings. |
| `text-6xl` | Responsive hero, waitlist, auth, section, and CTA headings. |
| `text-7xl` | Responsive hero and large active section headings. |
| `text-8xl` | Active hero headings, CTA headings, and active step numerals. |
| `text-9xl` | Active step numerals at `lg`. |

Font weight classes in use.

```txt
font-bold
font-semibold
```

Notable typographic patterns.

| Pattern | Classes | Context |
|---------|---------|---------|
| Uppercase spaced eyebrow | ```txt
font-accent
text-xs
font-bold
uppercase
tracking-[0.3em]
``` | Active landing and waitlist labels. |
| Navigation microtype | ```txt
font-accent
text-xs
font-bold
uppercase
tracking-[0.22em]
``` | `Navbar` and `Footer` links. |
| Marquee microtype | ```txt
font-accent
text-sm
font-bold
uppercase
tracking-[0.28em]
sm:text-base
``` | Active landing ticker. |
| Tight display headings | ```txt
leading-[0.9]
leading-[0.92]
leading-[0.95]
leading-[0.96]
leading-tight
``` | Hero, CTA, waitlist, and active section headings. |

## 4. Spacing & Layout

Base spacing scale used in documented pages and retained components.

```txt
0.5
1
2
3
4
5
6
7
8
9
10
12
14
16
20
24
28
32
44
48
56
60
64
72
80
```

Max-width containers.

| Class | Context |
|-------|---------|
| `max-w-sm` | Toast viewport. |
| `max-w-md` | Waitlist success copy. |
| `max-w-xl` | Waitlist form column. |
| `max-w-none` | Auth watermark image. |
| `max-w-2xl` | Active hero copy and active section body copy. |
| `max-w-3xl` | Active section headers. |
| `max-w-4xl` | Active why section headline. |
| `max-w-6xl` | Active hero content width. |
| `max-w-7xl` | Active marketing section containers. |
| `max-w-[calc(100vw-1rem)]` | Footer outer container. |
| `max-w-[calc(100vw-0.5rem)]` | Footer logo image. |

Section padding patterns.

| Classes | Context |
|---------|---------|
| ```txt
px-4
sm:px-6
lg:px-8
py-20
lg:py-28
``` | Active marketing content sections. |
| ```txt
px-4
pb-16
pt-24
sm:px-6
lg:px-8
lg:pb-20
``` | Active landing hero content. |
| ```txt
px-4
py-16
sm:px-6
lg:px-12
``` | Waitlist form side and auth right panel. |
| ```txt
px-12
py-20
``` | Auth left panel content. |
| ```txt
py-10
pl-2
pr-2
sm:pr-3
lg:pr-4
lg:pl-4
``` | `Footer`. |

Grid patterns.

| Classes | Context |
|---------|---------|
| ```txt
grid
lg:grid-cols-2
``` | Waitlist page split image and form layout, and auth split layout. |
| ```txt
grid
grid-cols-6
gap-2
sm:gap-3
``` | Verify email OTP input row. |
| ```txt
grid
max-w-7xl
lg:grid-cols-[2fr_1fr]
``` | Active why section copy and feature list. |
| ```txt
grid
lg:grid-cols-3
``` | Active how-it-works steps. |
| ```txt
grid
lg:grid-cols-[1.35fr_0.9fr]
lg:grid-rows-2
``` | Active property preview image mosaic. |
| ```txt
grid
lg:grid-cols-[1fr_0.75fr]
``` | Active final CTA. |
| ```txt
grid
grid-cols-6
``` | Active CTA and auth dot matrix decoration. |
| ```txt
grid
lg:grid-cols-[1fr_auto]
``` | Footer logo and navigation row. |

Breakpoints actively used.

| Breakpoint | Implemented Changes |
|------------|---------------------|
| `sm` | Increases horizontal padding, button sizes, type sizes, logo widths, toast position, and footer layout. |
| `md` | Increases hero type sizes and active hero headline size. |
| `lg` | Enables desktop nav, waitlist and auth split layouts, active marketing section grids, footer desktop alignment, and desktop-only decorative elements. |

## 5. Component Inventory

### Footer
- **File**: `src/components/Footer.tsx`
- **Purpose**: Renders the footer logo, navigation links, copyright line, and social links.
- **Props**: None.
- **Variants**: Social icon spans remount on hover or focus through `iconReplayKey`.
- **Animation**: Interactive elements use Tailwind `transition-all duration-200 ease-in-out`.
- **Dependencies**: `next/image`, `next/link`, React `useState`, Iconify Tailwind classes, `public/rello-logo-cropped.svg`.

### LoadingScreen
- **File**: `src/components/LoadingScreen.tsx`
- **Purpose**: Renders the full-screen animated Rello logo loader.
- **Props**: `onDone: () => void`.
- **Variants**: State phase union is `"draw" | "fillin" | "exit"`.
- **Animation**: Draw paths animate `pathLength`, fill, and stroke opacity with durations `1.4`, `1`, `0.8`, `0.6`, and screen exit duration `0.4`.
- **Dependencies**: `framer-motion`, React `useEffect`, `useLayoutEffect`, `useRef`, `useState`.

### LoadingScreenGate
- **File**: `src/components/LoadingScreenGate.tsx`
- **Purpose**: Shows the loading screen until the loader completes or a session key has already been set.
- **Props**: `children: React.ReactNode`.
- **Variants**: Hides the loader when `sessionStorage.getItem("rello_loaded")` exists.
- **Animation**: Delegates animation to `LoadingScreen`.
- **Dependencies**: React `useEffect`, React `useState`, `LoadingScreen`.

### AuthBanner
- **File**: `src/components/auth/AuthBanner.tsx`
- **Purpose**: Renders dismissible auth feedback banners inside auth forms.
- **Props**: `message: string`, `type: "error" | "success"`.
- **Variants**: Error banners use `border-red-500 text-red-500`; success banners use `border-accent text-primary`.
- **Animation**: Uses `AnimatePresence` with y-offset and opacity transitions unless reduced motion is active.
- **Dependencies**: `framer-motion`, `lucide-react`, React `useState`.

### AuthInput
- **File**: `src/components/auth/AuthInput.tsx`
- **Purpose**: Renders typed auth form inputs with labels, validation messages, and optional password visibility toggle.
- **Props**: Generic `AuthInputProps<TFieldValues extends FieldValues>` with `label`, `name`, `type`, `placeholder`, `error`, `register`, optional `rules`, `showToggle`, and `autoComplete`.
- **Variants**: Password inputs can show an `EyeIcon` or `EyeOffIcon` toggle; validation messages use `text-red-500`.
- **Animation**: Error messages use `AnimatePresence` with y-offset and opacity transitions unless reduced motion is active.
- **Dependencies**: `framer-motion`, `lucide-react`, React `useState`, `react-hook-form`.

### AuthSplitLayout
- **File**: `src/components/auth/AuthSplitLayout.tsx`
- **Purpose**: Provides the reusable two-column auth layout with a dark primary editorial panel and a light form panel.
- **Props**: `leftContent: ReactNode`, `rightContent: ReactNode`, `showWatermark?: boolean`.
- **Variants**: The left panel is hidden below `lg`; the right panel can show a low-opacity oversized Rello watermark.
- **Animation**: Left and right panels fade or slide in unless reduced motion is active.
- **Dependencies**: `framer-motion`, `next/image`, React `ReactNode`, `public/FullLogo_Transparent (2).png`.

### Navbar
- **File**: `src/components/Navbar.tsx`
- **Purpose**: Renders sticky navigation with desktop links, CTA, and mobile menu.
- **Props**: None.
- **Variants**: Desktop nav appears at `lg`, mobile menu toggles through `menuOpen`, and icon swaps between `Menu` and `X`.
- **Animation**: Mobile menu uses Framer Motion `initial={{ opacity: 0, x: -32 }}`, `animate={{ opacity: 1, x: 0 }}`, `exit={{ opacity: 0, x: -32 }}`, and `transition={{ duration: 0.2, ease: "easeOut" }}`.
- **Dependencies**: `framer-motion`, `lucide-react`, `next/image`, `next/link`, React `useState`, `public/rello-logo.svg`.

### ToastProvider and useToast
- **File**: `src/components/ui/toast.tsx`
- **Purpose**: Provides toast notifications and a `useToast` hook.
- **Props**: `ToastProvider` uses `children: ReactNode`; `notify` accepts `{ title: string; description?: string; variant: "success" | "error" }`.
- **Variants**: Toast containers use `border-primary`, `bg-[var(--color-bg)]`, and a primary shadow. Success icons use `CheckCircle2`, `border-accent`, and `text-accent`; error icons use `XCircle`, `border-red-500`, and `text-red-500`.
- **Animation**: Toast dismissal is timed with `window.setTimeout(..., 5000)` and no Framer Motion animation is used.
- **Dependencies**: React context hooks and `lucide-react` icons `CheckCircle2`, `X`, and `XCircle`.

## 6. Animation System

Animation library.

| Library | Version | Source |
|---------|---------|--------|
| `framer-motion` | `12.38.0` | `package.json` |

Standard easing values used.

```txt
easeOut
easeInOut
[0.4, 0, 0.2, 1]
linear
```

Standard duration values used.

```txt
0.2s
0.25s
0.4s
0.45s
0.5s
0.6s
1s
1.4s
14s
24s
```

Submitting auth buttons pulse opacity while a request is in progress.

```tsx
animate={
  isSubmitting && !reduceMotion
    ? { opacity: [1, 0.6, 1] }
    : { opacity: 1 }
}
transition={
  isSubmitting && !reduceMotion
    ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
    : { duration: 0.2 }
}
```

Recurring Framer Motion variant objects.

```ts
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};
```

```tsx
initial={reduceMotion ? false : { opacity: 0, y: 28 }}
whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
viewport={{ once: true, margin: "-100px" }}
transition={{ duration: 0.5, ease: "easeOut" }}
```

```tsx
initial={{ opacity: 0, x: -32 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -32 }}
transition={{ duration: 0.2, ease: "easeOut" }}
```

```tsx
initial={reduceMotion ? false : { opacity: 0, y: -4 }}
animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
transition={{ duration: 0.2, ease: "easeOut" }}
```

```tsx
whileTap={reduceMotion ? undefined : { scale: 0.98 }}
```

Loading path animation object.

```tsx
initial={{
  pathLength: 0,
  fill: "rgba(227,148,59,0)",
  strokeOpacity: 1,
}}
animate={{
  pathLength: shouldDraw ? 1 : 0,
  fill: isFilled ? "rgba(227,148,59,1)" : "rgba(227,148,59,0)",
  strokeOpacity: isFilled ? 0 : 1,
}}
transition={{
  pathLength: { duration: drawDuration, ease: [0.4, 0, 0.2, 1] },
  fill: { duration: 0.6, ease: "easeInOut" },
  strokeOpacity: { duration: 0.6, ease: "easeInOut" },
}}
```

CSS animations and transitions.

| Class or Keyframe | Values |
|-------------------|--------|
| `.nav-link::after` | `transition: transform 300ms ease`. |
| `.button-fill-hover` | `transition: color 300ms ease`. |
| `.button-fill-hover::before` | `transition: transform 300ms ease`. |
| `.premium-hover` | `transition-duration: 200ms`, `transition-timing-function: ease-in-out`. |
| `.premium-hover:hover` | `transform: translateY(-2px)`, `box-shadow: 4px 4px 0 var(--color-primary)`. |
| `.hero-mesh` | `animation: hero-mesh-shift 14s ease-in-out infinite alternate`. |
| `.rello-marquee` | `animation: rello-marquee 24s linear infinite`. |
| `@media (prefers-reduced-motion: reduce)` | Disables `.hero-mesh` and `.rello-marquee` animation. |

```css
@keyframes rello-marquee {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-33.333%);
  }
}

@keyframes hero-mesh-shift {
  from {
    background-position: 0% 0%;
  }

  to {
    background-position: 100% 70%;
  }
}
```

## 7. Page Layouts

### Landing Page (/)

Source: `src/app/(marketing)/page.tsx` re-exports `src/app/(marketing)/marketing/page.tsx`.

| Order | Section | Layout Structure | Key Components Used |
|-------|---------|------------------|---------------------|
| 1 | Navbar | Sticky full-width nav with logo, desktop links, desktop CTA, and mobile menu. | `Navbar` |
| 2 | Hero | Full-screen relative section with remote Unsplash background, black overlays, left-aligned content, heading, body copy, and two CTAs. | None |
| 3 | Marquee | `bg-primary` ticker with repeated text and diamond separators. | None |
| 4 | Why Rello | Two-column `max-w-7xl` grid with left copy and right bordered feature list. | None |
| 5 | How It Works | Dark primary section with three step columns, large faded numerals, and rule borders. | None |
| 6 | Property Preview | Soft surface section with asymmetric image mosaic using `lg:grid-cols-[1.35fr_0.9fr]` and `lg:grid-rows-2`. | None |
| 7 | Early Access CTA | Gold section with large heading, CTA, desktop square outline, and dot matrix decoration. | None |
| 8 | Footer | Dark footer with oversized logo, nav links, copyright, and social icons. | `Footer` |

### Waitlist Page (/waitlist)

Source: `src/app/(marketing)/waitlist/page.tsx`.

| Order | Section | Layout Structure | Key Components Used |
|-------|---------|------------------|---------------------|
| 1 | Navbar | Sticky full-width nav with logo, desktop links, desktop CTA, and mobile menu. | `Navbar` |
| 2 | Waitlist Split | `lg:grid-cols-2` page split with hidden desktop image panel and form panel. | `useToast` |
| 3 | Image Panel | Desktop-only remote Unsplash image with `bg-black/10` overlay and gold outlined square. | None |
| 4 | Form Panel | Centered `max-w-xl` form with eyebrow, display heading, body copy, five fields, error state, and submit button. | `useToast` |
| 5 | Success State | Replaces form with bordered white success panel, animated checkmark, heading, and message. | `useToast` |
| 6 | Footer | Dark footer with logo, nav, copyright, and social icons. | `Footer` |

### Auth Pages

Sources: `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx`, and `src/app/verify-email/page.tsx`.

Shared layout pattern.

| Order | Section | Layout Structure | Key Components Used |
|-------|---------|------------------|---------------------|
| 1 | Auth Split | `lg:grid-cols-2` full-screen split layout with a hidden-mobile dark primary editorial panel and a light form panel. | `AuthSplitLayout` |
| 2 | Left Panel | Primary background, accent outlined square, dot matrix decoration, uppercase eyebrow, display heading, and supporting copy. | `AuthSplitLayout` |
| 3 | Right Panel | Centered `max-w-xl` form column with uppercase eyebrow, display heading, form controls, banners, submit button, and secondary navigation link. | `AuthSplitLayout`, `AuthInput`, `AuthBanner`, `useToast` |

Route-specific form patterns.

| Route | Form Structure | Notes |
|-------|----------------|-------|
| `/login` | Email and password fields, success or error banner, submit button, forgot password link, and register link. | Uses `showWatermark` on `AuthSplitLayout` and redirects to `/` after login. |
| `/register` | First name, last name, email, password, role select, error banner, submit button, and login link. | Uses `showWatermark` and stores the email before routing to verification. |
| `/forgot-password` | Email field, success or error banner, submit button, and login link. | Uses the standard split layout without watermark. |
| `/reset-password` | Reset token field, new password field, error banner, submit button, and login link. | Reads an initial token from the query string when present. |
| `/verify-email` | Optional email field, six single-character OTP inputs, OTP error text, error banner, submit button, and login link. | Uses `grid-cols-6` OTP cells with square aspect ratio and numeric input mode. |

## 8. Loading Screen

- **File**: `src/components/LoadingScreen.tsx`
- **Animation concept**: A full-screen primary-color loader draws the Rello mark, fills it with `rgb(227,148,59)`, then fades out.
- **Phase sequence**: `draw` starts path drawing, the last logo path switches to `fillin`, the tagline completion schedules `exit`, and exit opacity completion calls `onDone`.
- **State machine phases**: `type Phase = "draw" | "fillin" | "exit"`.
- **Entry behavior**: `RootLayout` initially sets `<html>` to `visibility: hidden` and `overflow: hidden`, and `LoadingScreen` clears both in `useLayoutEffect`.
- **Exit behavior**: `scheduleExit` waits `600ms`, screen opacity animates to `0` over `0.4s`, then `handleDone` stores the session key and calls `onDone`.
- **Session storage key**: `rello_loaded`.

```tsx
type Phase = "draw" | "fillin" | "exit";
```

```tsx
sessionStorage.setItem("rello_loaded", "true");
```

## 9. Design Constraints

Explicit rules from `AGENTS.md`.

| Rule | Source |
|------|--------|
| Study existing repo conventions before writing code. | `AGENTS.md` |
| Do not invent patterns when an existing pattern fits. | `AGENTS.md` |
| Do not add features, refactors, or abstractions beyond the task. | `AGENTS.md` |
| Do not create new files when editing an existing one will do. | `AGENTS.md` |
| Use exact top-level section comment format only in code comments. | `AGENTS.md` |
| Do not use em dash characters in markdown, commit messages, PR descriptions, or documentation. | `AGENTS.md` |
| Prefer bullets over long paragraphs. | `AGENTS.md` |
| Do not write comments that describe what the code does. | `AGENTS.md` |

Explicit design guidance from `CONTEXT.md`.

| Rule | Source |
|------|--------|
| Make deliberate palette, typography, and layout choices specific to the brief. | `CONTEXT.md` |
| Use the hero as the visual thesis. | `CONTEXT.md` |
| Pair display and body faces deliberately. | `CONTEXT.md` |
| Use motion deliberately. | `CONTEXT.md` |
| Keep responsive behavior and reduced motion in mind. | `CONTEXT.md` |

Implicit implementation rules.

| Pattern | Evidence |
|---------|----------|
| Documented pages favor square edges and visible rule borders. | Active `Navbar`, landing sections, property cards, waitlist form, waitlist success panel, and auth forms use no rounded classes. |
| Gold accent is reserved for CTAs, labels, icons, focus rings, badges, and decorative marks. | `text-accent`, `bg-accent`, `border-accent`, `stroke-accent`, and `fill-accent` are repeated across documented pages and retained components. |
| Large serif display type anchors page hierarchy. | `font-display` appears on active hero, section, waitlist, CTA, and property headings. |
| Accent font is used for navigation and editorial labels. | `font-accent` appears in nav links, footer links, marquee, badges, and eyebrows. |
| Active pages use remote property images. | Landing and waitlist pages use Unsplash background URLs. |

## 10. Known Gaps / TODOs

Design intentions not fully implemented.

| Gap | Source |
|-----|--------|
| `CONTEXT.md` calls for a distinctive studio-led process, but the active implementation uses a limited teal, gold, off-white, black, and white palette. | `CONTEXT.md`, `src/app/(marketing)/marketing/page.tsx`, `src/app/globals.css` |
| `CONTEXT.md` mentions responsive and reduced motion quality, but CSS reduced motion only disables `.hero-mesh` and `.rello-marquee`. | `CONTEXT.md`, `src/app/globals.css` |

Implementation inconsistencies.

| Inconsistency | Source |
|---------------|--------|
| Documented pages use token utilities and hardcoded Tailwind palette colors together. | `src/app/(marketing)/marketing/page.tsx`, `src/app/(marketing)/waitlist/page.tsx`, `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx`, `src/app/verify-email/page.tsx`, `src/components` |
| `--color-primary`, `--color-primary-dark`, `--color-primary-soft`, `--color-surface`, and `--color-footer` all resolve to `#04344c`. | `src/app/globals.css` |
| `LoadingScreen` uses hardcoded `rgb(227,148,59)` instead of `--color-accent` value `#c9913a`. | `src/components/LoadingScreen.tsx`, `src/app/globals.css` |
| `Footer` uses Iconify animated icons while `Navbar` and toasts use `lucide-react`. | `src/components/Footer.tsx`, `src/components/Navbar.tsx`, `src/components/ui/toast.tsx` |
