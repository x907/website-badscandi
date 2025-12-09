"use client";

import { useEffect, useState } from "react";
import {
  ThemeSettings,
  getTheme,
  getGoogleFontsUrl,
  borderRadiusOptions,
  accentColorOptions,
  fontScaleOptions,
  headingStyleOptions,
  defaultThemeSettings,
} from "@/lib/themes";

interface ThemeLoaderProps {
  initialSettings?: ThemeSettings;
}

export function ThemeLoader({ initialSettings }: ThemeLoaderProps) {
  const [settings, setSettings] = useState<ThemeSettings>(
    initialSettings || defaultThemeSettings
  );

  // Fetch settings on mount if not provided
  useEffect(() => {
    if (!initialSettings) {
      fetch("/api/admin/themes")
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) {
            setSettings(data.settings);
          }
        })
        .catch(console.error);
    }
  }, [initialSettings]);

  // Apply theme CSS variables and load fonts
  useEffect(() => {
    const theme = getTheme(settings.themeId);
    const accent = accentColorOptions[settings.accentColor];
    const scale = fontScaleOptions[settings.fontScale];
    const headingStyle = headingStyleOptions[settings.headingStyle];

    // Load Google Fonts
    const fontsUrl = getGoogleFontsUrl(theme);
    const existingLink = document.querySelector("link[data-theme-fonts]");

    if (existingLink) {
      existingLink.setAttribute("href", fontsUrl);
    } else {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = fontsUrl;
      link.setAttribute("data-theme-fonts", "true");
      document.head.appendChild(link);
    }

    // Apply CSS variables to root
    const root = document.documentElement;

    // Font families
    root.style.setProperty(
      "--font-heading",
      `"${theme.headingFont.family}", ${theme.headingFont.fallback}`
    );
    root.style.setProperty(
      "--font-body",
      `"${theme.bodyFont.family}", ${theme.bodyFont.fallback}`
    );

    // Border radius
    root.style.setProperty(
      "--radius",
      borderRadiusOptions[settings.borderRadius].value
    );

    // Accent color (HSL format for Tailwind compatibility)
    root.style.setProperty("--accent", accent.hsl);
    root.style.setProperty("--accent-foreground", "0 0% 98%");

    // Font scale
    root.style.setProperty("--font-size-base", scale.baseSize);
    root.style.setProperty("--heading-scale", scale.headingScale.toString());
    root.style.setProperty("--line-height", scale.lineHeight);

    // Heading transform
    root.style.setProperty("--heading-transform", headingStyle.css);

    // Apply to body
    document.body.style.fontFamily = `var(--font-body)`;
  }, [settings]);

  // This component doesn't render anything visible
  return null;
}
