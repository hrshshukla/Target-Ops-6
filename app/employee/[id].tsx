import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  useDeleteEmployee,
  useGetAttendance,
  useGetEmployee,
  useGetSalary,
  useUpdateAttendance,
  useUpdateEmployee,
  useUpdateSalary,
} from "@/api-client";
import type { Employee, EmployeeInput } from "@/api-client";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import {
  Avatar,
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
import { useModal } from "@/components/CustomModal";

export default function EmployeeScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [tab, setTab] = useState("Details");
  const employee = useGetEmployee(id);
  if (employee.isLoading)
    return (
      <Screen>
        <Header title="Employee" back />
        <LoadingState label="Loading employee..." />
      </Screen>
    );
  if (employee.isError || !employee.data)
    return (
      <Screen>
        <Header title="Employee" back />
        <ErrorState
          message="Unable to load employee details."
          onRetry={() => void employee.refetch()}
        />
      </Screen>
    );
  return (
    <Screen scroll={false}>
      <Header title="Employee" subtitle={`EMP-ID: ${employee.data.employeeId}`} back />
      <SegmentedControl
        items={["Details", "Attendance", "Salary"]}
        value={tab}
        onChange={setTab}
      />
      {tab === "Details" ? (
        <DetailsTab
          employee={employee.data}
          admin={user?.role === "ADMIN"}
          onUpdated={() => void employee.refetch()}
        />
      ) : tab === "Attendance" ? (
        <AttendanceTab employeeId={id} />
      ) : (
        <SalaryTab
          employeeId={id}
          canEdit={
            user?.role === "ADMIN" ||
            (user?.role === "SUPERVISOR" &&
              employee.data.role === "Security Guard")
          }
        />
      )}
    </Screen>
  );
}

function DetailsTab({
  employee,
  admin,
  onUpdated,
}: {
  employee: Employee;
  admin: boolean;
  onUpdated: () => void;
}) {
  const colors = useColors();
  const router = useRouter();
  const { showModal } = useModal();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(employee.name);
  const [contact, setContact] = useState(employee.contact);
  const [site, setSite] = useState(employee.site);
  const update = useUpdateEmployee();
  const remove = useDeleteEmployee();
  const save = () => {
    const data: EmployeeInput = {
      name,
      contact,
      site,
      role: employee.role,
      salary: employee.salary,
      basicSalary: employee.basicSalary,
      allowances: employee.allowances,
      overtime: employee.overtime,
      pf: employee.pf,
      esic: employee.esic,
      profilePictureUrl: employee.profilePictureUrl,
      dateOfJoining: employee.dateOfJoining,
    };
    update.mutate(
          { employeeId: String(employee.employeeId), data },
      {
        onSuccess: () => {
          setEditing(false);
          onUpdated();
        },
        onError: () =>
          showModal({ type: "error", title: "Could not save", message: "The employee was not updated." }),
      },
    );
  };
  const confirmDelete = () => {
    if (remove.isPending) return;
    showModal({
      type: "confirmation",
      title: "Delete employee?",
      message: "This removes the employee from permanently.",
      actions: [
        { label: "Cancel", variant: "secondary" },
        {
          label: "Delete",
          variant: "danger",
          onPress: () =>
            new Promise<void>((resolve) => {
              remove.mutate(
                { employeeId: String(employee.employeeId) },
                {
                  onSuccess: () => {
                    showModal({
                      type: "success",
                      title: "Success",
                      message: "Employee deleted successfully.",
                      actions: [{ label: "OK", onPress: () => router.back() }],
                    });
                    resolve();
                  },
                  onError: () => {
                    showModal({ type: "error", title: "Could not delete", message: "Try again." });
                    resolve();
                  },
                },
              );
            }),
        },
      ],
    });
  };
  if (editing)
    return (
      <KeyboardAwareScrollViewCompat
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.editWrap}
        keyboardShouldPersistTaps="handled"
        bottomOffset={40}
      >
        <View style={styles.editHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Edit profile
            </Text>
            <Text
              style={[styles.sectionHint, { color: colors.mutedForeground }]}
            >
              Admin changes sync to the server.
            </Text>
          </View>
          <Pressable onPress={() => setEditing(false)}>
            <Feather name="x" size={21} color={colors.mutedForeground} />
          </Pressable>
        </View>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field
          label="Contact"
          value={contact}
          onChangeText={setContact}
          keyboardType="phone-pad"
        />
        <Field label="Site" value={site} onChangeText={setSite} />
        <PrimaryButton
          label={update.isPending ? "Saving..." : "Save changes"}
          icon="check"
          disabled={update.isPending}
          onPress={save}
        />
        <GhostButton label="Cancel" onPress={() => setEditing(false)} />
      </KeyboardAwareScrollViewCompat>
    );
  return (
    <KeyboardAwareScrollViewCompat
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.detailsWrap}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={[
          styles.profileCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Avatar
          name={employee.name}
          uri={employee.profilePictureUrl}
          size={80}
        />
        <Text style={[styles.profileName, { color: colors.foreground }]}>
          {employee.name}
        </Text>
        <Text style={[styles.profileRole, { color: colors.primary }]}>
          {employee.role}
        </Text>
        <Text style={[styles.profileNumber, { color: colors.mutedForeground }]}>
          EMP-ID: {employee.employeeId}
        </Text>
      </View>
      <View style={styles.infoGrid}>
        <Info label="Contact" value={employee.contact} />
        <Info label="Site" value={employee.site} />
        <Info label="Joining date" value={formatDateOnly(employee.dateOfJoining)} />
        <Info label="Monthly salary" value={formatMoney(employee.salary)} />
      </View>
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.foreground, marginBottom: 11 },
        ]}
      >
        Salary inputs
      </Text>
      <View
        style={[
          styles.salaryInputs,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Info label="Basic salary" value={formatMoney(employee.basicSalary)} />
        <Info label="Allowances" value={formatMoney(employee.allowances)} />
        <Info label="Overtime" value={formatMoney(employee.overtime)} />
        <Info
          label="PF / ESIC"
          value={`${formatMoney(employee.pf)} / ${formatMoney(employee.esic)}`}
        />
      </View>
      {admin ? (
        <View style={styles.actionStack}>
          <PrimaryButton
            label="Edit employee"
            icon="edit-3"
            onPress={() => setEditing(true)}
          />
          <GhostButton
            label={remove.isPending ? "Deleting..." : "Delete employee"}
            icon="trash-2"
            tone="danger"
            onPress={confirmDelete}
            disabled={remove.isPending}
            loading={remove.isPending}
          />
        </View>
      ) : null}
    </KeyboardAwareScrollViewCompat>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.info}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

function formatDateOnly(value: string) {
  const date = value.slice(0, 10).split("-");
  return date.length === 3 ? `${date[2]}-${date[1]}-${date[0]}` : value;
}

function AttendanceTab({ employeeId }: { employeeId: string }) {
  const colors = useColors();
  const { showModal } = useModal();
  const today = new Date();
  const [monthDate, setMonthDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const month = monthDate.getMonth() + 1;
  const year = monthDate.getFullYear();
  const attendance = useGetAttendance(employeeId, { year, month });
  const update = useUpdateAttendance();
  const days = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const recordMap = new Map(
    (attendance.data?.records ?? []).map((record) => [
      record.date,
      record.status,
    ]),
  );
  const changeDay = (day: number) => {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (new Date(`${date}T00:00:00Z`) > new Date()) return;
    const current = recordMap.get(date);
    const status = current === "PRESENT" ? "ABSENT" : "PRESENT";
    update.mutate(
      { employeeId, date, data: { status } },
      {
        onSuccess: () => void attendance.refetch(),
        onError: () =>
          showModal({
            type: "error",
            title: "Attendance not saved",
            message: "Please check your connection and try again.",
          }),
      },
    );
  };
  return (
    <KeyboardAwareScrollViewCompat
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.attendanceWrap}
    >
      <View style={styles.attendanceTop}>
        <Stat
          label="Present"
          value={String(attendance.data?.presentDays ?? 0)}
          tone={colors.primary}
        />
        <Stat
          label="Absent"
          value={String(attendance.data?.absentDays ?? 0)}
          tone={colors.destructive}
        />
      </View>
      <View
        style={[
          styles.calendar,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.calendarHeader}>
          <Pressable
            onPress={() => setMonthDate(new Date(year, month - 2, 1))}
            hitSlop={12}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.calendarTitle, { color: colors.foreground }]}>
            {monthDate.toLocaleString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </Text>
          <Pressable
            onPress={() => setMonthDate(new Date(year, month, 1))}
            hitSlop={12}
          >
            <Feather name="chevron-right" size={20} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.weekRow}>
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <Text
              key={`${day}-${index}`}
              style={[styles.weekDay, { color: colors.mutedForeground }]}
            >
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {Array.from({ length: firstDay + days }, (_, index) => {
            const day = index - firstDay + 1;
            if (day < 1)
              return <View key={`blank-${index}`} style={styles.dayCell} />;
            const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const status = recordMap.get(date);
            const future = new Date(`${date}T00:00:00Z`) > new Date();
            return (
              <Pressable
                key={date}
                disabled={future || update.isPending}
                onPress={() => changeDay(day)}
                style={[
                  styles.dayCell,
                  status === "PRESENT" && { backgroundColor: colors.primary },
                  status === "ABSENT" && {
                    backgroundColor: colors.destructive,
                  },
                  future && { opacity: 0.25 },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: status
                        ? colors.primaryForeground
                        : colors.foreground,
                    },
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.calendarHint, { color: colors.mutedForeground }]}>
          Tap a date to toggle Present / Absent. Future dates are locked.
        </Text>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.stat,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

function SalaryTab({
  employeeId,
  canEdit,
}: {
  employeeId: string;
  canEdit: boolean;
}) {
  const colors = useColors();
  const { showModal } = useModal();
  const today = new Date();
  const salary = useGetSalary(employeeId, {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });
  const [basicSalary, setBasicSalary] = useState("");
  const [allowances, setAllowances] = useState("");
  const [overtime, setOvertime] = useState("");
  const [advance, setAdvance] = useState("");
  const [fine, setFine] = useState("");
  const [pf, setPf] = useState("");
  const [esic, setEsic] = useState("");
  const update = useUpdateSalary();
  if (salary.isLoading) return <LoadingState label="Loading salary..." />;
  if (salary.isError || !salary.data)
    return (
      <ErrorState
        message="Unable to load salary."
        onRetry={() => void salary.refetch()}
      />
    );
  const data = salary.data;
  const values = {
    basicSalary: Number(basicSalary || data.basicSalary),
    allowances: Number(allowances || data.allowances),
    overtime: Number(overtime || data.overtime),
    advance: Number(advance || data.advance),
    fine: Number(fine || data.fine),
    pf: Number(pf || data.pf),
    esic: Number(esic || data.esic),
  };
  const grossSalary = values.basicSalary + values.allowances + values.overtime;
  const totalDeduction =
    values.advance + values.fine + values.pf + values.esic;
  const netSalary = grossSalary - totalDeduction;
  const save = () => {
    update.mutate(
      { employeeId, data: { ...values, year: data.year, month: data.month } },
      {
        onSuccess: () => {
          setBasicSalary("");
          setAllowances("");
          setOvertime("");
          setAdvance("");
          setFine("");
          setPf("");
          setEsic("");
          void salary.refetch();
        },
        onError: () =>
          showModal({ type: "error", title: "Salary not saved", message: "Check the values and try again." }),
      },
    );
  };
  return (
    <KeyboardAwareScrollViewCompat
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.salaryWrap}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    >
      <View style={[styles.salaryHero, { backgroundColor: colors.primary }]}>
        <Text style={[styles.heroLabel, { color: colors.primaryForeground }]}>
          NET SALARY · {String(data.month).padStart(2, "0")}/{data.year}
        </Text>
        <Text style={[styles.heroValue, { color: colors.primaryForeground }]}>
          {formatMoney(netSalary)}
        </Text>
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Earnings
      </Text>
      <SalaryField label="Basic salary" value={basicSalary || String(data.basicSalary)} onChangeText={setBasicSalary} editable={canEdit} />
      <SalaryField label="Allowances" value={allowances || String(data.allowances)} onChangeText={setAllowances} editable={canEdit} />
      <SalaryField
        label="Overtime"
        value={overtime || String(data.overtime)}
        onChangeText={setOvertime}
        editable={canEdit}
        totalLabel="Gross salary"
        totalValue={grossSalary}
      />
      <View style={{ height: 22 }} />
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Deductions
      </Text>
      <SalaryField label="Advance" value={advance || String(data.advance)} onChangeText={setAdvance} editable={canEdit} />
      <SalaryField label="Fine" value={fine || String(data.fine)} onChangeText={setFine} editable={canEdit} />
      <SalaryField label="PF" value={pf || String(data.pf)} onChangeText={setPf} editable={canEdit} />
      <SalaryField
        label="ESIC"
        value={esic || String(data.esic)}
        onChangeText={setEsic}
        editable={canEdit}
        totalLabel="Total deduction"
        totalValue={totalDeduction}
      />
      {canEdit ? (
        <PrimaryButton
          label={update.isPending ? "Saving..." : "Save salary changes"}
          icon="check"
          disabled={update.isPending}
          onPress={save}
        />
      ) : null}
    </KeyboardAwareScrollViewCompat>
  );
}

function SalaryField({
  label,
  value,
  onChangeText,
  editable,
  totalLabel,
  totalValue,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  editable: boolean;
  totalLabel?: string;
  totalValue?: number;
}) {
  const colors = useColors();
  return (
    <View>
      <View style={styles.moneyLine}>
        <Text style={[styles.moneyLabel, { color: colors.mutedForeground }]}>
          + {label}
        </Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          editable={editable}
          selectTextOnFocus
          style={[
            styles.salaryInput,
            {
              color: colors.foreground,
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        />
      </View>
      {totalLabel ? (
        <View style={[styles.moneyTotal, { borderTopColor: colors.border }]}>
          <Text style={[styles.totalLabel, { color: colors.foreground }]}>
            {totalLabel}
          </Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>
            {formatMoney(totalValue ?? 0)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function MoneyLine({
  label,
  value,
  totalLabel,
  totalValue,
}: {
  label: string;
  value: number;
  totalLabel?: string;
  totalValue?: number;
}) {
  const colors = useColors();
  return (
    <View>
      <View style={styles.moneyLine}>
        <Text style={[styles.moneyLabel, { color: colors.mutedForeground }]}>
          + {label}
        </Text>
        <Text style={[styles.moneyValue, { color: colors.foreground }]}>
          {formatMoney(value)}
        </Text>
      </View>
      {totalLabel ? (
        <View style={[styles.moneyTotal, { borderTopColor: colors.border }]}>
          <Text style={[styles.totalLabel, { color: colors.foreground }]}>
            {totalLabel}
          </Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>
            {formatMoney(totalValue ?? 0)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  detailsWrap: { paddingBottom: 30 },
  profileCard: {
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    paddingVertical: 22,
    marginBottom: 13,
  },
  profileName: { ...fonts.bold, fontSize: 21, marginTop: 12 },
  profileRole: { ...fonts.bold, fontSize: 12, marginTop: 5 },
  profileNumber: { ...fonts.regular, fontSize: 12, marginTop: 7 },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 24,
  },
  info: { width: "48%", paddingVertical: 5 },
  infoLabel: { ...fonts.medium, fontSize: 11 },
  infoValue: { ...fonts.bold, fontSize: 14, marginTop: 5 },
  salaryInputs: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  actionStack: { gap: 11 },
  editWrap: { paddingTop: 25, paddingBottom: 35 },
  editHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 25,
  },
  sectionTitle: { ...fonts.bold, fontSize: 18 },
  sectionHint: { ...fonts.regular, fontSize: 12, marginTop: 4 },
  attendanceWrap: { paddingBottom: 30 },
  attendanceTop: { flexDirection: "row", gap: 9, marginBottom: 18 },
  stat: {
    flex: 1,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    paddingVertical: 15,
  },
  statValue: { ...fonts.bold, fontSize: 23 },
  statLabel: { ...fonts.medium, fontSize: 11, marginTop: 3 },
  calendar: { borderRadius: 21, borderWidth: 1, padding: 15 },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
    marginBottom: 18,
  },
  calendarTitle: { ...fonts.bold, fontSize: 16 },
  weekRow: { flexDirection: "row", marginBottom: 7 },
  weekDay: {
    ...fonts.bold,
    width: "14.2857%",
    textAlign: "center",
    fontSize: 11,
  },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginBottom: 3,
  },
  dayText: { ...fonts.semibold, fontSize: 13 },
  calendarHint: {
    ...fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 12,
  },
  salaryWrap: { paddingBottom: 30 },
  salaryHero: { borderRadius: 22, padding: 20, marginBottom: 23 },
  heroLabel: { ...fonts.bold, fontSize: 11, letterSpacing: 1 },
  heroValue: { ...fonts.bold, fontSize: 32, marginTop: 10 },
  heroCaption: { ...fonts.medium, fontSize: 11, marginTop: 5, opacity: 0.8 },
  moneyLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  moneyLabel: { ...fonts.medium, fontSize: 14 },
  moneyValue: { ...fonts.semibold, fontSize: 14 },
  salaryInput: {
    minWidth: 105,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "600",
  },
  moneyTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 13,
    paddingBottom: 7,
    marginTop: 2,
  },
  totalLabel: { ...fonts.bold, fontSize: 14 },
  totalValue: { ...fonts.bold, fontSize: 15 },
  transactionButtons: { gap: 11, marginTop: 18 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 18,
  },
  transactionModal: { borderRadius: 23, borderWidth: 1, padding: 20 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 21,
  },
  modalTitle: { ...fonts.bold, fontSize: 21 },
});
