# Theming Guide

Complete guide to customizing the Bad Scandi theme system.

## Table of Contents

- [Overview](#overview)
- [Theme Configuration](#theme-configuration)
- [Available Themes](#available-themes)
- [Style Options](#style-options)
- [CSS Variables](#css-variables)
- [Dark Mode](#dark-mode)
- [Custom Themes](#custom-themes)
- [Admin Theme Editor](#admin-theme-editor)
- [Best Practices](#best-practices)

---

## Overview

Bad Scandi uses a CSS variable-based theming system that supports:
- **11 font themes** with Google Fonts
- **6 accent colors** with light/dark variants
- **4 border radius styles**
- **3 button styles**
- **3 heading styles**
- **3 font scales**
- **3 dark mode options**

Themes are stored in the database (`SiteSettings` table) and applied site-wide.

---

## Theme Configuration

### Database Schema

```prisma
model SiteSettings {
  id            String   @id @default("settings")
  themeId       String   @default("system")
  borderRadius  String   @default("default")
  buttonStyle   String   @default("default")
  headingStyle  String   @default("normal")
  accentColor   String   @default("amber")
  fontScale     String   @default("default")
  darkMode      String   @default("system")
  updatedAt     DateTime @updatedAt
  updatedBy     String?
}
```

### TypeScript Types

```typescript
// lib/themes.ts
export type ThemeId =
  | "system" | "classic" | "nordic" | "artisan"
  | "elegant" | "modern" | "warm" | "editorial"
  | "handcraft" | "minimalist" | "bold";

export type BorderRadiusStyle = "default" | "sharp" | "rounded" | "pill";
export type ButtonStyle = "default" | "outline" | "soft";
export type HeadingStyle = "normal" | "uppercase" | "small-caps";
export type AccentColor = "amber" | "rose" | "teal" | "slate" | "forest" | "indigo";
export type FontScale = "compact" | "default" | "spacious";
export type DarkMode = "system" | "light" | "dark";

export interface ThemeSettings {
  themeId: ThemeId;
  borderRadius: BorderRadiusStyle;
  buttonStyle: ButtonStyle;
  headingStyle: HeadingStyle;
  accentColor: AccentColor;
  fontScale: FontScale;
  darkMode: DarkMode;
}
```

---

## Available Themes

### Font Themes

| Theme | Category | Fonts | Readability |
|-------|----------|-------|-------------|
| **System** | sans-serif | Device fonts | 5/5 |
| **Classic** | sans-serif | Inter | 5/5 |
| **Nordic** | sans-serif | Karla | 5/5 |
| **Artisan** | serif-heading | Lora + DM Sans | 4/5 |
| **Elegant** | serif-heading | Playfair Display + DM Sans | 4/5 |
| **Modern** | sans-serif | Plus Jakarta Sans | 5/5 |
| **Warm** | sans-serif | Nunito Sans | 5/5 |
| **Editorial** | serif-heading | Cormorant Garamond + Source Sans 3 | 4/5 |
| **Handcraft** | display | Caveat + Quicksand | 3/5 |
| **Minimalist** | sans-serif | Work Sans | 5/5 |
| **Bold** | display | Archivo Black + Archivo | 4/5 |

### Theme Definitions

```typescript
// Example: Nordic theme
{
  id: "nordic",
  name: "Nordic",
  description: "Simple and friendly Karla font with authentic Scandinavian character.",
  category: "sans-serif",
  readabilityScore: 5,
  headingFont: {
    family: "Karla",
    googleFont: "Karla",
    weights: ["400", "500", "600", "700"],
    fallback: "ui-sans-serif, system-ui, sans-serif",
  },
  bodyFont: {
    family: "Karla",
    googleFont: "Karla",
    weights: ["400", "500", "600"],
    fallback: "ui-sans-serif, system-ui, sans-serif",
  },
  recommendedAccent: "slate",
}
```

---

## Style Options

### Border Radius

| Style | Value | Description |
|-------|-------|-------------|
| **Default** | `1rem` | Balanced rounded corners |
| **Sharp** | `0.25rem` | Minimal rounding, modern look |
| **Rounded** | `1.5rem` | Softer, friendly corners |
| **Pill** | `9999px` | Fully rounded ends |

### Button Styles

| Style | Description |
|-------|-------------|
| **Solid** | Filled background buttons |
| **Outline** | Border-only buttons |
| **Soft** | Subtle tinted background |

### Heading Styles

| Style | CSS | Example |
|-------|-----|---------|
| **Normal** | `none` | Hand-Dyed Fiber Art |
| **Uppercase** | `uppercase` | HAND-DYED FIBER ART |
| **Small Caps** | `small-caps` | Hᴀɴᴅ-Dʏᴇᴅ Fɪʙᴇʀ Aʀᴛ |

### Font Scales

| Scale | Base Size | Line Height |
|-------|-----------|-------------|
| **Compact** | 0.875rem | 1.5 |
| **Default** | 1rem | 1.625 |
| **Spacious** | 1.125rem | 1.75 |

---

## CSS Variables

### Core Variables

```css
:root {
  /* Typography */
  --font-heading: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-size-base: 1rem;
  --heading-scale: 1.75;
  --line-height: 1.625;
  --heading-transform: none;

  /* Colors (HSL format) */
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 30 81% 28%;
  --accent-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --ring: 30 81% 28%;

  /* Spacing */
  --radius: 1rem;
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --card: 0 0% 7%;
  --card-foreground: 0 0% 98%;
  --muted: 0 0% 14.9%;
  --muted-foreground: 0 0% 63.9%;
  --accent: 45 93% 58%;
  --accent-foreground: 20 14% 4%;
  --border: 0 0% 20%;
  --ring: 45 93% 58%;
}
```

### Using Variables in Components

```typescript
// Tailwind classes use these variables automatically
<div className="bg-background text-foreground" />
<div className="bg-card border-border" />
<button className="bg-accent text-accent-foreground" />
<p className="text-muted-foreground" />
```

---

## Dark Mode

### How It Works

1. Dark mode preference stored in `SiteSettings.darkMode`
2. Value options: `system`, `light`, `dark`
3. Applied via `class="dark"` on `<html>` element
4. CSS variables change based on `.dark` class

### Implementation

```typescript
// components/theme-loader.tsx
"use client";

export function ThemeLoader({ darkMode }: { darkMode: DarkMode }) {
  useEffect(() => {
    const html = document.documentElement;

    if (darkMode === "dark") {
      html.classList.add("dark");
    } else if (darkMode === "light") {
      html.classList.remove("dark");
    } else {
      // System preference
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      html.classList.toggle("dark", isDark);

      // Listen for changes
      const listener = (e: MediaQueryListEvent) => {
        html.classList.toggle("dark", e.matches);
      };
      window.matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", listener);

      return () => {
        window.matchMedia("(prefers-color-scheme: dark)")
          .removeEventListener("change", listener);
      };
    }
  }, [darkMode]);

  return null;
}
```

### Color Tokens for Dark Mode

When styling components, always use semantic tokens:

```typescript
// DO: Use semantic tokens
<div className="bg-card text-foreground border-border" />
<span className="text-muted-foreground" />
<button className="bg-accent text-accent-foreground" />

// DON'T: Use hardcoded colors
<div className="bg-white text-black border-gray-200" />
```

### Status Badges Pattern

```typescript
// Colored badges that work in both modes
<span className="bg-green-500/10 text-green-600 dark:text-green-400">
  Approved
</span>
<span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
  Pending
</span>
<span className="bg-red-500/10 text-red-600 dark:text-red-400">
  Rejected
</span>
```

---

## Accent Colors

### Available Colors

| Color | Light Mode | Dark Mode |
|-------|------------|-----------|
| **Amber** | `#d97706` | `#fbbf24` |
| **Rose** | `#e11d48` | `#fb7185` |
| **Teal** | `#0d9488` | `#2dd4bf` |
| **Slate** | `#475569` | `#94a3b8` |
| **Forest** | `#16a34a` | `#4ade80` |
| **Indigo** | `#4f46e5` | `#818cf8` |

### Color Configuration

```typescript
accentColorOptions: {
  amber: {
    name: "Amber",
    description: "Warm golden tones",
    // Light mode
    primary: "#d97706",
    primaryForeground: "#ffffff",
    hsl: "30 81% 28%",
    // Dark mode
    darkPrimary: "#fbbf24",
    darkPrimaryForeground: "#1c1917",
    darkHsl: "45 93% 58%",
  },
  // ... other colors
}
```

---

## Custom Themes

### Adding a New Font Theme

1. **Define the theme in `lib/themes.ts`:**

```typescript
export const themes: Record<ThemeId, ThemeDefinition> = {
  // ... existing themes ...

  custom: {
    id: "custom",
    name: "Custom",
    description: "Your custom theme description",
    category: "sans-serif",
    readabilityScore: 5,
    headingFont: {
      family: "Your Font",
      googleFont: "Your_Font",
      weights: ["400", "600", "700"],
      fallback: "ui-sans-serif, system-ui, sans-serif",
    },
    bodyFont: {
      family: "Your Font",
      googleFont: "Your_Font",
      weights: ["400", "500"],
      fallback: "ui-sans-serif, system-ui, sans-serif",
    },
    recommendedAccent: "amber",
  },
};
```

2. **Add to ThemeId type:**

```typescript
export type ThemeId =
  | "system" | "classic" | ... | "custom";
```

3. **The theme loader will automatically:**
   - Generate the Google Fonts URL
   - Apply the CSS variables
   - Handle the preview in admin

### Adding a New Accent Color

1. **Add to accentColorOptions in `lib/themes.ts`:**

```typescript
accentColorOptions: {
  // ... existing colors ...

  custom: {
    name: "Custom",
    description: "Your custom color",
    primary: "#hexcolor",
    primaryForeground: "#ffffff",
    light: "#lightvariant",
    dark: "#darkvariant",
    hsl: "H S% L%",
    darkPrimary: "#darkmodeprimary",
    darkPrimaryForeground: "#1c1917",
    darkLight: "#darkmodelight",
    darkDark: "#darkmodedark",
    darkHsl: "H S% L%",
  },
}
```

2. **Add to AccentColor type:**

```typescript
export type AccentColor = "amber" | "rose" | ... | "custom";
```

---

## Admin Theme Editor

### Accessing

Navigate to `/admin/themes` (requires admin privileges).

### Features

- **Live Preview**: See changes before saving
- **Theme Selection**: Browse all font themes by category
- **Style Customization**: Adjust all style options
- **Color Selection**: Preview accent colors
- **Dark Mode Toggle**: Test light/dark appearance

### How It Works

1. Settings loaded from database on page load
2. Changes stored in local state
3. Preview updates in real-time
4. "Save" writes to database
5. Page revalidates to apply changes

### API Endpoint

```typescript
// PUT /api/admin/themes
{
  "themeId": "nordic",
  "borderRadius": "rounded",
  "buttonStyle": "soft",
  "headingStyle": "uppercase",
  "accentColor": "forest",
  "fontScale": "default",
  "darkMode": "system"
}
```

---

## Best Practices

### 1. Always Use Semantic Tokens

```typescript
// Good - adapts to theme
<div className="bg-card text-foreground border-border" />

// Bad - hardcoded colors
<div className="bg-white text-gray-900 border-gray-200" />
```

### 2. Test Both Light and Dark Modes

Before pushing changes, verify:
- Text is readable in both modes
- Contrast ratios are sufficient
- Interactive states are visible

### 3. Use Appropriate Font Scales

| Content Type | Recommendation |
|--------------|----------------|
| Dense data tables | Compact |
| Standard content | Default |
| Accessibility-focused | Spacious |

### 4. Consider Readability Scores

When selecting themes:
- **5/5**: Safe for all use cases
- **4/5**: Good for most content
- **3/5**: Best for headings/accents only

### 5. Maintain Color Consistency

Use the accent color system rather than custom colors:

```typescript
// Good - uses theme accent
<button className="bg-accent text-accent-foreground" />

// Avoid - custom color breaks theme
<button className="bg-blue-500 text-white" />
```

### 6. Preview Before Deploying

Use the admin theme editor to:
1. Test all pages
2. Check mobile appearance
3. Verify dark mode
4. Test color combinations

---

## Troubleshooting

### Fonts Not Loading

1. Check Google Fonts URL generation:
```typescript
const url = getGoogleFontsUrl(theme);
console.log(url);
```

2. Verify font family in browser DevTools

3. Check network tab for font loading errors

### Dark Mode Not Working

1. Verify `ThemeLoader` is in layout
2. Check `<html>` element has `class="dark"`
3. Verify CSS variables are defined for `.dark`

### Colors Look Wrong

1. Ensure using HSL format in CSS variables
2. Check alpha values (use `/10` for backgrounds)
3. Verify accent color is saved in database

### Theme Not Applying

1. Clear Next.js cache: `rm -rf .next`
2. Hard refresh browser: Cmd+Shift+R
3. Check database has settings row
4. Verify `revalidatePath('/')` after save

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Component architecture
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Code style guidelines
- [ADMIN_SETUP.md](./ADMIN_SETUP.md) - Admin dashboard setup
