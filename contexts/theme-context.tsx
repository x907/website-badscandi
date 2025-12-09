"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  ThemeSettings,
  ThemeDefinition,
  getTheme,
  getGoogleFontsUrl,
  defaultThemeSettings,
  borderRadiusOptions,
  ThemeId,
  BorderRadiusStyle,
  ButtonStyle,
} from "@/lib/themes";

interface ThemeContextValue {
  settings: ThemeSettings;
  theme: ThemeDefinition;
  isLoading: boolean;
  // For admin preview mode (doesn't persist)
  previewTheme: (themeId: ThemeId) => void;
  previewBorderRadius: (radius: BorderRadiusStyle) => void;
  previewButtonStyle: (style: ButtonStyle) => void;
  resetPreview: () => void;
  isPreviewMode: boolean;
  // For persisting changes
  saveSettings: (settings: Partial<ThemeSettings>) => Promise<void>;
  isSaving: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  initialSettings?: ThemeSettings;
}

export function ThemeProvider({ children, initialSettings }: ThemeProviderProps) {
  // Actual saved settings
  const [savedSettings, setSavedSettings] = useState<ThemeSettings>(
    initialSettings || defaultThemeSettings
  );
  // Preview settings (for admin testing without saving)
  const [previewSettings, setPreviewSettings] = useState<ThemeSettings | null>(null);
  const [isLoading, setIsLoading] = useState(!initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  // Active settings are preview if set, otherwise saved
  const activeSettings = previewSettings || savedSettings;
  const theme = getTheme(activeSettings.themeId);
  const isPreviewMode = previewSettings !== null;

  // Fetch settings on mount if not provided
  useEffect(() => {
    if (!initialSettings) {
      fetch("/api/admin/themes")
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) {
            setSavedSettings(data.settings);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [initialSettings]);

  // Apply theme CSS variables and load fonts
  useEffect(() => {
    // Load Google Fonts
    const fontsUrl = getGoogleFontsUrl(theme);
    const existingLink = document.querySelector('link[data-theme-fonts]');

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
    root.style.setProperty("--font-heading", `"${theme.headingFont.family}", ${theme.headingFont.fallback}`);
    root.style.setProperty("--font-body", `"${theme.bodyFont.family}", ${theme.bodyFont.fallback}`);
    root.style.setProperty("--radius", borderRadiusOptions[activeSettings.borderRadius].value);

    // Apply to body
    document.body.style.fontFamily = `var(--font-body)`;

  }, [theme, activeSettings.borderRadius]);

  // Preview functions (don't persist to database)
  const previewTheme = (themeId: ThemeId) => {
    setPreviewSettings((prev) => ({
      ...(prev || savedSettings),
      themeId,
    }));
  };

  const previewBorderRadius = (radius: BorderRadiusStyle) => {
    setPreviewSettings((prev) => ({
      ...(prev || savedSettings),
      borderRadius: radius,
    }));
  };

  const previewButtonStyle = (style: ButtonStyle) => {
    setPreviewSettings((prev) => ({
      ...(prev || savedSettings),
      buttonStyle: style,
    }));
  };

  const resetPreview = () => {
    setPreviewSettings(null);
  };

  // Save settings to database
  const saveSettings = async (newSettings: Partial<ThemeSettings>) => {
    setIsSaving(true);
    try {
      const updatedSettings = {
        ...savedSettings,
        ...newSettings,
      };

      const res = await fetch("/api/admin/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings),
      });

      if (!res.ok) {
        throw new Error("Failed to save theme settings");
      }

      setSavedSettings(updatedSettings);
      setPreviewSettings(null); // Clear preview after save
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        settings: activeSettings,
        theme,
        isLoading,
        previewTheme,
        previewBorderRadius,
        previewButtonStyle,
        resetPreview,
        isPreviewMode,
        saveSettings,
        isSaving,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
