"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ThemeSettings,
  ThemeId,
  BorderRadiusStyle,
  ButtonStyle,
  themes,
  borderRadiusOptions,
  buttonStyleOptions,
  getTheme,
  getGoogleFontsUrl,
} from "@/lib/themes";
import { Check, Eye, Save, RotateCcw, Smartphone, Monitor, Star } from "lucide-react";

interface AdminThemesClientProps {
  initialSettings: ThemeSettings;
}

export function AdminThemesClient({ initialSettings }: AdminThemesClientProps) {
  const [savedSettings, setSavedSettings] = useState<ThemeSettings>(initialSettings);
  const [previewSettings, setPreviewSettings] = useState<ThemeSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Check if there are unsaved changes
  const hasChanges =
    previewSettings.themeId !== savedSettings.themeId ||
    previewSettings.borderRadius !== savedSettings.borderRadius ||
    previewSettings.buttonStyle !== savedSettings.buttonStyle;

  // Load fonts for preview
  useEffect(() => {
    const theme = getTheme(previewSettings.themeId);
    const fontsUrl = getGoogleFontsUrl(theme);

    // Check if link already exists
    const existingLink = document.querySelector(`link[href="${fontsUrl}"]`);
    if (!existingLink) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = fontsUrl;
      document.head.appendChild(link);
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

      // Clear message after 3 seconds
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

  const currentTheme = getTheme(previewSettings.themeId);

  return (
    <div className="space-y-8">
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
        {/* Theme Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Font Themes</h2>
            <p className="text-neutral-600 text-sm mb-6">
              Choose a font combination. Themes with higher readability scores work better on mobile devices.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {Object.values(themes).map((theme) => {
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
                    {/* Current badge */}
                    {isSaved && (
                      <span className="absolute top-2 right-2 text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                        Current
                      </span>
                    )}

                    {/* Selected indicator */}
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

                    {/* Font preview */}
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

                    {/* Category badge */}
                    <div className="mt-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          theme.category === "sans-serif"
                            ? "bg-blue-100 text-blue-700"
                            : theme.category === "serif-heading"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {theme.category === "sans-serif"
                          ? "Sans-Serif"
                          : theme.category === "serif-heading"
                          ? "Serif Headings"
                          : "Mixed"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Corner Style</h2>
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
                    className={`flex items-center gap-2 px-4 py-2 border-2 transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-50"
                        : "border-neutral-200 hover:border-neutral-300 bg-white"
                    }`}
                    style={{ borderRadius: option.value }}
                  >
                    {isSelected && <Check className="h-4 w-4 text-amber-600" />}
                    <span className={isSelected ? "text-amber-900" : "text-neutral-700"}>
                      {option.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Button Style */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Button Style</h2>
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
                    className={`flex flex-col items-start gap-1 p-4 border-2 transition-all rounded-lg ${
                      isSelected
                        ? "border-amber-500 bg-amber-50"
                        : "border-neutral-200 hover:border-neutral-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected && <Check className="h-4 w-4 text-amber-600" />}
                      <span
                        className={`font-medium ${
                          isSelected ? "text-amber-900" : "text-neutral-700"
                        }`}
                      >
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

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-32">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Live Preview</h2>
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
                    }}
                  >
                    Bad Scandi
                  </span>
                  <div className="flex gap-2">
                    <div className="w-16 h-2 bg-neutral-200 rounded"></div>
                    <div className="w-16 h-2 bg-neutral-200 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Mock content */}
              <div className="p-4 space-y-4 bg-neutral-50">
                <div
                  className="text-xl font-bold text-neutral-900"
                  style={{
                    fontFamily: `"${currentTheme.headingFont.family}", ${currentTheme.headingFont.fallback}`,
                  }}
                >
                  Hand-Dyed Fiber Art
                </div>

                <p
                  className={`text-neutral-600 ${
                    previewDevice === "mobile" ? "text-sm" : ""
                  }`}
                  style={{
                    fontFamily: `"${currentTheme.bodyFont.family}", ${currentTheme.bodyFont.fallback}`,
                  }}
                >
                  Each tapestry is handcrafted using a unique dip-dyeing technique that
                  incorporates traditional painting methods.
                </p>

                {/* Mock product card */}
                <div
                  className="bg-white p-3 border border-neutral-200"
                  style={{ borderRadius: borderRadiusOptions[previewSettings.borderRadius].value }}
                >
                  <div className="aspect-square bg-neutral-100 mb-2 rounded"></div>
                  <div
                    className="font-medium text-sm"
                    style={{
                      fontFamily: `"${currentTheme.headingFont.family}", ${currentTheme.headingFont.fallback}`,
                    }}
                  >
                    Ocean Waves Tapestry
                  </div>
                  <div
                    className="text-xs text-neutral-500"
                    style={{
                      fontFamily: `"${currentTheme.bodyFont.family}", ${currentTheme.bodyFont.fallback}`,
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
                        ? "border-2 border-neutral-900 text-neutral-900 bg-transparent"
                        : previewSettings.buttonStyle === "soft"
                        ? "bg-neutral-100 text-neutral-900"
                        : "bg-neutral-900 text-white"
                    }`}
                    style={{
                      borderRadius: borderRadiusOptions[previewSettings.borderRadius].value,
                      fontFamily: `"${currentTheme.bodyFont.family}", ${currentTheme.bodyFont.fallback}`,
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

            {/* Font info */}
            <div className="mt-4 p-3 bg-neutral-100 rounded-lg text-sm">
              <div className="font-medium text-neutral-900 mb-2">Current Fonts:</div>
              <div className="space-y-1 text-neutral-600">
                <div>
                  <span className="text-neutral-500">Headings:</span>{" "}
                  {currentTheme.headingFont.family}
                </div>
                <div>
                  <span className="text-neutral-500">Body:</span>{" "}
                  {currentTheme.bodyFont.family}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
