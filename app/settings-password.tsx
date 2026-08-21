import { Header, Screen } from "@/components/ui";
import { PasswordForm } from "@/components/SettingsForms";

export default function SettingsPasswordScreen() {
  return (
    <Screen>
      <Header title="Update Password" subtitle="Keep your account secure" back />
      <PasswordForm />
    </Screen>
  );
}