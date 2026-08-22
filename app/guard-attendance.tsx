import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useGuardAttendance } from "@/api-client";
import { ErrorState, Header, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/fonts";

export default function GuardAttendanceScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const today = new Date();
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;
  const attendance = useGuardAttendance(year, month);

  useEffect(() => {
    if (!isLoading && user?.role !== "SECURITY_GUARD") router.replace("/home");
  }, [isLoading, router, user]);
  if (isLoading || user?.role !== "SECURITY_GUARD") return null;

  const recordMap = useMemo(() => new Map((attendance.data?.records ?? []).map((record) => [record.date, record.status])), [attendance.data]);
  const days = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  return (
    <Screen scroll={false}>
      <Header title="Attendance" subtitle="Your monthly record" />
      <View style={styles.content}>
        {attendance.isLoading ? <LoadingState label="Loading attendance..." /> : attendance.isError || !attendance.data ? <ErrorState message="Unable to load your attendance." onRetry={() => void attendance.refetch()} /> : (
          <View style={styles.body}>
            <View style={styles.stats}>
              <Stat label="Present" value={attendance.data.presentDays} color={colors.primary} />
              <Stat label="Absent" value={attendance.data.absentDays} color={colors.destructive} />
            </View>
            <View style={[styles.calendar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.monthRow}>
                <Pressable onPress={() => setMonthDate(new Date(year, month - 2, 1))} hitSlop={12}><Feather name="chevron-left" size={20} color={colors.foreground} /></Pressable>
                <Text style={[styles.month, { color: colors.foreground }]}>{monthDate.toLocaleString("en-IN", { month: "long", year: "numeric" })}</Text>
                <Pressable onPress={() => setMonthDate(new Date(year, month, 1))} hitSlop={12}><Feather name="chevron-right" size={20} color={colors.foreground} /></Pressable>
              </View>
              <View style={styles.week}><Text style={styles.weekText}>S</Text><Text style={styles.weekText}>M</Text><Text style={styles.weekText}>T</Text><Text style={styles.weekText}>W</Text><Text style={styles.weekText}>T</Text><Text style={styles.weekText}>F</Text><Text style={styles.weekText}>S</Text></View>
              <View style={styles.grid}>
                {Array.from({ length: firstDay + days }, (_, index) => {
                  const day = index - firstDay + 1;
                  if (day < 1) return <View key={`blank-${index}`} style={styles.day} />;
                  const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const status = recordMap.get(date);
                  return <View key={date} style={[styles.day, status === "PRESENT" && { backgroundColor: colors.primary }, status === "ABSENT" && { backgroundColor: colors.destructive }]}><Text style={[styles.dayText, { color: status ? colors.primaryForeground : colors.foreground }]}>{day}</Text></View>;
                })}
              </View>
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useColors();
  return <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.statValue, { color }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  body: { flex: 1, gap: 18 },
  stats: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 17, padding: 15 },
  statValue: { ...fonts.bold, fontSize: 24 },
  statLabel: { ...fonts.medium, fontSize: 12, marginTop: 3 },
  calendar: { borderWidth: 1, borderRadius: 20, padding: 16 },
  monthRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  month: { ...fonts.bold, fontSize: 16 },
  week: { flexDirection: "row", marginBottom: 8 },
  weekText: { ...fonts.bold, color: "#70818a", fontSize: 11, textAlign: "center", width: "14.285%" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  day: { width: "14.285%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  dayText: { ...fonts.semibold, fontSize: 12 },
});