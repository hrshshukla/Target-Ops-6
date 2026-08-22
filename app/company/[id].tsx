import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createGuardEmployee,
  useCreateEmployee,
  useGetCompany,
  useListEmployees,
} from "@/api-client";
import type { Company, Employee, EmployeeInput } from "@/api-client";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import {
  Avatar,
  EmptyState,
  ErrorState,
  Field,
  formatMoney,
  GhostButton,
  Header,
  LoadingState,
  PrimaryButton,
  Screen,
  SegmentedControl,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/fonts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CompanyScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [tab, setTab] = useState("Company");
  const [showAdd, setShowAdd] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const company = useGetCompany(id);
  const employees = useListEmployees(id, undefined, {
    query: { enabled: tab === "Employees" },
  });
  const filteredEmployees = useMemo(() => {
    const query = employeeSearch.trim().toLowerCase();
    if (!query) return employees.data ?? [];
    return (employees.data ?? []).filter((employee) =>
      [
        employee.name,
        employee.contact,
        String(employee.employeeId),
        employee.site,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [employeeSearch, employees.data]);

  if (company.isLoading)
    return (
      <Screen>
        <Header title="Company" back />
        <LoadingState label="Loading company..." />
      </Screen>
    );
  if (company.isError || !company.data)
    return (
      <Screen>
        <Header title="Company" back />
        <ErrorState
          message="Unable to load company details."
          onRetry={() => void company.refetch()}
        />
      </Screen>
    );
  const item = company.data;

  return (
    <Screen scroll={false}>
      <Header title="Company" subtitle={item.name} back />
      <SegmentedControl
        items={["Company", "Employees"]}
        value={tab}
        onChange={setTab}
      />
      {tab === "Company" ? (
        <CompanyOverview item={item} />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.employeeHeading}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Employees
              </Text>
              <Text
                style={[styles.sectionHint, { color: colors.mutedForeground }]}
              >
                {item.employeeCount} active profiles
              </Text>
            </View>
            {user?.role === "ADMIN" || user?.role === "SUPERVISOR" ? (
              <Pressable
                onPress={() => setShowAdd(true)}
                style={[styles.addButton, { backgroundColor: colors.primary }]}
              >
                <Feather
                  name="plus"
                  size={17}
                  color={colors.primaryForeground}
                />
                <Text
                  style={[styles.addText, { color: colors.primaryForeground }]}
                >
                  Add
                </Text>
              </Pressable>
            ) : null}
          </View>
          {user?.role === "ADMIN" || user?.role === "SUPERVISOR" ? (
            <View
              style={[
                styles.searchBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather name="search" size={17} color={colors.mutedForeground} />
              <TextInput
                value={employeeSearch}
                onChangeText={setEmployeeSearch}
                placeholder="Search by name, phone, employee ID, or site"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground }]}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
            </View>
          ) : null}
          {employees.isLoading ? (
            <LoadingState label="Loading employees..." />
          ) : employees.isError ? (
            <ErrorState
              message="Unable to load employees."
              onRetry={() => void employees.refetch()}
            />
          ) : (
            <FlatList
              data={filteredEmployees}
              keyExtractor={(employee) => employee.id}
              contentContainerStyle={styles.employeeList}
              renderItem={({ item: employee }) => (
                <EmployeeRow
                  employee={employee}
                  onPress={() => router.push(`/employee/${employee.employeeId}`)}
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  title={employeeSearch.trim() ? "No matching employees" : "No employees yet"}
                  message={
                    employeeSearch.trim()
                      ? "Try a different name, phone, employee ID, or site."
                      : "Add the first employee to this company."
                  }
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
      <AddEmployeeModal
        companyId={id}
        canChooseRole={user?.role === "ADMIN"}
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={() => {
          setShowAdd(false);
          void employees.refetch();
          void company.refetch();
        }}
      />
    </Screen>
  );
}

function CompanyOverview({ item }: { item: Company }) {
  const colors = useColors();
  const { user } = useAuth();
  const financials = item.financials;
  return (
    <FlatList
      data={[]}
      renderItem={null}
      ListHeaderComponent={
        <View>
          <View
            style={[
              styles.identityCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Avatar name={item.name} uri={item.logoUrl} size={66} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.companyTitle, { color: colors.foreground }]}>
                {item.name}
              </Text>
              <Text
                style={[styles.companyMeta, { color: colors.mutedForeground }]}
              >
                {item.employeeCount} total employees
              </Text>
            </View>
          </View>
          <View style={styles.detailsGrid}>
            <Detail label="GST" value={item.gst ?? "—"} />
            <Detail label="Account no." value={item.accountNo ?? "—"} />
            <Detail label="Office number" value={item.officeNumber ?? "—"} />
            <Detail label="Roster status" value="Active" />
          </View>
          {user?.role === "ADMIN" ? (
            <>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.foreground, marginBottom: 11 },
                ]}
              >
                June financial summary
              </Text>
              <View style={styles.financeGrid}>
                {financials
                  ? Object.entries({
                      "Total billing": financials.totalBilling,
                      "Total receiving": financials.totalReceiving,
                      "Cash received": financials.cashReceived,
                      Salary: financials.salary,
                      Balance: financials.balance,
                      Expense: financials.expense,
                      "Dress stock": financials.dressStock,
                      Profit: financials.profit,
                    }).map(([label, value]) => (
                      <View
                        key={label}
                        style={[
                          styles.financeCard,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.financeLabel,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {label}
                        </Text>
                        <Text
                          style={[
                            styles.financeValue,
                            {
                              color:
                                label === "Profit"
                                  ? colors.primary
                                  : colors.foreground,
                            },
                          ]}
                        >
                          {formatMoney(value)}
                        </Text>
                      </View>
                    ))
                  : null}
              </View>
            </>
          ) : null}
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.detail, { backgroundColor: colors.secondary }]}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={[styles.detailValue, { color: colors.foreground }]}
      >
        {value}
      </Text>
    </View>
  );
}

function EmployeeRow({
  employee,
  onPress,
}: {
  employee: Employee;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.employeeRow,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <Avatar name={employee.name} uri={employee.profilePictureUrl} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.employeeName, { color: colors.foreground }]}>
          {employee.name}
        </Text>
        <Text style={[styles.employeeMeta, { color: colors.mutedForeground }]}>
          EMP-ID: {employee.employeeId} · {employee.site}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.rolePill, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.roleText, { color: colors.primary }]}>
            {employee.role === "Security Guard" ? "Guard" : "Supervisor"}
          </Text>
        </View>
        <Feather
          name="chevron-right"
          size={17}
          color={colors.mutedForeground}
        />
      </View>
    </Pressable>
  );
}

function AddEmployeeModal({
  companyId,
  canChooseRole,
  visible,
  onClose,
  onCreated,
}: {
  companyId: string;
  canChooseRole: boolean;
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const mutation = useCreateEmployee();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [site, setSite] = useState("");
  const [basic, setBasic] = useState("24000");
  const [role, setRole] = useState<"Security Guard" | "Supervisor">(
    "Security Guard",
  );
  const submit = () => {
    if (!name.trim() || !contact.trim() || (role === "Supervisor" && !site.trim()))
      return Alert.alert(
        "Missing details",
        role === "Security Guard"
          ? "Add a name and phone number."
          : "Add a name, contact, and site.",
      );
    if (role === "Security Guard") {
      if (!/^\d{10}$/.test(contact) || !age || Number(age) < 18 || password.length < 8) {
        return Alert.alert(
          "Missing details",
          "Security Guards need a 10-digit phone number, age 18 or above, and a password of at least 8 characters.",
        );
      }
      createGuardEmployee(companyId, {
        name: name.trim(),
        phoneNumber: contact,
        email: email.trim(),
        age: Number(age),
        password,
        site: site.trim(),
        basicSalary: Number(basic),
      }).then(onCreated).catch((error) => {
        Alert.alert(
          "Could not add employee",
          error instanceof Error ? error.message : "The account was not saved. Try again.",
        );
      });
      return;
    }
    const data: EmployeeInput = {
      name,
      contact,
      site,
      role,
      salary: Number(basic),
      basicSalary: Number(basic),
      allowances: 1500,
      overtime: 0,
      pf: 1800,
      esic: 450,
      dateOfJoining: new Date().toISOString().slice(0, 10),
    };
    mutation.mutate(
      { companyId, data },
      {
        onSuccess: onCreated,
        onError: () =>
          Alert.alert(
            "Could not add employee",
            "The employee was not saved. Try again.",
          ),
      },
    );
  };
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAwareScrollViewCompat
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.modalContent,
          {
            paddingTop: insets.top + 28,
            paddingBottom: insets.bottom + 34,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={30}
      >
        <View style={styles.modalHeader}>
          <View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Add employee
            </Text>
            <Text
              style={[styles.sectionHint, { color: colors.mutedForeground }]}
            >
              A unique numeric Employee ID will be generated.
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>
        <Field
          label="Full name"
          value={name}
          onChangeText={setName}
          placeholder="Employee name"
        />
        <Field
          label="Contact"
          value={contact}
          onChangeText={setContact}
          keyboardType="phone-pad"
          placeholder="Phone number"
        />
        {role === "Security Guard" ? (
          <>
            <Field
              label="Email (optional)"
              value={email}
              onChangeText={setEmail}
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
              label="Password *"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="At least 8 characters"
            />
          </>
        ) : null}
        <Field
          label="Site"
          value={site}
          onChangeText={setSite}
          placeholder="Assigned site"
        />
        <Field
          label="Basic salary"
          value={basic}
          onChangeText={setBasic}
          keyboardType="numeric"
          placeholder="24000"
        />
        {canChooseRole ? (
          <>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              ROLE
            </Text>
            <View style={styles.roleOptions}>
              <Pressable
                onPress={() => setRole("Security Guard")}
                style={[
                  styles.roleOption,
                  {
                    borderColor:
                      role === "Security Guard" ? colors.primary : colors.border,
                    backgroundColor:
                      role === "Security Guard" ? colors.secondary : colors.card,
                  },
                ]}
              >
                <Text style={[styles.roleOptionText, { color: colors.foreground }]}>
                  Security Guard
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setRole("Supervisor")}
                style={[
                  styles.roleOption,
                  {
                    borderColor:
                      role === "Supervisor" ? colors.primary : colors.border,
                    backgroundColor:
                      role === "Supervisor" ? colors.secondary : colors.card,
                  },
                ]}
              >
                <Text style={[styles.roleOptionText, { color: colors.foreground }]}>
                  Supervisor
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}
        <PrimaryButton
          label={mutation.isPending ? "Saving..." : "Save employee"}
          icon="check"
          disabled={mutation.isPending}
          onPress={submit}
        />
        <GhostButton label="Cancel" onPress={onClose} />
      </KeyboardAwareScrollViewCompat>
    </Modal>
  );
}

const styles = StyleSheet.create({
  employeeHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },
  sectionTitle: { ...fonts.bold, fontSize: 18 },
  sectionHint: { ...fonts.regular, fontSize: 12, marginTop: 4 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  addText: { ...fonts.bold, fontSize: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    ...fonts.regular,
    fontSize: 13,
  },
  employeeList: { gap: 10, paddingBottom: 24 },
  employeeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 18,
  },
  employeeName: { ...fonts.bold, fontSize: 14 },
  employeeMeta: { ...fonts.regular, fontSize: 12, marginTop: 4 },
  rowRight: { alignItems: "flex-end", gap: 8 },
  rolePill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  roleText: { ...fonts.bold, fontSize: 10 },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  companyTitle: { ...fonts.bold, fontSize: 17, lineHeight: 22 },
  companyMeta: { ...fonts.regular, fontSize: 12, marginTop: 4 },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 23,
  },
  detail: { width: "48%", borderRadius: 14, padding: 12 },
  detailLabel: {
    ...fonts.semibold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: { ...fonts.semibold, fontSize: 13, marginTop: 6 },
  financeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  financeCard: { width: "48%", borderWidth: 1, borderRadius: 16, padding: 13 },
  financeLabel: { ...fonts.medium, fontSize: 11 },
  financeValue: { ...fonts.bold, fontSize: 16, marginTop: 7 },
  modalContent: { padding: 20, paddingTop: 28, paddingBottom: 34 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  modalTitle: { ...fonts.bold, fontSize: 24 },
  fieldLabel: {
    ...fonts.semibold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  roleOptions: { flexDirection: "row", gap: 9, marginBottom: 20 },
  roleOption: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  roleOptionText: { ...fonts.semibold, fontSize: 12 },
});
