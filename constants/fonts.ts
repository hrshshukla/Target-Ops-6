import { Platform } from "react-native";

const webFamily = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const fonts = {
  regular: Platform.OS === "web"
    ? { fontFamily: webFamily, fontWeight: "400" as const }
    : { fontFamily: "Inter_400Regular" },
  medium: Platform.OS === "web"
    ? { fontFamily: webFamily, fontWeight: "500" as const }
    : { fontFamily: "Inter_500Medium" },
  semibold: Platform.OS === "web"
    ? { fontFamily: webFamily, fontWeight: "600" as const }
    : { fontFamily: "Inter_600SemiBold" },
  bold: Platform.OS === "web"
    ? { fontFamily: webFamily, fontWeight: "700" as const }
    : { fontFamily: "Inter_700Bold" },
};