// Theme definitions for Bad Scandi
// Each theme defines fonts, readability characteristics, and style properties

export type ThemeId =
  | "system"
  | "classic"
  | "nordic"
  | "artisan"
  | "elegant"
  | "modern"
  | "warm"
  | "editorial"
  | "handcraft"
  | "minimalist"
  | "bold";

export type BorderRadiusStyle = "default" | "sharp" | "rounded" | "pill";
export type ButtonStyle = "default" | "outline" | "soft";
export type HeadingStyle = "normal" | "uppercase" | "small-caps";
export type AccentColor = "amber" | "rose" | "teal" | "slate" | "forest" | "indigo";
export type FontScale = "compact" | "default" | "spacious";
export type DarkMode = "system" | "light" | "dark";

export interface FontConfig {
  family: string;
  googleFont: string;
  weights: string[];
  fallback: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  category: "sans-serif" | "serif-heading" | "mixed" | "display";
  readabilityScore: number; // 1-5, 5 being most readable on mobile
  headingFont: FontConfig;
  bodyFont: FontConfig;
  // Preview text for the admin panel
  previewHeading: string;
  previewBody: string;
  // Recommended pairings
  recommendedAccent?: AccentColor;
  recommendedHeadingStyle?: HeadingStyle;
}

export interface ThemeSettings {
  themeId: ThemeId;
  borderRadius: BorderRadiusStyle;
  buttonStyle: ButtonStyle;
  headingStyle: HeadingStyle;
  accentColor: AccentColor;
  fontScale: FontScale;
  darkMode: DarkMode;
}

// Theme definitions - 11 unique font combinations
export const themes: Record<ThemeId, ThemeDefinition> = {
  system: {
    id: "system",
    name: "System Default",
    description: "Uses your device's native fonts. Fast loading, no external fonts. The original Bad Scandi experience.",
    category: "sans-serif",
    readabilityScore: 5,
    headingFont: {
      family: "system-ui",
      googleFont: "", // No Google Font needed
      weights: ["400", "500", "600", "700"],
      fallback: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
    },
    bodyFont: {
      family: "system-ui",
      googleFont: "", // No Google Font needed
      weights: ["400", "500", "600"],
      fallback: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
    },
    previewHeading: "Hand-Dyed Fiber Art",
    previewBody: "Each tapestry is handcrafted using a unique dip-dyeing technique that incorporates traditional painting methods.",
    recommendedAccent: "amber",
  },

  classic: {
    id: "classic",
    name: "Classic",
    description: "Clean and highly readable Inter font. Perfect for accessibility and mobile viewing.",
    category: "sans-serif",
    readabilityScore: 5,
    headingFont: {
      family: "Inter",
      googleFont: "Inter",
      weights: ["400", "500", "600", "700"],
      fallback: "ui-sans-serif, system-ui, sans-serif",
    },
    bodyFont: {
      family: "Inter",
      googleFont: "Inter",
      weights: ["400", "500", "600"],
      fallback: "ui-sans-serif, system-ui, sans-serif",
    },
    previewHeading: "Hand-Dyed Fiber Art",
    previewBody: "Each tapestry is handcrafted using a unique dip-dyeing technique that incorporates traditional painting methods.",
    recommendedAccent: "amber",
  },

  nordic: {
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
    previewHeading: "Hand-Dyed Fiber Art",
    previewBody: "Each tapestry is handcrafted using a unique dip-dyeing technique that incorporates traditional painting methods.",
    recommendedAccent: "slate",
  },

  artisan: {
    id: "artisan",
    name: "Artisan",
    description: "Elegant Lora serif headings paired with clean DM Sans body. Warm and craft-focused.",
    category: "serif-heading",
    readabilityScore: 4,
    headingFont: {
      family: "Lora",
      googleFont: "Lora",
      weights: ["400", "500", "600", "700"],
      fallback: "ui-serif, Georgia, serif",
    },
    bodyFont: {
      family: "DM Sans",
      googleFont: "DM_Sans",
      weights: ["400", "500", "600"],
      fallback: "ui-sans-serif, system-ui, sans-serif",
    },
    previewHeading: "Hand-Dyed Fiber Art",
    previewBody: "Each tapestry is handcrafted using a unique dip-dyeing technique that incorporates traditional painting methods.",
    recommendedAccent: "forest",
  },

  elegant: {
    id: "elegant",
    name: "Elegant",
    description: "Sophisticated Playfair Display headings with DM Sans body. Perfect for a premium feel.",
    category: "serif-heading",
    readabilityScore: 4,
    headingFont: {
      family: "Playfair Display",
      googleFont: "Playfair_Display",
      weights: ["400", "500", "600", "700"],
      fallback: "ui-serif, Georgia, serif",
    },
    bodyFont: {
      family: "DM Sans",
      googleFont: "DM_Sans",
      weights: ["400", "500", "600"],
      fallback: "ui-sans-serif, system-ui, sans-serif",
    },
    previewHeading: "Hand-Dyed Fiber Art",
    previewBody: "Each tapestry is handcrafted using a unique dip-dyeing technique that incorporates traditional painting methods.",
    recommendedAccent: "rose",
    recommendedHeadingStyle: "small-caps",
  },

  modern: {
    id: "modern",
    name: "Modern",
    description: "Contemporary Plus Jakarta Sans throughout. Modern with subtle personality.",
    category: "sans-serif",
    readabilityScore: 5,
    headingFont: {
      family: "Plus Jakarta Sans",
      googleFont: "Plus_Jakarta_Sans",
      weights: ["400", "500", "600", "700"],
      fallback: "ui-sans-serif, system-ui, sans-serif",
    },
    bodyFont: {
      family: "Plus Jakarta Sans",
      googleFont: "Plus_Jakarta_Sans",
      weights: ["400", "500", "600"],
      fallback: "ui-sans-serif, system-ui, sans-serif",
    },
    previewHeading: "Hand-Dyed Fiber Art",
    previewBody: "Each tapestry is handcrafted using a unique dip-dyeing technique that incorporates traditional painting methods.",
    recommendedAccent: "indigo",
  },

  warm: {
    id: "warm",
    name: "Warm",
    description: "Soft and approachable Nunito Sans. Friendly and inviting for artisan brands.",
    category: "sans-serif",
    readabilityScore: 5,
    headingFont: {
      family: "Nunito Sans",
      googleFont: "Nunito_Sans",
      weights: ["400", "500", "600", "700"],
      fallback: "ui-sans-serif, system-ui, sans-serif",
    },
    bodyFont: {
      family: "Nunito Sans",
      googleFont: "Nunito_Sans",
      weights: ["400", "500", "600"],
      fallback: "ui-sans-serif, system-ui, sans-serif",
    },
    previewHeading: "Hand-Dyed Fiber Art",
    previewBody: "Each tapestry is handcrafted using a unique dip-dyeing technique that incorporates traditional painting methods.",
    recommendedAccent: "amber",
  },

  editorial: {
    id: "editorial",
    name: "Editorial",
    description: "Magazine-style Cormorant Garamond headings with Source Sans Pro body. Refined and literary.",
    category: "serif-heading",
    readabilityScore: 4,
    headingFont: {
      family: "Cormorant Garamond",
      googleFont: "Cormorant_Garamond",
      weights: ["400", "500", "600", "700"],
      fallback: "ui-serif, Georgia, serif",
    },
    bodyFont: {
      family: "Source Sans 3",
      googleFont: "Source_Sans_3",
      weights: ["400", "500", "600"],
      fallback: "ui-sans-serif, system-ui, sans-serif",
    },
    previewHeading: "Hand-Dyed Fiber Art",
    previewBody: "Each tapestry is handcrafted using a unique dip-dyeing technique that incorporates traditional painting methods.",
    recommendedAccent: "slate",
    recommendedHeadingStyle: "normal",
  },

  handcraft: {
    id: "handcraft",
    name: "Handcraft",
    description: "Playful Caveat script headings with friendly Quicksand body. Perfect for artisan makers.",
    category: "display",
    readabilityScore: 3,
    headingFont: {
      family: "Caveat",
      googleFont: "Caveat",
      weights: ["400", "500", "600", "700"],
      fallback: "cursive, ui-serif",
    },
    bodyFont: {
      family: "Quicksand",
      googleFont: "Quicksand",
      weights: ["400", "500", "600"],
      fallback: "ui-sans-serif, system-ui, sans-serif",
    },
    previewHeading: "Hand-Dyed Fiber Art",
    previewBody: "Each tapestry is handcrafted using a unique dip-dyeing technique that incorporates traditional painting methods.",
    recommendedAccent: "forest",
    recommendedHeadingStyle: "normal",
  },

  minimalist: {
    id: "minimalist",
    name: "Minimalist",
    description: "Clean geometric Work Sans throughout. Simple, modern, and highly legible.",
    category: "sans-serif",
    readabilityScore: 5,
    headingFont: {
      family: "Work Sans",
      googleFont: "Work_Sans",
      weights: ["400", "500", "600", "700"],
      fallback: "ui-sans-serif, system-ui, sans-serif",
    },
    bodyFont: {
      family: "Work Sans",
      googleFont: "Work_Sans",
      weights: ["400", "500", "600"],
      fallback: "ui-sans-serif, system-ui, sans-serif",
    },
    previewHeading: "Hand-Dyed Fiber Art",
    previewBody: "Each tapestry is handcrafted using a unique dip-dyeing technique that incorporates traditional painting methods.",
    recommendedAccent: "slate",
    recommendedHeadingStyle: "uppercase",
  },

  bold: {
    id: "bold",
    name: "Bold",
    description: "Statement-making Archivo Black headings with clean Archivo body. Strong and confident.",
    category: "display",
    readabilityScore: 4,
    headingFont: {
      family: "Archivo Black",
      googleFont: "Archivo_Black",
      weights: ["400"],
      fallback: "ui-sans-serif, system-ui, sans-serif",
    },
    bodyFont: {
      family: "Archivo",
      googleFont: "Archivo",
      weights: ["400", "500", "600"],
      fallback: "ui-sans-serif, system-ui, sans-serif",
    },
    previewHeading: "Hand-Dyed Fiber Art",
    previewBody: "Each tapestry is handcrafted using a unique dip-dyeing technique that incorporates traditional painting methods.",
    recommendedAccent: "indigo",
    recommendedHeadingStyle: "uppercase",
  },
};

// Border radius configurations
export const borderRadiusOptions: Record<BorderRadiusStyle, { name: string; value: string; description: string }> = {
  default: { name: "Default", value: "1rem", description: "Balanced rounded corners" },
  sharp: { name: "Sharp", value: "0.25rem", description: "Minimal rounding, modern look" },
  rounded: { name: "Rounded", value: "1.5rem", description: "Softer, friendly corners" },
  pill: { name: "Pill", value: "9999px", description: "Fully rounded ends" },
};

// Button style configurations
export const buttonStyleOptions: Record<ButtonStyle, { name: string; description: string }> = {
  default: { name: "Solid", description: "Filled background buttons" },
  outline: { name: "Outline", description: "Border-only buttons" },
  soft: { name: "Soft", description: "Subtle tinted background" },
};

// Heading style configurations
export const headingStyleOptions: Record<HeadingStyle, { name: string; description: string; css: string }> = {
  normal: { name: "Normal", description: "Standard capitalization", css: "none" },
  uppercase: { name: "Uppercase", description: "ALL CAPS headings", css: "uppercase" },
  "small-caps": { name: "Small Caps", description: "Elegant small capitals", css: "small-caps" },
};

// Accent color configurations with full color palette (light and dark modes)
export const accentColorOptions: Record<AccentColor, {
  name: string;
  description: string;
  // Light mode colors
  primary: string;
  primaryForeground: string;
  light: string;
  dark: string;
  hsl: string; // HSL values for CSS variable (light mode)
  // Dark mode colors
  darkPrimary: string;
  darkPrimaryForeground: string;
  darkLight: string;
  darkDark: string;
  darkHsl: string; // HSL values for CSS variable (dark mode)
}> = {
  amber: {
    name: "Amber",
    description: "Warm golden tones",
    primary: "#d97706",
    primaryForeground: "#ffffff",
    light: "#fef3c7",
    dark: "#92400e",
    hsl: "30 81% 28%",
    // Dark mode - brighter for visibility
    darkPrimary: "#fbbf24",
    darkPrimaryForeground: "#1c1917",
    darkLight: "#451a03",
    darkDark: "#fcd34d",
    darkHsl: "45 93% 58%",
  },
  rose: {
    name: "Rose",
    description: "Soft romantic pink",
    primary: "#e11d48",
    primaryForeground: "#ffffff",
    light: "#ffe4e6",
    dark: "#9f1239",
    hsl: "347 77% 50%",
    // Dark mode
    darkPrimary: "#fb7185",
    darkPrimaryForeground: "#1c1917",
    darkLight: "#4c0519",
    darkDark: "#fda4af",
    darkHsl: "351 91% 71%",
  },
  teal: {
    name: "Teal",
    description: "Fresh oceanic blue-green",
    primary: "#0d9488",
    primaryForeground: "#ffffff",
    light: "#ccfbf1",
    dark: "#115e59",
    hsl: "174 72% 32%",
    // Dark mode
    darkPrimary: "#2dd4bf",
    darkPrimaryForeground: "#1c1917",
    darkLight: "#042f2e",
    darkDark: "#5eead4",
    darkHsl: "171 77% 64%",
  },
  slate: {
    name: "Slate",
    description: "Sophisticated neutral",
    primary: "#475569",
    primaryForeground: "#ffffff",
    light: "#f1f5f9",
    dark: "#1e293b",
    hsl: "215 16% 47%",
    // Dark mode
    darkPrimary: "#94a3b8",
    darkPrimaryForeground: "#1c1917",
    darkLight: "#1e293b",
    darkDark: "#cbd5e1",
    darkHsl: "215 20% 65%",
  },
  forest: {
    name: "Forest",
    description: "Natural earthy green",
    primary: "#16a34a",
    primaryForeground: "#ffffff",
    light: "#dcfce7",
    dark: "#14532d",
    hsl: "142 71% 45%",
    // Dark mode
    darkPrimary: "#4ade80",
    darkPrimaryForeground: "#1c1917",
    darkLight: "#052e16",
    darkDark: "#86efac",
    darkHsl: "142 71% 73%",
  },
  indigo: {
    name: "Indigo",
    description: "Deep modern purple-blue",
    primary: "#4f46e5",
    primaryForeground: "#ffffff",
    light: "#e0e7ff",
    dark: "#3730a3",
    hsl: "239 84% 67%",
    // Dark mode
    darkPrimary: "#818cf8",
    darkPrimaryForeground: "#1c1917",
    darkLight: "#1e1b4b",
    darkDark: "#a5b4fc",
    darkHsl: "239 84% 74%",
  },
};

// Dark mode configurations
export const darkModeOptions: Record<DarkMode, { name: string; description: string; icon: string }> = {
  system: { name: "System", description: "Follow device settings", icon: "monitor" },
  light: { name: "Light", description: "Always use light mode", icon: "sun" },
  dark: { name: "Dark", description: "Always use dark mode", icon: "moon" },
};

// Font scale configurations
export const fontScaleOptions: Record<FontScale, {
  name: string;
  description: string;
  baseSize: string;
  headingScale: number;
  lineHeight: string;
}> = {
  compact: {
    name: "Compact",
    description: "Smaller text, more content visible",
    baseSize: "0.875rem",
    headingScale: 1.5,
    lineHeight: "1.5",
  },
  default: {
    name: "Default",
    description: "Balanced readability",
    baseSize: "1rem",
    headingScale: 1.75,
    lineHeight: "1.625",
  },
  spacious: {
    name: "Spacious",
    description: "Larger text, easier reading",
    baseSize: "1.125rem",
    headingScale: 2,
    lineHeight: "1.75",
  },
};

// Helper to get theme by ID with fallback
export function getTheme(themeId: string): ThemeDefinition {
  return themes[themeId as ThemeId] || themes.classic;
}

// Generate Google Fonts URL for a theme
export function getGoogleFontsUrl(theme: ThemeDefinition): string | null {
  // System theme doesn't need Google Fonts
  if (!theme.headingFont.googleFont && !theme.bodyFont.googleFont) {
    return null;
  }

  const fonts = new Set<string>();

  // Add heading font if it's a Google Font
  if (theme.headingFont.googleFont) {
    const headingWeights = theme.headingFont.weights.join(";");
    fonts.add(`family=${theme.headingFont.googleFont}:wght@${headingWeights}`);
  }

  // Add body font if different and it's a Google Font
  if (theme.bodyFont.googleFont && theme.bodyFont.googleFont !== theme.headingFont.googleFont) {
    const bodyWeights = theme.bodyFont.weights.join(";");
    fonts.add(`family=${theme.bodyFont.googleFont}:wght@${bodyWeights}`);
  }

  if (fonts.size === 0) {
    return null;
  }

  return `https://fonts.googleapis.com/css2?${Array.from(fonts).join("&")}&display=swap`;
}

// Generate CSS variables for a complete theme configuration
export function getThemeCSSVariables(settings: ThemeSettings): Record<string, string> {
  const theme = getTheme(settings.themeId);
  const accent = accentColorOptions[settings.accentColor];
  const scale = fontScaleOptions[settings.fontScale];
  const radius = borderRadiusOptions[settings.borderRadius];
  const headingStyle = headingStyleOptions[settings.headingStyle];

  return {
    "--font-heading": `"${theme.headingFont.family}", ${theme.headingFont.fallback}`,
    "--font-body": `"${theme.bodyFont.family}", ${theme.bodyFont.fallback}`,
    "--radius": radius.value,
    "--accent": accent.hsl,
    "--accent-foreground": "0 0% 98%",
    "--font-size-base": scale.baseSize,
    "--heading-scale": scale.headingScale.toString(),
    "--line-height": scale.lineHeight,
    "--heading-transform": headingStyle.css,
  };
}

// Generate CSS for a theme
export function getThemeCSS(settings: ThemeSettings): string {
  const vars = getThemeCSSVariables(settings);
  const varStrings = Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n      ");

  return `
    :root {
      ${varStrings}
    }

    body {
      font-family: var(--font-body);
      font-size: var(--font-size-base);
      line-height: var(--line-height);
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
      text-transform: var(--heading-transform);
    }
  `;
}

// Get all theme IDs
export function getThemeIds(): ThemeId[] {
  return Object.keys(themes) as ThemeId[];
}

// Get themes by category
export function getThemesByCategory(category: ThemeDefinition["category"]): ThemeDefinition[] {
  return Object.values(themes).filter((t) => t.category === category);
}

// Default theme settings
export const defaultThemeSettings: ThemeSettings = {
  themeId: "system",
  borderRadius: "default",
  buttonStyle: "default",
  headingStyle: "normal",
  accentColor: "amber",
  fontScale: "default",
  darkMode: "system",
};
