export const colors = {
    // -------------------------------------------------------------
    // Core Brand Colors (Vietnamese History Theme)
    // -------------------------------------------------------------
    primary: "#6949FF", // Purple primary color
    primaryHover: "#5132E6",
    primaryContainer: "#F0EEFF", // Soft purple/indigo for light-themed containers/alerts

    secondary: "#DF9B00", // Warm imperial gold/bronze (star yellow/imperial crown gold)
    secondaryHover: "#C98B00",
    secondaryContainer: "#FEF8EB", // Very soft gold for highlighting/achievements

    accent: "#DF9B00", // Alias for gold accent

    // -------------------------------------------------------------
    // Layout Backgrounds & Surfaces
    // -------------------------------------------------------------
    background: "#FFFFFF", // Clean white main page background
    surface: "#FFFFFF", // Card and container background
    surfaceVariant: "#F5F6F8", // Off-white / light grey for page sections
    cardBackground: "#FFFFFF", // Alias for card backgrounds
    inputBackground: "#F5F6F8", // Light grey fill for input fields

    // -------------------------------------------------------------
    // Typography Hierarchy
    // -------------------------------------------------------------
    textPrimary: "#1A202C", // High contrast dark color for body & headings
    textSecondary: "#4A5568", // Medium contrast slate for subtitles/details
    textMuted: "#718096", // Muted grey for captions, timestamps, and secondary info
    textPlaceholder: "#A0AEC0", // Faded text for inputs

    // Legacy mapping (to keep existing / Auth screens fully functional)
    textLight: "#FFFFFF", // Contrast text on primary/dark backgrounds
    textDark: "#1A202C", // Contrast text on light/white backgrounds

    // -------------------------------------------------------------
    // System & Feedback Colors (Quizzes, Notifications, Statuses)
    // -------------------------------------------------------------
    success: "#10B981", // Emerald green for correct answers & success states
    successContainer: "#ECFDF5", // Light green background
    textSuccess: "#065F46", // Deep green text for high readability

    error: "#E53E3E", // Red for wrong answers & errors
    errorContainer: "#FEF2F2", // Light red background
    textError: "#991B1B", // Deep red text for high readability

    warning: "#F59E0B", // Amber yellow for warnings, missing answers, actions
    warningContainer: "#FFFBEB", // Light yellow background
    textWarning: "#B45309", // Deep amber text for high readability

    info: "#3182CE", // Blue for info messages & tips
    infoContainer: "#EBF8FF", // Light blue background
    textInfo: "#2B6CB0", // Deep blue text

    // -------------------------------------------------------------
    // Gamification & Features (Streaks, Rank, Rewards)
    // -------------------------------------------------------------
    gold: "#FFD700", // Achievement gold
    silver: "#C0C0C0", // Achievement silver
    bronze: "#CD7F32", // Achievement bronze
    streak: "#FF6B00", // Vibrant orange for hot streaks

    // -------------------------------------------------------------
    // Borders, Dividers & Lines
    // -------------------------------------------------------------
    borderLight: "rgba(0, 0, 0, 0.08)", // Soft border for cards and input boxes on light backgrounds
    borderMedium: "#E2E8F0", // Standard border color
    borderDark: "#a89292ff", // High contrast border color
    divider: "#E2E8F0", // Line separators

    // -------------------------------------------------------------
    // Social Authentication Integrations
    // -------------------------------------------------------------
    googleBorder: "#E2E8F0",
    facebookBackground: "#1877F2",
    facebookText: "#FFFFFF",

    // -------------------------------------------------------------
    // Match Questions Matching Cells
    // -------------------------------------------------------------
    matchColors: [
        { bg: "#EFF6FF", border: "#3B82F6", text: "#1E40AF" }, // Blue
        { bg: "#ECFDF5", border: "#10B981", text: "#065F46" }, // Green
        { bg: "#FFFBEB", border: "#F59E0B", text: "#78350F" }, // Yellow/Amber
        { bg: "#FAF5FF", border: "#A855F7", text: "#5B21B6" }, // Purple
        { bg: "#FEF2F2", border: "#EF4444", text: "#991B1B" }, // Red
        { bg: "#FFF7ED", border: "#F97316", text: "#7C2D12" }, // Orange
    ],
};

export default colors;
