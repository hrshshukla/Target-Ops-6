import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { registerGuard } from "@/api-client";
import { Field, Header, PrimaryButton, Screen } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/fonts";

const COMPANY_CODES = [
  ["ISF", "INDUSTRIAL SECURITY FORCE"],
  ["TIS", "TARGET INDUSTRIAL SECURITY"],
  ["TSSM", "TARGET SECURITY SERVICE&MANPOWER"],
  ["TISF", "TARGET INDUSTRIAL SECURITY FORCE Pvt Ltd"],
  ["KE", "KARNIKA ENTERPRISES"],
] as const;

export default function CreateAccountScreen() {
  const colors = useColors();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const code = companyCode.trim().toUpperCase();
    if (
      !name.trim() ||
      !/^\d{10}$/.test(phoneNumber) ||
      !code ||
      !age ||
      Number(age) < 18 ||
      password.length < 8
    ) {
      Alert.alert(
        "Incomplete details",
        "Enter all required fields. Password must be at least 8 characters.",
      );
      return;
    }
    if (!COMPANY_CODES.some(([value]) => value === code)) {
      Alert.alert("Invalid Company Code", "Use ISF, TIS, TSSM, TISF, or KE.");
      return;
    }
    try {
      setSubmitting(true);
      await registerGuard({
        name: name.trim(),
        phoneNumber,
        email: email.trim(),
        age: age ? Number(age) : undefined,
        companyCode: code,
        password,
      });
      Alert.alert(
        "Account created",
        "Your Security Guard account is ready. Sign in with your phone number.",
        [{ text: "Sign in", onPress: () => router.replace("/") }],
      );
    } catch (error) {
      Alert.alert(
        "Unable to create account",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Header
        title="Create New Account"
        subtitle="Security Guard account"
        back
      />
      <View style={styles.form}>
        <Field
          label="Name *"
          value={name}
          onChangeText={setName}
          placeholder="Full name"
        />
        <Field
          label="Phone Number *"
          value={phoneNumber}
          onChangeText={(value) =>
            setPhoneNumber(value.replace(/\D/g, "").slice(0, 10))
          }
          keyboardType="phone-pad"
          placeholder="10-digit phone number"
        />
        <Field
          label="Email (optional)"
          value={email}
          onChangeText={setEmail}
          keyboardType="default"
          placeholder="name@company.com"
        />
        <Field
          label="Age *"
          value={age}
          onChangeText={(value) => setAge(value.replace(/\D/g, "").slice(0, 3))}
          keyboardType="numeric"
          placeholder="18 or above"
        />
        <Field
          label="Company Code *"
          value={companyCode}
          onChangeText={setCompanyCode}
          placeholder="ISF, TIS, TSSM, TISF, or KE"
        />
        <Field
          label="Password *"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 8 characters"
        />
        <PrimaryButton
          label={
            submitting ? "Creating account..." : "Create account"
          }
          icon="user-plus"
          onPress={() => void submit()}
          disabled={submitting}
          loading={submitting}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 18,
  },
  form: { gap: 2 },
  codes: {
    ...fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    marginTop: -2,
    marginBottom: 10,
  },
});
