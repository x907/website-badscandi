"use client";

import Image from "next/image";

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  showOnlineIndicator?: boolean;
}

export function UserAvatar({
  name,
  email,
  image,
  size = "md",
  showOnlineIndicator = true,
}: UserAvatarProps) {
  // Get initials from name or email
  const getInitials = () => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "?";
  };

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-10 w-10 text-sm",
  };

  const indicatorSizeClasses = {
    sm: "h-2.5 w-2.5 -bottom-0.5 -right-0.5",
    md: "h-3 w-3 -bottom-0.5 -right-0.5",
    lg: "h-3.5 w-3.5 -bottom-0.5 -right-0.5",
  };

  return (
    <div className="relative">
      {image ? (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-neutral-100`}>
          <Image
            src={image}
            alt={name || "User avatar"}
            fill
            className="object-cover"
            sizes={size === "sm" ? "32px" : size === "md" ? "36px" : "40px"}
          />
        </div>
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-amber-100 flex items-center justify-center font-medium text-amber-900`}
        >
          {getInitials()}
        </div>
      )}

      {/* Online indicator */}
      {showOnlineIndicator && (
        <span
          className={`absolute ${indicatorSizeClasses[size]} bg-green-500 border-2 border-white rounded-full`}
          aria-label="Online"
        />
      )}
    </div>
  );
}

// Helper to get first name
export function getFirstName(name?: string | null, email?: string | null): string {
  if (name) {
    return name.split(" ")[0];
  }
  if (email) {
    return email.split("@")[0];
  }
  return "User";
}
