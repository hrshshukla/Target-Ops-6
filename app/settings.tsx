import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { GhostButton, Header, Screen } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/fonts";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const canManageDocuments = user?.role === "SUPERVISOR" || user?.role === "SECURITY_GUARD";

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Screen>
      <Header title="Settings" subtitle="Manage your account" back />
      <View style={styles.list}>
        <SettingsRow icon="user" label="Edit Profile" onPress={() => router.push("/settings-profile")} />
        {canManageDocuments ? (
          <SettingsRow icon="file-text" label="Documents" onPress={() => router.push("/settings-documents")} />
        ) : null}
        <SettingsRow icon="lock" label="Update Password" onPress={() => router.push("/settings-password")} />
      </View>
      <GhostButton
        label={signingOut ? "Logging out..." : "Logout"}
        icon="log-out"
        tone="danger"
        filled
        disabled={signingOut}
        loading={signingOut}
        onPress={() => void handleSignOut()}
      />
    </Screen>
  );
}

function SettingsRow({ icon, label, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={19} color={colors.primary} />
      </View>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12, marginTop: 8, marginBottom: 24 },
  row: {
    minHeight: 68,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  label: { ...fonts.semibold, fontSize: 15, flex: 1 },
});