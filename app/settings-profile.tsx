import { Header, Screen } from "@/components/ui";
import { ProfileForm } from "@/components/SettingsForms";

export default function SettingsProfileScreen() {
  return (
    <Screen>
      <Header title="Edit Profile" subtitle="Update your account details" back />
      <ProfileForm />
    </Screen>
  );
}