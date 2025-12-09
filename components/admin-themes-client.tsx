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
        <div className="sticky top-20 z-40 bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-amber-700" />
            <span className="text-amber-800 font-medium">
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
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {saveMessage}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
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
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
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
                          ? "border-amber-500 bg-amber-50"
                          : "border-neutral-200 hover:border-neutral-300 bg-white"
                      }`}
                    >
                      {isSaved && (
                        <span className="absolute top-2 right-2 text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                      {isSelected && !isSaved && (
                        <span className="absolute top-2 right-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                          Preview
                        </span>
                      )}

                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-neutral-900">{theme.name}</h3>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < theme.readabilityScore
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-neutral-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500">{theme.description}</p>
                      </div>

                      <div
                        className="border-t border-neutral-100 pt-3 space-y-1"
                        style={{
                          fontFamily: `"${theme.headingFont.family}", ${theme.headingFont.fallback}`,
                        }}
                      >
                        <div className="text-lg font-semibold text-neutral-900">
                          {theme.previewHeading}
                        </div>
                        <div
                          className="text-sm text-neutral-600 line-clamp-2"
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
                              ? "bg-blue-100 text-blue-700"
                              : theme.category === "serif-heading"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {theme.category === "sans-serif"
                            ? "Sans-Serif"
                            : theme.category === "serif-heading"
                            ? "Serif"
                            : "Display"}
                        </span>
                        {theme.recommendedAccent && (
                          <span className="text-xs text-neutral-400 flex items-center gap-1">
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
                <h3 className="text-lg font-semibold mb-3">Font Scale</h3>
                <p className="text-sm text-neutral-600 mb-4">
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
                            ? "border-amber-500 bg-amber-50"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="h-4 w-4 text-amber-600" />}
                          <span className={`font-medium ${isSelected ? "text-amber-900" : "text-neutral-700"}`}>
                            {option.name}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500">{option.description}</span>
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
                <h3 className="text-lg font-semibold mb-3">Heading Style</h3>
                <p className="text-sm text-neutral-600 mb-4">
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
                            ? "border-amber-500 bg-amber-50"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="h-4 w-4 text-amber-600" />}
                          <span className={`font-medium ${isSelected ? "text-amber-900" : "text-neutral-700"}`}>
                            {option.name}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500">{option.description}</span>
                        <div
                          className="mt-2 text-sm font-semibold"
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
                <h3 className="text-lg font-semibold mb-3">Corner Style</h3>
                <p className="text-sm text-neutral-600 mb-4">
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
                            ? "border-amber-500 bg-amber-50"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        }`}
                        style={{ borderRadius: option.value }}
                      >
                        {isSelected && <Check className="h-4 w-4 text-amber-600" />}
                        <div className="text-left">
                          <div className={`font-medium ${isSelected ? "text-amber-900" : "text-neutral-700"}`}>
                            {option.name}
                          </div>
                          <div className="text-xs text-neutral-500">{option.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Button Style */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Button Style</h3>
                <p className="text-sm text-neutral-600 mb-4">
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
                            ? "border-amber-500 bg-amber-50"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="h-4 w-4 text-amber-600" />}
                          <span className={`font-medium ${isSelected ? "text-amber-900" : "text-neutral-700"}`}>
                            {option.name}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500">{option.description}</span>
                        {/* Button preview */}
                        <div
                          className={`mt-2 px-4 py-2 text-sm font-medium ${
                            style === "outline"
                              ? "border-2 border-neutral-900 text-neutral-900 bg-transparent"
                              : style === "soft"
                              ? "bg-neutral-100 text-neutral-900"
                              : "bg-neutral-900 text-white"
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
                <h3 className="text-lg font-semibold mb-3">Appearance</h3>
                <p className="text-sm text-neutral-600 mb-4">
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
                            ? "border-amber-500 bg-amber-50"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? "text-amber-600" : "text-neutral-500"}`} />
                        <div className="text-left">
                          <div className={`font-medium ${isSelected ? "text-amber-900" : "text-neutral-700"}`}>
                            {option.name}
                          </div>
                          <div className="text-xs text-neutral-500">{option.description}</div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-amber-600 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Accent Color</h3>
                <p className="text-sm text-neutral-600 mb-4">
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
                            ? "border-amber-500 bg-amber-50"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full shadow-inner"
                          style={{ backgroundColor: option.primary }}
                        />
                        <div className="text-left">
                          <div className={`font-medium ${isSelected ? "text-amber-900" : "text-neutral-700"}`}>
                            {option.name}
                          </div>
                          <div className="text-xs text-neutral-500">{option.description}</div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-amber-600 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Preview */}
              <div className="p-4 bg-neutral-100 rounded-lg">
                <h4 className="font-medium mb-3">Color Preview</h4>
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
          <div className="pt-4 border-t border-neutral-200">
            <button
              onClick={handleResetToDefaults}
              className="text-sm text-neutral-500 hover:text-neutral-700 underline"
            >
              Reset all settings to defaults
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-32">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Live Preview</h2>
              <div className="flex border border-neutral-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-2 ${
                    previewDevice === "desktop"
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                  title="Desktop preview"
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-2 ${
                    previewDevice === "mobile"
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                  title="Mobile preview"
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              className={`border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-sm ${
                previewDevice === "mobile" ? "max-w-[320px] mx-auto" : ""
              }`}
            >
              {/* Mock header */}
              <div className="bg-white border-b border-neutral-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span
                    className="font-semibold text-neutral-900"
                    style={{
                      fontFamily: `"${currentTheme.headingFont.family}", ${currentTheme.headingFont.fallback}`,
                      textTransform: currentHeadingStyle.css as "uppercase" | "none",
                      fontVariant: previewSettings.headingStyle === "small-caps" ? "small-caps" : "normal",
                    }}
                  >
                    Bad Scandi
                  </span>
                  <div className="flex gap-2">
                    <div className="w-12 h-2 bg-neutral-200 rounded"></div>
                    <div className="w-12 h-2 bg-neutral-200 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Mock content */}
              <div className="p-4 space-y-4 bg-neutral-50">
                <div
                  className="font-bold text-neutral-900"
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
                  className="text-neutral-600"
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
                  className="bg-white p-3 border border-neutral-200"
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
                    className="font-medium text-sm"
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
                    className="px-4 py-2 text-sm border border-neutral-300 text-neutral-700"
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
            <div className="mt-4 p-3 bg-neutral-100 rounded-lg text-sm space-y-2">
              <div className="font-medium text-neutral-900">Current Settings:</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-neutral-600">
                <div className="text-neutral-500">Theme:</div>
                <div>{currentTheme.name}</div>
                <div className="text-neutral-500">Headings:</div>
                <div>{currentTheme.headingFont.family}</div>
                <div className="text-neutral-500">Body:</div>
                <div>{currentTheme.bodyFont.family}</div>
                <div className="text-neutral-500">Accent:</div>
                <div className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentAccent.primary }}
                  />
                  {currentAccent.name}
                </div>
                <div className="text-neutral-500">Scale:</div>
                <div>{currentScale.name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
