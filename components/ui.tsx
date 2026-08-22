import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/fonts";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

export function Screen({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  if (scroll) {
    return (
      <KeyboardAwareScrollViewCompat
        style={[styles.screen, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: 18, paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </KeyboardAwareScrollViewCompat>
    );
  }
  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingBottom: insets.bottom },
      ]}
    >
      {children}
    </View>
  );
}

export function Header({
  title,
  subtitle,
  back = false,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: ReactNode;
}) {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + (back ? 12 : 4) },
      ]}
    >
      <View style={styles.headerLeft}>
        {back ? (
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
            hitSlop={12}
            style={styles.iconButton}
          >
            <Feather name="arrow-left" size={21} color={colors.foreground} />
          </Pressable>
        ) : (
          <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
            <Feather name="shield" size={17} color={colors.primaryForeground} />
          </View>
        )}
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.headerSubtitle, { color: colors.mutedForeground }]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {action}
    </View>
  );
}

export function SegmentedControl({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.segmented,
        { backgroundColor: colors.muted, borderColor: colors.border },
      ]}
    >
      {items.map((item) => (
        <Pressable
          key={item}
          onPress={() => onChange(item)}
          style={[
            styles.segment,
            value === item && { backgroundColor: colors.primary },
          ]}
          testID={`segment-${item}`}
        >
          <Text
            style={[
              styles.segmentText,
              {
                color:
                  value === item
                    ? colors.primaryForeground
                    : colors.mutedForeground,
              },
            ]}
          >
            {item}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  disabled?: boolean;
  loading?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: colors.primary,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
        },
      ]}
      testID={`button-${label}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primaryForeground} />
      ) : icon ? (
        <Feather name={icon} size={17} color={colors.primaryForeground} />
      ) : null}
      <Text
        style={[styles.primaryButtonText, { color: colors.primaryForeground }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  icon,
  tone = "normal",
  filled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  tone?: "normal" | "danger";
  filled?: boolean;
}) {
  const colors = useColors();

  const color =
    tone === "danger" ? colors.destructive : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ghostButton,
        {
          borderColor: color,
          backgroundColor:
            tone === "danger"
              ? "rgba(220, 38, 38, 0.20)"
              : filled
                ? color
                : "transparent",
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      testID={`button-${label}`}
    >
      {icon ? (
        <Feather
          name={icon}
          size={16}
          color={color}
        />
      ) : null}

      <Text
        style={[
          styles.ghostButtonText,
          {
            color,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  secureTextEntry = false,
  prefix,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "phone-pad";
  secureTextEntry?: boolean;
  prefix?: string;
}) {
  const colors = useColors();
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <View
        style={[
          styles.fieldContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {prefix ? (
          <View style={[styles.fieldPrefix, { borderRightColor: colors.border }]}>
            <Text style={[styles.fieldPrefixText, { color: colors.mutedForeground }]}>{prefix}</Text>
          </View>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          style={[styles.field, { color: colors.foreground }]}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setPasswordVisible((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={
              isPasswordVisible ? "Hide password" : "Show password"
            }
            hitSlop={8}
            style={styles.passwordVisibilityButton}
          >
            <Feather
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={19}
              color={colors.mutedForeground}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function LoadingState({
  label = "Loading workspace...",
}: {
  label?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.state}>
      <Ionicons
        name="cloud-offline-outline"
        size={28}
        color={colors.destructive}
      />
      <Text style={[styles.stateText, { color: colors.foreground }]}>
        {message}
      </Text>
      <GhostButton label="Retry" icon="refresh-cw" onPress={onRetry} />
    </View>
  );
}

export function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.empty}>
      <Feather name="inbox" size={27} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
        {message}
      </Text>
    </View>
  );
}

export function Avatar({
  name,
  uri,
  size = 48,
}: {
  name: string;
  uri?: string | null;
  size?: number;
}) {
  const colors = useColors();
  if (uri)
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.secondary,
        },
      ]}
    >
      <Text style={[styles.avatarText, { color: colors.primary }]}>
        {name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")}
      </Text>
    </View>
  );
}

export const formatMoney = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`;

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { ...fonts.bold, fontSize: 23, letterSpacing: -0.5 },
  headerSubtitle: { ...fonts.medium, fontSize: 12, marginTop: 2 },
  segmented: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 12,
  },
  segmentText: { ...fonts.semibold, fontSize: 12 },
  primaryButton: {
    minHeight: 48,
    borderRadius: 15,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: { ...fonts.bold, fontSize: 14 },
  ghostButton: {
    minHeight: 52,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  ghostButtonText: { ...fonts.semibold, fontSize: 13 },
  fieldWrap: { gap: 7, marginBottom: 14 },
  fieldLabel: {
    ...fonts.semibold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  fieldContainer: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  field: {
    ...fonts.medium,
    flex: 1,
    height: "100%",
    paddingHorizontal: 15,
    fontSize: 15,
  },
  fieldPrefix: {
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 15,
    borderRightWidth: 1,
  },
  fieldPrefixText: { ...fonts.medium, fontSize: 15 },
  passwordVisibilityButton: {
    width: 50,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  state: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 70,
  },
  stateText: { ...fonts.medium, fontSize: 14, textAlign: "center" },
  empty: { alignItems: "center", paddingVertical: 65, gap: 9 },
  emptyTitle: { ...fonts.bold, fontSize: 16 },
  emptyText: {
    ...fonts.regular,
    fontSize: 13,
    textAlign: "center",
    maxWidth: 270,
  },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { ...fonts.bold, fontSize: 14 },
});
