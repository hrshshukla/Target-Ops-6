import { Feather } from "@expo/vector-icons";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

type ModalType = "success" | "error" | "warning" | "info" | "confirmation";
type ModalAction = {
  label: string;
  onPress?: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "danger";
};
export type ModalOptions = {
  type?: ModalType;
  title: string;
  message?: string;
  actions?: ModalAction[];
  dismissible?: boolean;
};

type ModalContextValue = {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
};

import { createContext, useContext } from "react";
const ModalContext = createContext<ModalContextValue | null>(null);

export function CustomModalProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ModalOptions | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (!options) return;
    opacity.setValue(0);
    scale.setValue(0.94);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [options, opacity, scale]);

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.94, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setOptions(null);
      setActionLoading(false);
    });
  };

  const handleAction = async (action: ModalAction) => {
    if (actionLoading) return;
    if (!action.onPress) {
      hideModal();
      return;
    }
    setActionLoading(true);
    try {
      await action.onPress();
      hideModal();
    } catch {
      setActionLoading(false);
    }
  };

  const type = options?.type ?? "info";
  const icon =
    type === "success" ? "check-circle" :
    type === "error" ? "x-circle" :
    type === "warning" || type === "confirmation" ? "alert-circle" : "info";
  const iconColor =
    type === "success" ? colors.primary :
    type === "error" ? colors.destructive :
    type === "warning" || type === "confirmation" ? colors.accent : colors.primary;
  const actions = options?.actions ?? [{ label: "OK", variant: "primary" as const }];

  return (
    <ModalContext.Provider value={{ showModal: setOptions, hideModal }}>
      {children}
      <Modal
        visible={Boolean(options)}
        transparent
        animationType="none"
        onRequestClose={() => options?.dismissible !== false && hideModal()}
      >
        <View style={styles.backdrop}>
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                marginTop: insets.top,
                marginBottom: insets.bottom,
                opacity,
                transform: [{ scale }],
              },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
              <Feather name={icon as keyof typeof Feather.glyphMap} size={24} color={iconColor} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>{options?.title}</Text>
            {options?.message ? (
              <Text style={[styles.message, { color: colors.mutedForeground }]}>{options.message}</Text>
            ) : null}
            <View style={styles.actions}>
              {actions.map((action) => (
                <Pressable
                  key={action.label}
                  onPress={() => void handleAction(action)}
                  disabled={actionLoading}
                  style={[
                    styles.action,
                    {
                      backgroundColor:
                        action.variant === "danger" ? colors.destructive :
                        action.variant === "secondary" ? colors.secondary : colors.primary,
                      opacity: actionLoading ? 0.55 : 1,
                    },
                  ]}
                >
                  {actionLoading && action === actions[actions.length - 1] ? (
                    <Text style={[styles.actionText, { color: colors.primaryForeground }]}>...</Text>
                  ) : (
                    <Text
                      style={[
                        styles.actionText,
                        {
                          color: action.variant === "secondary"
                            ? colors.secondaryForeground
                            : action.variant === "danger"
                              ? colors.destructiveForeground
                              : colors.primaryForeground,
                        },
                      ]}
                    >
                      {action.label}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const value = useContext(ModalContext);
  if (!value) throw new Error("useModal must be used within CustomModalProvider");
  return value;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.68)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 390,
    borderWidth: 1,
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: { ...fonts.bold, fontSize: 18, textAlign: "center" },
  message: { ...fonts.regular, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 8 },
  actions: { width: "100%", gap: 9, marginTop: 20 },
  action: { minHeight: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  actionText: { ...fonts.bold, fontSize: 13 },
});