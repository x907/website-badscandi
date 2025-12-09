import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth-utils";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  themes,
  ThemeId,
  BorderRadiusStyle,
  ButtonStyle,
  HeadingStyle,
  AccentColor,
  FontScale,
  DarkMode,
  defaultThemeSettings,
  accentColorOptions,
  fontScaleOptions,
  headingStyleOptions,
  darkModeOptions,
} from "@/lib/themes";

// Valid options for validation
const validThemeIds = Object.keys(themes) as ThemeId[];
const validBorderRadius: BorderRadiusStyle[] = ["default", "sharp", "rounded", "pill"];
const validButtonStyles: ButtonStyle[] = ["default", "outline", "soft"];
const validHeadingStyles: HeadingStyle[] = ["normal", "uppercase", "small-caps"];
const validAccentColors: AccentColor[] = ["amber", "rose", "teal", "slate", "forest", "indigo"];
const validFontScales: FontScale[] = ["compact", "default", "spacious"];
const validDarkModes: DarkMode[] = ["system", "light", "dark"];

// GET - Retrieve current theme settings
export async function GET() {
  try {
    // Get or create settings
    let settings = await db.siteSettings.findUnique({
      where: { id: "settings" },
    });

    if (!settings) {
      // Create default settings
      settings = await db.siteSettings.create({
        data: {
          id: "settings",
          themeId: defaultThemeSettings.themeId,
          borderRadius: defaultThemeSettings.borderRadius,
          buttonStyle: defaultThemeSettings.buttonStyle,
          headingStyle: defaultThemeSettings.headingStyle,
          accentColor: defaultThemeSettings.accentColor,
          fontScale: defaultThemeSettings.fontScale,
          darkMode: defaultThemeSettings.darkMode,
        },
      });
    }

    return NextResponse.json({
      settings: {
        themeId: settings.themeId as ThemeId,
        borderRadius: settings.borderRadius as BorderRadiusStyle,
        buttonStyle: settings.buttonStyle as ButtonStyle,
        headingStyle: (settings.headingStyle || "normal") as HeadingStyle,
        accentColor: (settings.accentColor || "amber") as AccentColor,
        fontScale: (settings.fontScale || "default") as FontScale,
        darkMode: ((settings as Record<string, unknown>).darkMode || "system") as DarkMode,
      },
      themes: Object.values(themes).map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        readabilityScore: t.readabilityScore,
        recommendedAccent: t.recommendedAccent,
        recommendedHeadingStyle: t.recommendedHeadingStyle,
      })),
      options: {
        accentColors: accentColorOptions,
        fontScales: fontScaleOptions,
        headingStyles: headingStyleOptions,
        darkModes: darkModeOptions,
      },
    });
  } catch (error) {
    console.error("Error fetching theme settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch theme settings" },
      { status: 500 }
    );
  }
}

// POST - Update theme settings (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { themeId, borderRadius, buttonStyle, headingStyle, accentColor, fontScale, darkMode } = body;

    // Validate inputs
    if (themeId && !validThemeIds.includes(themeId)) {
      return NextResponse.json(
        { error: `Invalid theme ID. Valid options: ${validThemeIds.join(", ")}` },
        { status: 400 }
      );
    }

    if (borderRadius && !validBorderRadius.includes(borderRadius)) {
      return NextResponse.json(
        { error: `Invalid border radius. Valid options: ${validBorderRadius.join(", ")}` },
        { status: 400 }
      );
    }

    if (buttonStyle && !validButtonStyles.includes(buttonStyle)) {
      return NextResponse.json(
        { error: `Invalid button style. Valid options: ${validButtonStyles.join(", ")}` },
        { status: 400 }
      );
    }

    if (headingStyle && !validHeadingStyles.includes(headingStyle)) {
      return NextResponse.json(
        { error: `Invalid heading style. Valid options: ${validHeadingStyles.join(", ")}` },
        { status: 400 }
      );
    }

    if (accentColor && !validAccentColors.includes(accentColor)) {
      return NextResponse.json(
        { error: `Invalid accent color. Valid options: ${validAccentColors.join(", ")}` },
        { status: 400 }
      );
    }

    if (fontScale && !validFontScales.includes(fontScale)) {
      return NextResponse.json(
        { error: `Invalid font scale. Valid options: ${validFontScales.join(", ")}` },
        { status: 400 }
      );
    }

    if (darkMode && !validDarkModes.includes(darkMode)) {
      return NextResponse.json(
        { error: `Invalid dark mode. Valid options: ${validDarkModes.join(", ")}` },
        { status: 400 }
      );
    }

    // Get current user for audit
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id || "unknown";

    // Build update data
    const updateData: {
      themeId?: string;
      borderRadius?: string;
      buttonStyle?: string;
      headingStyle?: string;
      accentColor?: string;
      fontScale?: string;
      darkMode?: string;
      updatedBy: string;
    } = {
      updatedBy: userId,
    };

    if (themeId) updateData.themeId = themeId;
    if (borderRadius) updateData.borderRadius = borderRadius;
    if (buttonStyle) updateData.buttonStyle = buttonStyle;
    if (headingStyle) updateData.headingStyle = headingStyle;
    if (accentColor) updateData.accentColor = accentColor;
    if (fontScale) updateData.fontScale = fontScale;
    if (darkMode) updateData.darkMode = darkMode;

    // Upsert settings
    const settings = await db.siteSettings.upsert({
      where: { id: "settings" },
      update: updateData,
      create: {
        id: "settings",
        themeId: themeId || defaultThemeSettings.themeId,
        borderRadius: borderRadius || defaultThemeSettings.borderRadius,
        buttonStyle: buttonStyle || defaultThemeSettings.buttonStyle,
        headingStyle: headingStyle || defaultThemeSettings.headingStyle,
        accentColor: accentColor || defaultThemeSettings.accentColor,
        fontScale: fontScale || defaultThemeSettings.fontScale,
        darkMode: darkMode || defaultThemeSettings.darkMode,
        updatedBy: userId,
      },
    });

    // Log the change to audit log
    await db.auditLog.create({
      data: {
        userId,
        userEmail: session?.user?.email || "unknown",
        action: "update",
        entityType: "theme",
        entityId: "settings",
        changes: {
          themeId: themeId || undefined,
          borderRadius: borderRadius || undefined,
          buttonStyle: buttonStyle || undefined,
          headingStyle: headingStyle || undefined,
          accentColor: accentColor || undefined,
          fontScale: fontScale || undefined,
          darkMode: darkMode || undefined,
        },
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        themeId: settings.themeId as ThemeId,
        borderRadius: settings.borderRadius as BorderRadiusStyle,
        buttonStyle: settings.buttonStyle as ButtonStyle,
        headingStyle: (settings.headingStyle || "normal") as HeadingStyle,
        accentColor: (settings.accentColor || "amber") as AccentColor,
        fontScale: (settings.fontScale || "default") as FontScale,
        darkMode: ((settings as Record<string, unknown>).darkMode || "system") as DarkMode,
      },
    });
  } catch (error) {
    console.error("Error updating theme settings:", error);
    return NextResponse.json(
      { error: "Failed to update theme settings" },
      { status: 500 }
    );
  }
}
