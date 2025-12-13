"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ThemeSettings,
  ThemeId,
  BorderRadiusStyle,
  ButtonStyle,
  HeadingStyle,
  AccentColor,
  FontScale,
  DarkMode,
  themes,
  borderRadiusOptions,
  buttonStyleOptions,
  headingStyleOptions,
  accentColorOptions,
  fontScaleOptions,
  darkModeOptions,
  getTheme,
  getGoogleFontsUrl,
  defaultThemeSettings,
} from "@/lib/themes";
import {
  Check,
  Eye,
  Save,
  RotateCcw,
  Smartphone,
  Monitor,
  Star,
  Type,
  Palette,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";

interface AdminThemesClientProps {
  initialSettings: ThemeSettings;
}

type TabId = "fonts" | "styles" | "colors";
type ThemeCategory = "all" | "sans-serif" | "serif-heading" | "display";

export function AdminThemesClient({ initialSettings }: AdminThemesClientProps) {
  const [savedSettings, setSavedSettings] = useState<ThemeSettings>(initialSettings);
  const [previewSettings, setPreviewSettings] = useState<ThemeSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<TabId>("fonts");
  const [themeCategory, setThemeCategory] = useState<ThemeCategory>("all");

  // Check if there are unsaved changes
  const hasChanges =
    previewSettings.themeId !== savedSettings.themeId ||
    previewSettings.borderRadius !== savedSettings.borderRadius ||
    previewSettings.buttonStyle !== savedSettings.buttonStyle ||
    previewSettings.headingStyle !== savedSettings.headingStyle ||
    previewSettings.accentColor !== savedSettings.accentColor ||
    previewSettings.fontScale !== savedSettings.fontScale ||
    previewSettings.darkMode !== savedSettings.darkMode;

  // Load fonts for preview
  useEffect(() => {
    const theme = getTheme(previewSettings.themeId);
    const fontsUrl = getGoogleFontsUrl(theme);

    // Only load fonts if URL exists (system theme doesn't need external fonts)
    if (fontsUrl) {
      const existingLink = document.querySelector(`link[href="${fontsUrl}"]`);
      if (!existingLink) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = fontsUrl;
        document.head.appendChild(link);
      }
    }
  }, [previewSettings.themeId]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/admin/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(previewSettings),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      setSavedSettings(previewSettings);
      setSaveMessage("Theme saved successfully! Changes are now live.");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage("Failed to save theme. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPreviewSettings(savedSettings);
  };

  const handleResetToDefaults = () => {
    setPreviewSettings(defaultThemeSettings);
  };

  const currentTheme = getTheme(previewSettings.themeId);
  const currentAccent = accentColorOptions[previewSettings.accentColor];
  const currentScale = fontScaleOptions[previewSettings.fontScale];
  const currentHeadingStyle = headingStyleOptions[previewSettings.headingStyle];

  // Filter themes by category
  const filteredThemes = Object.values(themes).filter(
    (theme) => themeCategory === "all" || theme.category === themeCategory
  );

  const tabs = [
    { id: "fonts" as TabId, label: "Fonts", icon: Type },
    { id: "styles" as TabId, label: "Styles", icon: SlidersHorizontal },
    { id: "colors" as TabId, label: "Colors", icon: Palette },
  ];

  const categories: { id: ThemeCategory; label: string }[] = [
    { id: "all", label: "All" },
    { id: "sans-serif", label: "Sans-Serif" },
    { id: "serif-heading", label: "Serif" },
    { id: "display", label: "Display" },
  ];

  return (
    <div className="space-y-6">
      {/* Save/Reset Bar */}
      {hasChanges && (
        <div className="sticky top-20 z-40 bg-accent/10 border border-accent/30 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-accent" />
            <span className="text-accent font-medium">
              Preview Mode - Changes not yet saved
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}

      {/* Success/Error Message */}
      {saveMessage && (
        <div
          className={`p-4 rounded-lg ${
            saveMessage.includes("success")
              ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30"
              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
          }`}
        >
          {saveMessage}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Fonts Tab */}
          {activeTab === "fonts" && (
            <div className="space-y-6">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setThemeCategory(cat.id)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                      themeCategory === cat.id
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Theme Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredThemes.map((theme) => {
                  const isSelected = previewSettings.themeId === theme.id;
                  const isSaved = savedSettings.themeId === theme.id;

                  return (
                    <button
                      key={theme.id}
                      onClick={() =>
                        setPreviewSettings((prev) => ({ ...prev, themeId: theme.id }))
                      }
                      className={`relative text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-muted-foreground bg-card"
                      }`}
                    >
                      {isSaved && (
                        <span className="absolute top-2 right-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                      {isSelected && !isSaved && (
                        <span className="absolute top-2 right-2 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                          Preview
                        </span>
                      )}

                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{theme.name}</h3>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < theme.readabilityScore
                                    ? "fill-accent text-accent"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{theme.description}</p>
                      </div>

                      <div
                        className="border-t border-border pt-3 space-y-1"
                        style={{
                          fontFamily: `"${theme.headingFont.family}", ${theme.headingFont.fallback}`,
                        }}
                      >
                        <div className="text-lg font-semibold text-foreground">
                          {theme.previewHeading}
                        </div>
                        <div
                          className="text-sm text-muted-foreground line-clamp-2"
                          style={{
                            fontFamily: `"${theme.bodyFont.family}", ${theme.bodyFont.fallback}`,
                          }}
                        >
                          {theme.previewBody}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            theme.category === "sans-serif"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : theme.category === "serif-heading"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                          }`}
                        >
                          {theme.category === "sans-serif"
                            ? "Sans-Serif"
                            : theme.category === "serif-heading"
                            ? "Serif"
                            : "Display"}
                        </span>
                        {theme.recommendedAccent && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {accentColorOptions[theme.recommendedAccent].name}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Font Scale */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Font Scale</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Adjust the base text size for better readability.
                </p>
                <div className="flex flex-wrap gap-3">
                  {(Object.keys(fontScaleOptions) as FontScale[]).map((scale) => {
                    const isSelected = previewSettings.fontScale === scale;
                    const option = fontScaleOptions[scale];

                    return (
                      <button
                        key={scale}
                        onClick={() =>
                          setPreviewSettings((prev) => ({ ...prev, fontScale: scale }))
                        }
                        className={`flex flex-col items-start gap-1 p-3 border-2 rounded-lg transition-all ${
                          isSelected
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-muted-foreground bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="h-4 w-4 text-accent" />}
                          <span className={`font-medium ${isSelected ? "text-accent" : "text-foreground"}`}>
                            {option.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Styles Tab */}
          {activeTab === "styles" && (
            <div className="space-y-8">
              {/* Heading Style */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Heading Style</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose how headings are displayed across the site.
                </p>
                <div className="flex flex-wrap gap-3">
                  {(Object.keys(headingStyleOptions) as HeadingStyle[]).map((style) => {
                    const isSelected = previewSettings.headingStyle === style;
                    const option = headingStyleOptions[style];

                    return (
                      <button
                        key={style}
                        onClick={() =>
                          setPreviewSettings((prev) => ({ ...prev, headingStyle: style }))
                        }
                        className={`flex flex-col items-start gap-1 p-4 border-2 rounded-lg transition-all ${
                          isSelected
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-muted-foreground bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="h-4 w-4 text-accent" />}
                          <span className={`font-medium ${isSelected ? "text-accent" : "text-foreground"}`}>
                            {option.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                        <div
                          className="mt-2 text-sm font-semibold text-foreground"
                          style={{
                            textTransform: option.css as "uppercase" | "none",
                            fontVariant: style === "small-caps" ? "small-caps" : "normal",
                          }}
                        >
                          Sample Heading
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Corner Style */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Corner Style</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Set the border radius for cards, buttons, and inputs.
                </p>
                <div className="flex flex-wrap gap-3">
                  {(Object.keys(borderRadiusOptions) as BorderRadiusStyle[]).map((radius) => {
                    const isSelected = previewSettings.borderRadius === radius;
                    const option = borderRadiusOptions[radius];

                    return (
                      <button
                        key={radius}
                        onClick={() =>
                          setPreviewSettings((prev) => ({ ...prev, borderRadius: radius }))
                        }
                        className={`flex items-center gap-2 px-4 py-3 border-2 transition-all ${
                          isSelected
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-muted-foreground bg-card"
                        }`}
                        style={{ borderRadius: option.value }}
                      >
                        {isSelected && <Check className="h-4 w-4 text-accent" />}
                        <div className="text-left">
                          <div className={`font-medium ${isSelected ? "text-accent" : "text-foreground"}`}>
                            {option.name}
                          </div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Button Style */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Button Style</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose the default appearance for primary buttons.
                </p>
                <div className="flex flex-wrap gap-3">
                  {(Object.keys(buttonStyleOptions) as ButtonStyle[]).map((style) => {
                    const isSelected = previewSettings.buttonStyle === style;
                    const option = buttonStyleOptions[style];

                    return (
                      <button
                        key={style}
                        onClick={() =>
                          setPreviewSettings((prev) => ({ ...prev, buttonStyle: style }))
                        }
                        className={`flex flex-col items-start gap-2 p-4 border-2 transition-all rounded-lg ${
                          isSelected
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-muted-foreground bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="h-4 w-4 text-accent" />}
                          <span className={`font-medium ${isSelected ? "text-accent" : "text-foreground"}`}>
                            {option.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                        {/* Button preview */}
                        <div
                          className={`mt-2 px-4 py-2 text-sm font-medium ${
                            style === "outline"
                              ? "border-2 border-foreground text-foreground bg-transparent"
                              : style === "soft"
                              ? "bg-muted text-foreground"
                              : "bg-foreground text-background"
                          }`}
                          style={{ borderRadius: borderRadiusOptions[previewSettings.borderRadius].value }}
                        >
                          Button
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Colors Tab */}
          {activeTab === "colors" && (
            <div className="space-y-8">
              {/* Dark Mode */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Appearance</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose how the site appears. System follows your device settings.
                </p>
                <div className="flex flex-wrap gap-3">
                  {(Object.keys(darkModeOptions) as DarkMode[]).map((mode) => {
                    const isSelected = previewSettings.darkMode === mode;
                    const option = darkModeOptions[mode];
                    const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;

                    return (
                      <button
                        key={mode}
                        onClick={() =>
                          setPreviewSettings((prev) => ({ ...prev, darkMode: mode }))
                        }
                        className={`flex items-center gap-3 px-4 py-3 border-2 rounded-lg transition-all ${
                          isSelected
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-muted-foreground bg-card"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? "text-accent" : "text-muted-foreground"}`} />
                        <div className="text-left">
                          <div className={`font-medium ${isSelected ? "text-accent" : "text-foreground"}`}>
                            {option.name}
                          </div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-accent ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Accent Color</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  The primary color used for buttons, links, and highlights.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(Object.keys(accentColorOptions) as AccentColor[]).map((color) => {
                    const isSelected = previewSettings.accentColor === color;
                    const option = accentColorOptions[color];

                    return (
                      <button
                        key={color}
                        onClick={() =>
                          setPreviewSettings((prev) => ({ ...prev, accentColor: color }))
                        }
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                          isSelected
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-muted-foreground bg-card"
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full shadow-inner"
                          style={{ backgroundColor: option.primary }}
                        />
                        <div className="text-left">
                          <div className={`font-medium ${isSelected ? "text-accent" : "text-foreground"}`}>
                            {option.name}
                          </div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-accent ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Preview */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-foreground mb-3">Color Preview</h4>
                <div className="flex flex-wrap gap-2">
                  <div
                    className="px-4 py-2 text-sm font-medium text-white rounded"
                    style={{ backgroundColor: currentAccent.primary }}
                  >
                    Primary Button
                  </div>
                  <div
                    className="px-4 py-2 text-sm font-medium border-2 rounded"
                    style={{ borderColor: currentAccent.primary, color: currentAccent.primary }}
                  >
                    Outline Button
                  </div>
                  <div
                    className="px-4 py-2 text-sm font-medium rounded"
                    style={{ backgroundColor: currentAccent.light, color: currentAccent.dark }}
                  >
                    Soft Button
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reset to Defaults */}
          <div className="pt-4 border-t border-border">
            <button
              onClick={handleResetToDefaults}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Reset all settings to defaults
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-32">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Live Preview</h2>
              <div className="flex border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-2 ${
                    previewDevice === "desktop"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Desktop preview"
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-2 ${
                    previewDevice === "mobile"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Mobile preview"
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              className={`border border-border rounded-lg overflow-hidden bg-card shadow-xs ${
                previewDevice === "mobile" ? "max-w-[320px] mx-auto" : ""
              }`}
            >
              {/* Mock header */}
              <div className="bg-card border-b border-border px-4 py-3">
                <div className="flex items-center justify-between">
                  <span
                    className="font-semibold text-foreground"
                    style={{
                      fontFamily: `"${currentTheme.headingFont.family}", ${currentTheme.headingFont.fallback}`,
                      textTransform: currentHeadingStyle.css as "uppercase" | "none",
                      fontVariant: previewSettings.headingStyle === "small-caps" ? "small-caps" : "normal",
                    }}
                  >
                    Bad Scandi
                  </span>
                  <div className="flex gap-2">
                    <div className="w-12 h-2 bg-muted rounded"></div>
                    <div className="w-12 h-2 bg-muted rounded"></div>
                  </div>
                </div>
              </div>

              {/* Mock content */}
              <div className="p-4 space-y-4 bg-muted">
                <div
                  className="font-bold text-foreground"
                  style={{
                    fontFamily: `"${currentTheme.headingFont.family}", ${currentTheme.headingFont.fallback}`,
                    fontSize: previewDevice === "mobile" ? "1.25rem" : `calc(1.25rem * ${currentScale.headingScale / 1.75})`,
                    textTransform: currentHeadingStyle.css as "uppercase" | "none",
                    fontVariant: previewSettings.headingStyle === "small-caps" ? "small-caps" : "normal",
                  }}
                >
                  Hand-Dyed Fiber Art
                </div>

                <p
                  className="text-muted-foreground"
                  style={{
                    fontFamily: `"${currentTheme.bodyFont.family}", ${currentTheme.bodyFont.fallback}`,
                    fontSize: previewDevice === "mobile" ? "0.875rem" : currentScale.baseSize,
                    lineHeight: currentScale.lineHeight,
                  }}
                >
                  Each tapestry is handcrafted using a unique dip-dyeing technique.
                </p>

                {/* Mock product card */}
                <div
                  className="bg-card p-3 border border-border"
                  style={{ borderRadius: borderRadiusOptions[previewSettings.borderRadius].value }}
                >
                  <div
                    className="aspect-square mb-2"
                    style={{
                      backgroundColor: currentAccent.light,
                      borderRadius: `calc(${borderRadiusOptions[previewSettings.borderRadius].value} - 4px)`,
                    }}
                  />
                  <div
                    className="font-medium text-sm text-foreground"
                    style={{
                      fontFamily: `"${currentTheme.headingFont.family}", ${currentTheme.headingFont.fallback}`,
                    }}
                  >
                    Ocean Waves Tapestry
                  </div>
                  <div
                    className="text-xs"
                    style={{
                      fontFamily: `"${currentTheme.bodyFont.family}", ${currentTheme.bodyFont.fallback}`,
                      color: currentAccent.primary,
                    }}
                  >
                    $185.00
                  </div>
                </div>

                {/* Mock buttons */}
                <div className="flex gap-2">
                  <button
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      previewSettings.buttonStyle === "outline"
                        ? "border-2 bg-transparent"
                        : previewSettings.buttonStyle === "soft"
                        ? ""
                        : "text-white"
                    }`}
                    style={{
                      borderRadius: borderRadiusOptions[previewSettings.borderRadius].value,
                      fontFamily: `"${currentTheme.bodyFont.family}", ${currentTheme.bodyFont.fallback}`,
                      backgroundColor:
                        previewSettings.buttonStyle === "outline"
                          ? "transparent"
                          : previewSettings.buttonStyle === "soft"
                          ? currentAccent.light
                          : currentAccent.primary,
                      borderColor: previewSettings.buttonStyle === "outline" ? currentAccent.primary : undefined,
                      color:
                        previewSettings.buttonStyle === "outline"
                          ? currentAccent.primary
                          : previewSettings.buttonStyle === "soft"
                          ? currentAccent.dark
                          : currentAccent.primaryForeground,
                    }}
                  >
                    Add to Cart
                  </button>
                  <button
                    className="px-4 py-2 text-sm border border-border text-muted-foreground"
                    style={{
                      borderRadius: borderRadiusOptions[previewSettings.borderRadius].value,
                      fontFamily: `"${currentTheme.bodyFont.family}", ${currentTheme.bodyFont.fallback}`,
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>

            {/* Font & Settings info */}
            <div className="mt-4 p-3 bg-muted rounded-lg text-sm space-y-2">
              <div className="font-medium text-foreground">Current Settings:</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                <div className="text-muted-foreground">Theme:</div>
                <div className="text-foreground">{currentTheme.name}</div>
                <div className="text-muted-foreground">Headings:</div>
                <div className="text-foreground">{currentTheme.headingFont.family}</div>
                <div className="text-muted-foreground">Body:</div>
                <div className="text-foreground">{currentTheme.bodyFont.family}</div>
                <div className="text-muted-foreground">Accent:</div>
                <div className="flex items-center gap-1 text-foreground">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentAccent.primary }}
                  />
                  {currentAccent.name}
                </div>
                <div className="text-muted-foreground">Scale:</div>
                <div className="text-foreground">{currentScale.name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
