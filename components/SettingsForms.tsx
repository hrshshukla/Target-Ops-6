import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { getDocuments, saveAadhaar, updatePassword, updateProfile, uploadImageToImageKit, type UserDocument } from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { Field, PrimaryButton } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/fonts";

export function ProfileForm() {
  const colors = useColors();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [mobileNumber, setMobileNumber] = useState(normalizeMobileNumber(user?.mobileNumber ?? ""));
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePictureUrl ?? "");
  const [saving, setSaving] = useState(false);

  const chooseImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      setSaving(true);
      const url = await uploadImageToImageKit(asset.uri, `profile-${Date.now()}.jpg`, asset.mimeType ?? "image/jpeg");
      setProfilePictureUrl(url);
      Alert.alert("Uploaded", "Save your profile to apply the new picture.");
    } catch (error) {
      Alert.alert("Upload failed", error instanceof Error ? error.message : "Unable to upload image.");
    } finally { setSaving(false); }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const next = await updateProfile({ name, email, mobileNumber: mobileNumber || null, profilePictureUrl: profilePictureUrl || null });
      updateUser(next);
      Alert.alert("Saved", "Your profile was updated.");
    } catch (error) {
      Alert.alert("Unable to save", error instanceof Error ? error.message : "Please try again.");
    } finally { setSaving(false); }
  };

  return (
    <>
      <View style={styles.profileRow}>
        {profilePictureUrl ? <Image source={{ uri: profilePictureUrl }} style={styles.avatar} /> : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.secondary }]}><Feather name="user" size={28} color={colors.primary} /></View>
        )}
        <PrimaryButton label="Choose profile picture" onPress={() => void chooseImage()} disabled={saving} />
      </View>
      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="Email" value={email} onChangeText={setEmail} />
      <Field
        label="Mobile number"
        value={mobileNumber}
        onChangeText={(value) => setMobileNumber(value.replace(/\D/g, "").slice(0, 10))}
        keyboardType="phone-pad"
        prefix="+91"
      />
      <PrimaryButton label="Save profile" onPress={() => void saveProfile()} disabled={saving} />
    </>
  );
}

function normalizeMobileNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("91") && digits.length > 10 ? digits.slice(2, 12) : digits.slice(0, 10);
}

export function DocumentsForm() {
  const colors = useColors();
  const [document, setDocument] = useState<UserDocument | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    getDocuments()
      .then((items) => setDocument((current) => current ?? items[0] ?? null))
      .catch(() => undefined);
  }, []);

  const chooseImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    setPreviewUri(result.assets[0].uri);
  };

  const saveDocument = async () => {
    if (!previewUri) return;
    try {
      setSaving(true);
      const url = await uploadImageToImageKit(previewUri, `aadhaar-${Date.now()}.jpg`, "image/jpeg");
      setDocument(await saveAadhaar(url));
      setPreviewUri(null);
      Alert.alert("Saved", "Your Aadhaar image was saved.");
    } catch (error) {
      Alert.alert("Upload failed", error instanceof Error ? error.message : "Unable to upload image.");
    } finally { setSaving(false); }
  };

  return (
    <>
      <Text style={[styles.help, { color: colors.mutedForeground }]}>Upload your Aadhaar Card photo only. PDF files are not accepted.</Text>
      {previewUri || document ? (
        <Image source={{ uri: previewUri ?? document?.imageUrl }} style={styles.document} />
      ) : null}
      {!document && !previewUri ? (
        <PrimaryButton
          label="Upload Aadhaar photo"
          icon="upload"
          onPress={() => void chooseImage()}
          disabled={saving}
        />
      ) : null}
      {!document && previewUri ? (
        <PrimaryButton
          label={saving ? "Saving Aadhaar photo..." : "Save Aadhaar photo"}
          icon="check"
          onPress={() => void saveDocument()}
          disabled={saving}
          loading={saving}
        />
      ) : null}
    </>
  );
}

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const changePassword = async () => {
    if (newPassword !== confirmPassword) { Alert.alert("Unable to update", "New passwords do not match."); return; }
    try {
      setSaving(true);
      await updatePassword({ currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      Alert.alert("Updated", "Your password has been changed.");
    } catch (error) {
      Alert.alert("Unable to update", error instanceof Error ? error.message : "Please try again.");
    } finally { setSaving(false); }
  };
  return (
    <>
      <Field label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
      <Field label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
      <Field label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
      <PrimaryButton label="Update password" onPress={() => void changePassword()} disabled={saving || !currentPassword || !newPassword || !confirmPassword} />
    </>
  );
}

const styles = StyleSheet.create({
  profileRow: { alignItems: "center", gap: 14, marginBottom: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  document: { width: "100%", height: 190, borderRadius: 18, marginVertical: 12 },
  help: { ...fonts.regular, fontSize: 12, lineHeight: 18, marginBottom: 15 },
});