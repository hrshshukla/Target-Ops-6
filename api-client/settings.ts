import { customFetch } from "./custom-fetch";
import type { User } from "./generated/api.schemas";
import { Platform } from "react-native";

export type ImageKitAuth = {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
};

export type UserDocument = {
  id: string;
  documentType: string;
  imageUrl: string;
  createdAt: string;
};

export const getImageKitAuth = () =>
  customFetch<ImageKitAuth>("/settings/imagekit-auth", { responseType: "json" });

export const updateProfile = (body: {
  name: string;
  email: string;
  mobileNumber?: string | null;
  profilePictureUrl?: string | null;
}) => customFetch<User>("/settings/profile", {
  method: "PATCH",
  body: JSON.stringify(body),
  responseType: "json",
});

export const updatePassword = (body: { currentPassword: string; newPassword: string }) =>
  customFetch<void>("/settings/password", { method: "PATCH", body: JSON.stringify(body) });

export const getDocuments = () =>
  customFetch<UserDocument[]>("/settings/documents", { responseType: "json" });

export const saveAadhaar = (imageUrl: string) =>
  customFetch<UserDocument>("/settings/documents/aadhaar", {
    method: "PUT",
    body: JSON.stringify({ imageUrl }),
    responseType: "json",
  });

export async function uploadImageToImageKit(uri: string, fileName: string, mimeType: string) {
  const auth = await getImageKitAuth();
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    form.append("file", blob, fileName);
  } else {
    form.append("file", { uri, name: fileName, type: mimeType } as unknown as Blob);
  }
  form.append("fileName", fileName);
  form.append("publicKey", auth.publicKey);
  form.append("signature", auth.signature);
  form.append("expire", String(auth.expire));
  form.append("token", auth.token);
  form.append("folder", "/target-ops");
  const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: form,
  });
  if (!response.ok) throw new Error("Image upload failed.");
  const result = await response.json() as { url?: string };
  if (!result.url) throw new Error("Image upload returned no URL.");
  return result.url;
}