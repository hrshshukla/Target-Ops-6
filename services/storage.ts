import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "target-ops.session-token";

function getWebStorage() {
  return typeof localStorage === "undefined" ? null : localStorage;
}

export const getToken = () => {
  if (Platform.OS === "web") {
    return Promise.resolve(getWebStorage()?.getItem(TOKEN_KEY) ?? null);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const saveToken = (token: string) => {
  if (Platform.OS === "web") {
    getWebStorage()?.setItem(TOKEN_KEY, token);
    return Promise.resolve();
  }
  return SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const clearToken = () => {
  if (Platform.OS === "web") {
    getWebStorage()?.removeItem(TOKEN_KEY);
    return Promise.resolve();
  }
  return SecureStore.deleteItemAsync(TOKEN_KEY);
};