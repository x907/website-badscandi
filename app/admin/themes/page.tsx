import { db } from "@/lib/db";
import { AdminThemesClient } from "@/components/admin-themes-client";
import {
  ThemeSettings,
  defaultThemeSettings,
  ThemeId,
  BorderRadiusStyle,
  ButtonStyle,
  HeadingStyle,
  AccentColor,
  FontScale,
  DarkMode,
} from "@/lib/themes";

async function getThemeSettings(): Promise<ThemeSettings> {
  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: "settings" },
    });

    if (!settings) {
      return defaultThemeSettings;
    }

    return {
      themeId: settings.themeId as ThemeId,
      borderRadius: settings.borderRadius as BorderRadiusStyle,
      buttonStyle: settings.buttonStyle as ButtonStyle,
      headingStyle: (settings.headingStyle || "normal") as HeadingStyle,
      accentColor: (settings.accentColor || "amber") as AccentColor,
      fontScale: (settings.fontScale || "default") as FontScale,
      darkMode: ((settings as Record<string, unknown>).darkMode || "system") as DarkMode,
    };
  } catch {
    return defaultThemeSettings;
  }
}

export default async function AdminThemesPage() {
  const settings = await getThemeSettings();

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Theme Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Customize fonts, colors, and styles. Preview changes before applying them site-wide.
        </p>
      </div>

      <AdminThemesClient initialSettings={settings} />
    </div>
  );
}
