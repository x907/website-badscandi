// Theme definitions for Bad Scandi
// Each theme defines fonts, readability characteristics, and style properties

export type ThemeId = "classic" | "nordic" | "artisan" | "elegant" | "modern" | "warm";

export type BorderRadiusStyle = "default" | "sharp" | "rounded" | "pill";
export type ButtonStyle = "default" | "outline" | "soft";

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
  category: "sans-serif" | "serif-heading" | "mixed";
  readabilityScore: number; // 1-5, 5 being most readable on mobile
  headingFont: FontConfig;
  bodyFont: FontConfig;
  // Preview text for the admin panel
  previewHeading: string;
  previewBody: string;
  // CSS variable overrides (optional)
  cssVars?: Record<string, string>;
}

export interface ThemeSettings {
  themeId: ThemeId;
  borderRadius: BorderRadiusStyle;
  buttonStyle: ButtonStyle;
}

// Theme definitions
export const themes: Record<ThemeId, ThemeDefinition> = {
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
  },
};

// Border radius configurations
export const borderRadiusOptions: Record<BorderRadiusStyle, { name: string; value: string }> = {
  default: { name: "Default", value: "1rem" },
  sharp: { name: "Sharp", value: "0.25rem" },
  rounded: { name: "Rounded", value: "1.5rem" },
  pill: { name: "Pill", value: "9999px" },
};

// Button style configurations
export const buttonStyleOptions: Record<ButtonStyle, { name: string; description: string }> = {
  default: { name: "Default", description: "Solid filled buttons" },
  outline: { name: "Outline", description: "Border-only buttons" },
  soft: { name: "Soft", description: "Subtle background tint" },
};

// Helper to get theme by ID with fallback
export function getTheme(themeId: string): ThemeDefinition {
  return themes[themeId as ThemeId] || themes.classic;
}

// Generate Google Fonts URL for a theme
export function getGoogleFontsUrl(theme: ThemeDefinition): string {
  const fonts = new Set<string>();

  // Add heading font
  const headingWeights = theme.headingFont.weights.join(";");
  fonts.add(`family=${theme.headingFont.googleFont}:wght@${headingWeights}`);

  // Add body font if different
  if (theme.bodyFont.googleFont !== theme.headingFont.googleFont) {
    const bodyWeights = theme.bodyFont.weights.join(";");
    fonts.add(`family=${theme.bodyFont.googleFont}:wght@${bodyWeights}`);
  }

  return `https://fonts.googleapis.com/css2?${Array.from(fonts).join("&")}&display=swap`;
}

// Generate CSS for a theme
export function getThemeCSS(theme: ThemeDefinition, borderRadius: BorderRadiusStyle = "default"): string {
  const radiusValue = borderRadiusOptions[borderRadius].value;

  return `
    :root {
      --font-heading: "${theme.headingFont.family}", ${theme.headingFont.fallback};
      --font-body: "${theme.bodyFont.family}", ${theme.bodyFont.fallback};
      --radius: ${radiusValue};
    }

    body {
      font-family: var(--font-body);
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
    }
  `;
}

// Get all theme IDs
export function getThemeIds(): ThemeId[] {
  return Object.keys(themes) as ThemeId[];
}

// Default theme settings
export const defaultThemeSettings: ThemeSettings = {
  themeId: "classic",
  borderRadius: "default",
  buttonStyle: "default",
};
