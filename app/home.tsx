import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useListCompanies, useGetAccountSheet, useGuardMe } from "@/api-client";
import type { AccountSheet, Company } from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import {
  Avatar,
  ErrorState,
  formatMoney,
  Header,
  LoadingState,
  PrimaryButton,
  SegmentedControl,
  Screen,
  GhostButton,
} from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/fonts";
import { useModal } from "@/components/CustomModal";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const admin = user?.role === "ADMIN";
  const [section, setSection] = useState(
    admin ? "All Company" : "Assigned Companies",
  );
  const [accountMonth, setAccountMonth] = useState({ year: 2026, month: 6 });
  const companies = useListCompanies({
    query: { enabled: !!user && user.role !== "SECURITY_GUARD" },
  });
  const account = useGetAccountSheet(accountMonth.year, accountMonth.month, {
    query: { enabled: admin && section === "Account Sheet" },
  });
  const data = useMemo<Company[]>(() => {
    const companyItems = Array.isArray(companies.data) ? companies.data : [];
    const companiesById = new Map(companyItems.map((item) => [item.id, item]));
    return COMPANY_CATALOG.map(
      (catalog) =>
        companiesById.get(catalog.id) ?? {
          id: catalog.id,
          name: catalog.name,
          logoUrl: null,
          employeeCount: 0,
        },
    );
  }, [companies.data]);

  if (user?.role === "SECURITY_GUARD") return <GuardHomeScreen />;
  if (companies.isLoading)
    return (
      <Screen>
        <Header title="Target Ops" subtitle="Operations workspace" />
        <LoadingState label="Loading companies..." />
      </Screen>
    );
  if (companies.isError)
    return (
      <Screen>
        <Header title="Target Ops" subtitle="Operations workspace" />
        <ErrorState
          message="Unable to load your companies."
          onRetry={() => void companies.refetch()}
        />
      </Screen>
    );

  return (
    <Screen scroll={false}>
      <Header
        title="Target Ops"
        subtitle={admin ? "Admin workspace" : "Supervisor workspace"}
        action={
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push("/settings")} hitSlop={12}>
              <Feather
                name="settings"
                size={20}
                color={colors.mutedForeground}
              />
            </Pressable>
          </View>
        }
      />
      {admin && (
        <SegmentedControl
          items={["All Company", "Account Sheet"]}
          value={section}
          onChange={setSection}
        />
      )}
      {section === "Account Sheet" && admin ? (
        <AccountSheet
          data={account.data}
          year={accountMonth.year}
          month={accountMonth.month}
          loading={account.isLoading}
          error={account.isError}
          retry={() => void account.refetch()}
          onMonthChange={(offset) =>
            setAccountMonth((current) => shiftMonth(current, offset))
          }
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <CompanyCard
              item={item}
              onPress={() => router.push(`/company/${item.id}`)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

function GuardHomeScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const router = useRouter();
  const guard = useGuardMe();
  return (
    <Screen scroll={false}>
      <Header
        title="Target Ops"
        subtitle="Security Guard workspace"
        action={
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push("/settings")} hitSlop={12}>
              <Feather
                name="settings"
                size={20}
                color={colors.mutedForeground}
              />
            </Pressable>
          </View>
        }
      />
      {guard.isLoading ? (
        <View style={guardStyles.stateContent}>
          <LoadingState label="Loading your profile..." />
        </View>
      ) : guard.isError || !guard.data ? (
        <View style={guardStyles.stateContent}>
          <ErrorState
            message="Unable to load your guard profile."
            onRetry={() => void guard.refetch()}
          />
        </View>
      ) : (
        <View style={guardStyles.content}>
          <View style={[guardStyles.hero, { backgroundColor: colors.primary }]}>
            <Avatar
              name={guard.data.name}
              uri={guard.data.profilePictureUrl}
              size={64}
            />
            <Text
              style={[guardStyles.name, { color: colors.primaryForeground }]}
            >
              {guard.data.name}
            </Text>
            <Text
              style={[guardStyles.meta, { color: colors.primaryForeground }]}
            >
              {guard.data.site} · EMP-ID: {guard.data.employeeId}
            </Text>
          </View>
          <Text style={[guardStyles.heading, { color: colors.foreground }]}>
            Your workspace
          </Text>
          <Text style={[guardStyles.hint, { color: colors.mutedForeground }]}>
            View your attendance and salary details below.
          </Text>
        </View>
      )}
    </Screen>
  );
}

const guardStyles = StyleSheet.create({
  content: { flex: 1, gap: 18 },
  stateContent: { flex: 1, justifyContent: "center" },
  hero: { borderRadius: 22, padding: 20, alignItems: "center", gap: 7 },
  name: { ...fonts.bold, fontSize: 22 },
  meta: { ...fonts.medium, fontSize: 12 },
  heading: { ...fonts.bold, fontSize: 19 },
  hint: { ...fonts.regular, fontSize: 13, lineHeight: 20 },
});

function CompanyCard({
  item,
  onPress,
}: {
  item: Company;
  onPress: () => void;
}) {
  const colors = useColors();
  const { showModal } = useModal();
  const [exporting, setExporting] = useState(false);
  const mark =
    COMPANY_CATALOG.find((company) => company.id === item.id)?.mark ??
    item.name;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.name}`}
      style={({ pressed }) => [
        styles.companyCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <View style={[styles.logoTile, { backgroundColor: colors.secondary }]}>
        <Avatar name={mark} uri={item.logoUrl} size={66} />
      </View>
      <View style={styles.companyInfo}>
        <Text style={[styles.companyName, { color: colors.foreground }]}>
          {item.name}
        </Text>
        <View style={styles.cardFooter}>
          <Text
            style={[styles.employeeCount, { color: colors.mutedForeground }]}
          >
            {item.employeeCount} employees
          </Text>
          <Feather name="arrow-up-right" size={16} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

const COMPANY_CATALOG = [
  { id: "company-isf", name: "INDUSTRIAL SECURITY FORCE", mark: "ISF" },
  { id: "company-tis", name: "TARGET INDUSTRIAL SECURITY", mark: "TIS" },
  {
    id: "company-tssm",
    name: "TARGET SECURITY SERVICE&MANPOWER",
    mark: "TSSM",
  },
  {
    id: "company-tisf",
    name: "TARGET INDUSTRIAL SECURITY FORCE Pvt Ltd",
    mark: "TISF",
  },
  { id: "company-ke", name: "KARNIKA ENTERPRISES", mark: "KE" },
] as const;

function shiftMonth(current: { year: number; month: number }, offset: number) {
  const date = new Date(current.year, current.month - 1 + offset, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function AccountSheet({
  data,
  year,
  month,
  loading,
  error,
  retry,
  onMonthChange,
}: {
  data?: AccountSheet;
  year: number;
  month: number;
  loading: boolean;
  error: boolean;
  retry: () => void;
  onMonthChange: (offset: number) => void;
}) {
  const colors = useColors();
  const { showModal } = useModal();
  const [exporting, setExporting] = useState(false);
  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
  if (loading)
    return <LoadingState label={`Loading ${monthLabel} account sheet...`} />;
  if (error || !data)
    return (
      <ErrorState message="Unable to load the account sheet." onRetry={retry} />
    );
  const columns = [
    ["COMPANY", "companyName", styles.companyCell],
    ["BILLING", "totalBilling", styles.numericCell],
    ["RECEIVING", "totalReceiving", styles.numericCell],
    ["CASH", "cashReceived", styles.numericCell],
    ["SALARY", "salary", styles.numericCell],
    ["BALANCE", "balance", styles.numericCell],
    ["EXP.", "expense", styles.numericCell],
    ["PROFIT", "profit", styles.numericCell],
  ] as const;
  const totals = { companyName: "TOTAL ALL", ...data.totals };
  const visibleRows = data.rows.filter(
    (row) =>
      !["API Audit Company Updated", "API Audit Updated"].includes(
        row.companyName,
      ),
  );
  const reportRows = [...visibleRows, totals];
  const downloadExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const worksheet = XLSX.utils.aoa_to_sheet([
        columns.map(([label]) => label),
        ...reportRows.map((row) =>
          columns.map(([, key]) =>
            key === "companyName" ? row[key] : Number(row[key]),
          ),
        ),
      ]);
      worksheet["!cols"] = [
        { wch: 34 },
        ...columns.slice(1).map(() => ({ wch: 15 })),
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Account Sheet");
      const base64 = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "base64",
      });
      const monthName = new Date(year, month - 1, 1).toLocaleString("en-IN", {
        month: "long",
      });
      const filename = `Account-Sheet-${monthName}-${year}.xlsx`;
      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
        link.download = filename;
        link.click();
      } else {
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (!(await Sharing.isAvailableAsync())) {
          throw new Error("File sharing is not available on this device.");
        }
        await Sharing.shareAsync(fileUri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: filename,
          UTI: "com.microsoft.excel.xlsx",
        });
      }
      showModal({
        type: "success",
        title: "Download complete",
        message: `${filename} was downloaded successfully.`,
      });
    } catch (error) {
      showModal({
        type: "error",
        title: "Download failed",
        message:
          error instanceof Error
            ? error.message
            : "Unable to create the Excel file.",
      });
    } finally {
      setExporting(false);
    }
  };
  return (
    <View style={styles.sheet}>
      <View style={styles.sheetHeading}>
        <View
          style={[
            styles.monthControls,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Pressable
            onPress={() => onMonthChange(-1)}
            hitSlop={10}
            accessibilityLabel="Previous month"
          >
            <Feather name="chevron-left" size={18} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.monthLabel, { color: colors.foreground }]}>
            {monthLabel}
          </Text>
          <Pressable
            onPress={() => onMonthChange(1)}
            hitSlop={10}
            accessibilityLabel="Next month"
          >
            <Feather name="chevron-right" size={18} color={colors.foreground} />
          </Pressable>
        </View>
      </View>
      <View style={[styles.tableWrap, { borderColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tableContent}
        >
          <View style={styles.table}>
            <View
              style={[
                styles.tableRow,
                {
                  backgroundColor: colors.secondary,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              {columns.map(([label, , cellStyle]) => (
                <Text
                  key={label}
                  style={[
                    styles.tableHeader,
                    cellStyle,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {label}
                </Text>
              ))}
            </View>
            {visibleRows.map((row, index) => (
              <TableRow
                key={row.companyId}
                row={row as unknown as Record<string, string | number>}
                columns={columns}
                stripe={index % 2 === 1}
              />
            ))}
            <TableRow row={totals} columns={columns} total />
          </View>
        </ScrollView>
      </View>
      <View style={{ marginVertical: 12 }}>
        <PrimaryButton
          label={exporting ? "Generating Excel..." : "Download Excel"}
          icon="download"
          onPress={() => void downloadExcel()}
          disabled={exporting}
          loading={exporting}
        />
      </View>
    </View>
  );
}

function TableRow({
  row,
  columns,
  total = false,
  stripe = false,
}: {
  row: Record<string, string | number>;
  columns: readonly (readonly [string, string, object])[];
  total?: boolean;
  stripe?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.tableRow,
        {
          backgroundColor: total
            ? colors.secondary
            : stripe
              ? colors.card
              : colors.background,
          borderBottomColor: colors.border,
          borderTopColor: total ? colors.primary : "transparent",
          borderTopWidth: total ? 1 : 0,
        },
      ]}
    >
      {columns.map(([label, key, cellStyle]) => {
        const value = row[key];
        return (
          <Text
            key={label}
            numberOfLines={2}
            style={[
              styles.tableCell,
              cellStyle,
              { color: key === "profit" ? colors.primary : colors.foreground },
              total && styles.totalCell,
            ]}
          >
            {key === "companyName" ? value : formatMoney(Number(value))}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  assignedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 13,
    borderRadius: 15,
    marginBottom: 14,
  },
  assignedText: { ...fonts.semibold, fontSize: 13 },
  list: { gap: 12, paddingBottom: 25 },
  companyCard: {
    minHeight: 108,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logoTile: {
    width: 78,
    height: 78,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  companyInfo: { flex: 1, minWidth: 0 },
  companyName: { ...fonts.bold, fontSize: 14, lineHeight: 19 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  employeeCount: { ...fonts.medium, fontSize: 11 },
  sheetHeading: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  monthBadge: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: { flexGrow: 0, flexShrink: 1 },
  tableWrap: {
    flexGrow: 0,
    flexShrink: 1,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
  },
  tableContent: { minWidth: "100%" },
  table: { minWidth: 1020 },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 58,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
  },
  tableHeader: { ...fonts.bold, fontSize: 10 },
  tableCell: {
    ...fonts.medium,
    fontSize: 12,
    paddingVertical: 11,
    paddingRight: 12,
  },
  companyCell: { width: 230 },
  numericCell: { width: 112, textAlign: "right" },
  totalCell: { ...fonts.bold },
  monthControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  monthLabel: {
    ...fonts.semibold,
    fontSize: 12,
    minWidth: 105,
    textAlign: "center",
  },
});
