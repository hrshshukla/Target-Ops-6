import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useGuardSalary } from "@/api-client";
import {
  ErrorState,
  formatMoney,
  Header,
  LoadingState,
  Screen,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/fonts";

export default function GuardSalaryScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const colors = useColors();

  const now = new Date();
  const salary = useGuardSalary(
    now.getFullYear(),
    now.getMonth() + 1
  );

  useEffect(() => {
    if (!isLoading && user?.role !== "SECURITY_GUARD") {
      router.replace("/home");
    }
  }, [isLoading, router, user]);

  if (isLoading || user?.role !== "SECURITY_GUARD") {
    return null;
  }

  return (
    <Screen scroll={false}>
      <Header title="Salary" subtitle="Your monthly salary" />

      {/* Only salary section is scrollable */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {salary.isLoading ? (
          <LoadingState label="Loading salary..." />
        ) : salary.isError || !salary.data ? (
          <ErrorState
            message="Unable to load your salary."
            onRetry={() => void salary.refetch()}
          />
        ) : (
          <>
            {/* Net Salary */}
            <View
              style={[
                styles.hero,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.heroLabel,
                  { color: colors.primaryForeground },
                ]}
              >
                NET SALARY ·{" "}
                {String(salary.data.month).padStart(2, "0")}/
                {salary.data.year}
              </Text>

              <Text
                style={[
                  styles.heroValue,
                  { color: colors.primaryForeground },
                ]}
              >
                {formatMoney(salary.data.netSalary)}
              </Text>
            </View>

            {/* Salary Breakdown */}
            <Text
              style={[
                styles.title,
                { color: colors.foreground },
              ]}
            >
              Salary breakdown
            </Text>

            <Line
              label="Basic salary"
              value={salary.data.basicSalary}
            />

            <Line
              label="Allowances"
              value={salary.data.allowances}
            />

            <Line
              label="Overtime"
              value={salary.data.overtime}
            />

            {/* Gross Salary */}
            <View
              style={[
                styles.total,
                { borderTopColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.totalLabel,
                  { color: colors.foreground },
                ]}
              >
                Gross salary
              </Text>

              <Text
                style={[
                  styles.totalValue,
                  { color: colors.primary },
                ]}
              >
                {formatMoney(salary.data.grossSalary)}
              </Text>
            </View>

            {/* Deductions */}
            <Line
              label="Advance"
              value={-salary.data.advance}
            />

            <Line
              label="Fine"
              value={-salary.data.fine}
            />

            <Line
              label="PF / ESIC"
              value={-(salary.data.pf + salary.data.esic)}
            />

            {/* Total Deduction */}
            <View
              style={[
                styles.total,
                { borderTopColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.totalLabel,
                  { color: colors.foreground },
                ]}
              >
                Total deduction
              </Text>

              <Text
                style={[
                  styles.totalValue,
                  { color: colors.destructive },
                ]}
              >
                {formatMoney(salary.data.totalDeduction)}
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Fixed bottom navigation */}
    </Screen>
  );
}

function Line({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const colors = useColors();

  return (
    <View style={styles.line}>
      <Text
        style={[
          styles.label,
          { color: colors.mutedForeground },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.value,
          { color: colors.foreground },
        ]}
      >
        {formatMoney(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  /*
   * This takes the available space between
   * Header and GuardNav.
   */
  content: {
    flex: 1,
  },

  /*
   * Salary content can become taller than the
   * available space and will scroll vertically.
   */
  body: {
    gap: 11,
    paddingBottom: 24,
  },

  hero: {
    borderRadius: 21,
    padding: 20,
    gap: 7,
    marginBottom: 8,
  },

  heroLabel: {
    ...fonts.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },

  heroValue: {
    ...fonts.bold,
    fontSize: 30,
  },

  heroHint: {
    ...fonts.regular,
    fontSize: 11,
  },

  title: {
    ...fonts.bold,
    fontSize: 18,
    marginBottom: 4,
  },

  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },

  label: {
    ...fonts.medium,
    fontSize: 13,
  },

  value: {
    ...fonts.bold,
    fontSize: 14,
  },

  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 2,
    marginBottom: 4,
  },

  totalLabel: {
    ...fonts.bold,
    fontSize: 13,
  },

  totalValue: {
    ...fonts.bold,
    fontSize: 15,
  },
});