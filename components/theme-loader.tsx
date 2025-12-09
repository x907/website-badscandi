"use client";

import { useEffect, useState } from "react";
import {
  ThemeSettings,
  DarkMode,
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
  const [isDark, setIsDark] = useState(false);

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

  // Handle dark mode based on settings and system preference
  useEffect(() => {
    const darkModeSetting = settings.darkMode || "system";

    const updateDarkMode = (prefersDark: boolean) => {
      if (darkModeSetting === "dark") {
        setIsDark(true);
      } else if (darkModeSetting === "light") {
        setIsDark(false);
      } else {
        // System preference
        setIsDark(prefersDark);
      }
    };

    // Check system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    updateDarkMode(mediaQuery.matches);

    // Listen for system preference changes
    const handleChange = (e: MediaQueryListEvent) => {
      if (darkModeSetting === "system") {
        updateDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [settings.darkMode]);

  // Apply dark class to html element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Apply theme CSS variables and load fonts
  useEffect(() => {
    const theme = getTheme(settings.themeId);
    const accent = accentColorOptions[settings.accentColor];
    const scale = fontScaleOptions[settings.fontScale];
    const headingStyle = headingStyleOptions[settings.headingStyle];

    // Load Google Fonts (only if not system theme)
    const fontsUrl = getGoogleFontsUrl(theme);
    const existingLink = document.querySelector("link[data-theme-fonts]");

    if (fontsUrl) {
      if (existingLink) {
        existingLink.setAttribute("href", fontsUrl);
      } else {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = fontsUrl;
        link.setAttribute("data-theme-fonts", "true");
        document.head.appendChild(link);
      }
    } else if (existingLink) {
      // Remove the font link if switching to system theme
      existingLink.remove();
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

    // Accent color - use dark mode variants when in dark mode
    if (isDark) {
      root.style.setProperty("--accent", accent.darkHsl);
      root.style.setProperty("--accent-foreground", "0 0% 9%");
    } else {
      root.style.setProperty("--accent", accent.hsl);
      root.style.setProperty("--accent-foreground", "0 0% 98%");
    }

    // Font scale
    root.style.setProperty("--font-size-base", scale.baseSize);
    root.style.setProperty("--heading-scale", scale.headingScale.toString());
    root.style.setProperty("--line-height", scale.lineHeight);

    // Heading transform
    root.style.setProperty("--heading-transform", headingStyle.css);

    // Apply to body
    document.body.style.fontFamily = `var(--font-body)`;
  }, [settings, isDark]);

  // This component doesn't render anything visible
  return null;
}
