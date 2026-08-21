import { Header, Screen } from "@/components/ui";
import { DocumentsForm } from "@/components/SettingsForms";

export default function SettingsDocumentsScreen() {
  return (
    <Screen>
      <Header title="Documents" subtitle="Manage your Aadhaar document" back />
      <DocumentsForm />
    </Screen>
  );
}