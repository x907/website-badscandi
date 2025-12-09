"use client";

import { useEffect, useState } from "react";
import {
  ThemeSettings,
  getTheme,
  getGoogleFontsUrl,
  borderRadiusOptions,
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

    // Apply CSS variables
    const root = document.documentElement;
    root.style.setProperty(
      "--font-heading",
      `"${theme.headingFont.family}", ${theme.headingFont.fallback}`
    );
    root.style.setProperty(
      "--font-body",
      `"${theme.bodyFont.family}", ${theme.bodyFont.fallback}`
    );
    root.style.setProperty(
      "--radius",
      borderRadiusOptions[settings.borderRadius].value
    );

    // Apply to body
    document.body.style.fontFamily = `var(--font-body)`;
  }, [settings]);

  // This component doesn't render anything visible
  return null;
}
