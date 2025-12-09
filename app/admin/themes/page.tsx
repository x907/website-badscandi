import { db } from "@/lib/db";
import { AdminThemesClient } from "@/components/admin-themes-client";
import { ThemeSettings, defaultThemeSettings, ThemeId, BorderRadiusStyle, ButtonStyle } from "@/lib/themes";

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
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
          Theme Settings
        </h1>
        <p className="text-neutral-600 mt-2">
          Customize the look and feel of your website. Preview themes before applying them.
        </p>
      </div>

      <AdminThemesClient initialSettings={settings} />
    </div>
  );
}
