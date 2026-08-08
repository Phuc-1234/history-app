export const colors = {
    // -------------------------------------------------------------
    // Core Brand Colors (Vietnamese History Theme)
    // -------------------------------------------------------------
    primary: "#c37938", // Warm copper/terracotta brand accent
    primaryHover: "#a66228",
    primaryContainer: "#FAF0E6", // Soft warm cream for containers

    secondary: "#E5A93B", // Warm imperial gold
    secondaryHover: "#C68F2C",
    secondaryContainer: "#FFF9EE", // Very soft gold highlight

    accent: "#c37938", // Alias for brand accent

    // -------------------------------------------------------------
    // Layout Backgrounds & Surfaces
    // -------------------------------------------------------------
    background: "#FFFDFB", // Warm off-white / light paper background
    surface: "#FFFFFF",
    surfaceVariant: "#F5F6F8", // Neutral light grey
    cardBackground: "#FFFFFF",
    inputBackground: "#F2F3F5", // Neutral grey input fill

    // -------------------------------------------------------------
    // Typography Hierarchy
    // -------------------------------------------------------------
    textPrimary: "#2B1D12", // Warm dark brown for high contrast text
    textSecondary: "#5C4A3C", // Medium brown for secondary text
    textMuted: "#8C7766", // Muted brownish grey
    textPlaceholder: "#BDAB9C", // Faded text for inputs

    // Legacy mapping (to keep existing / Auth screens fully functional)
    textLight: "#FFFFFF",
    textDark: "#2B1D12",

    // -------------------------------------------------------------
    // System & Feedback Colors (Quizzes, Notifications, Statuses)
    // -------------------------------------------------------------
    success: "#16A34A", // Brighter green for correctness & success state
    successContainer: "#EBF5F0",
    textSuccess: "#134B33",

    error: "#C84B31", // Terracotta red for errors/incorrect
    errorContainer: "#FDF2F0",
    textError: "#8B2F1D",

    warning: "#D49B00", // Gold/Amber warning
    warningContainer: "#FFFDF0",
    textWarning: "#8D6600",

    info: "#3E7B99", // Historical indigo/blue
    infoContainer: "#EDF6FA",
    textInfo: "#245269",

    // -------------------------------------------------------------
    // Gamification & Features (Streaks, Rank, Rewards)
    // -------------------------------------------------------------
    gold: "#FFD700",
    silver: "#C0C0C0",
    bronze: "#CD7F32",
    streak: "#c37938",
    orange: "#FF9500",

    // -------------------------------------------------------------
    // Borders, Dividers & Lines
    // -------------------------------------------------------------
    borderLight: "rgba(195, 121, 56, 0.1)",
    borderMedium: "#EADFD5",
    borderDark: "#c37938",
    divider: "#EADFD5",

    // -------------------------------------------------------------
    // Social Authentication Integrations
    // -------------------------------------------------------------
    googleBorder: "#EADFD5",
    facebookBackground: "#1877F2",
    facebookText: "#FFFFFF",

    // -------------------------------------------------------------
    // Payment Branding
    // -------------------------------------------------------------
    zalopay: "#0068FF",
    vietqr: "#E4002B",

    // -------------------------------------------------------------
    // Social Feature Accents (friends / followers / following)
    // -------------------------------------------------------------
    socialFriends: "#3182CE", // Blue — friends stat/tab
    socialFollowers: "#FF6B00", // Orange — followers stat/tab
    socialFollowing: "#10B981", // Green — following stat/tab
    // Tint pastel nhẹ (container) cho các ô thống kê social — nền mềm,
    // không viền, hòa với bảng màu ấm của app.
    socialFriendsContainer: "#EAF2FB", // Blue tint
    socialFollowersContainer: "#FFF0E6", // Orange tint
    socialFollowingContainer: "#E8F7F0", // Green tint

    // -------------------------------------------------------------
    // Match Questions Matching Cells
    // -------------------------------------------------------------
    matchColors: [
        { bg: "#FFF9EE", border: "#E5A93B", text: "#8D6600" }, // Gold
        { bg: "#FDF2F0", border: "#c37938", text: "#8B2F1D" }, // Terracotta
        { bg: "#EBF5F0", border: "#1E6B4B", text: "#134B33" }, // Green
        { bg: "#EDF6FA", border: "#3E7B99", text: "#245269" }, // Blue
        { bg: "#FAF0E6", border: "#8D5A32", text: "#5C3516" }, // Copper
        { bg: "#F4F0FA", border: "#8C6BAF", text: "#4C326B" }, // Purple
    ],

    // -------------------------------------------------------------
    // Color Palette Scale (Neutral, Primary, Error)
    // -------------------------------------------------------------
    neutral50: "#F9FAFB",
    neutral100: "#F3F4F6",
    neutral200: "#E5E7EB",
    neutral300: "#D1D5DB",
    neutral400: "#9CA3AF",
    neutral500: "#6B7280",
    neutral600: "#4B5563",
    neutral700: "#374151",
    neutral800: "#1F2937",
    neutral900: "#111827",

    primary50: "#FFF7ED",
    primary100: "#FFEDD5",
    primary200: "#FED7AA",
    primary500: "#c37938",
    primary600: "#a66228",
    primary700: "#8A4D1D",
    primary800: "#6E3B15",

    error500: "#EF4444",
    error600: "#DC2626",

    // PRO / Premium Styling (Imperial Copper-Gold Gradient)
    proGradient: ["#8C2500", "#E5A93B", "#FFD700"] as const,
};

export default colors;
