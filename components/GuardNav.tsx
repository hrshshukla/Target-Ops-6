import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/fonts";

const ITEMS = [
  { label: "Home", icon: "home" as const, path: "/home" },
  { label: "Attendance", icon: "calendar" as const, path: "/guard-attendance" },
  { label: "Salary", icon: "credit-card" as const, path: "/guard-salary" },
];

export function GuardNav() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const currentIndex = ITEMS.findIndex((item) => item.path === pathname);

  return (
    <View style={{ paddingBottom: insets.bottom }}>
      <View style={[styles.bar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {ITEMS.map((item) => {
          const active = pathname === item.path;
          return (
            <Pressable
              key={item.path}
              onPress={() => {
                const destinationIndex = ITEMS.findIndex(
                  (candidate) => candidate.path === item.path,
                );
                if (destinationIndex === currentIndex) return;
                if (destinationIndex < currentIndex) {
                  router.back();
                } else {
                  router.push(item.path as never);
                }
              }}
              style={[
                styles.item,
                active && { backgroundColor: colors.primary },
              ]}
            >
              <Feather
                name={item.icon}
                size={17}
                color={active ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.label,
                  { color: active ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 18,
    padding: 4,
    marginTop: 12,
    marginBottom: 4,
  },
  item: {
    flex: 1,
    minHeight: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  label: { ...fonts.semibold, fontSize: 10 },
});