import { useAuth } from "@/components/auth/AuthProvider";
import CompletedTargetCard from "@/components/dashboard/CompletedTargetCard";
import HabitAnalyticsCard from "@/components/dashboard/HabitAnalyticsCard";
import HabitConsistencyCard from "@/components/dashboard/HabitConsistencyCard";
import HabitTrendChart from "@/components/dashboard/HabitTrendChart";
import WeeklyCompletionChart from "@/components/dashboard/WeeklyCompletionChart";
import WeeklyCompletionSpilloverChart from "@/components/dashboard/WeeklyCompletionSpilloverChart";
import { useCompletionAnalytics } from "@/components/dashboard/useCompletionAnalytics";
import { useHabitAnalytics } from "@/components/dashboard/useHabitAnalytics";

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    todayTarget,
    todayCompleted,
    onTimeCompletions,
    spilloverCompletions,
    weeklyCompletionBreakdown,
    loading: analyticsLoading
  } = useCompletionAnalytics(user);
  const {
    activeHabits,
    completedToday: habitsCompletedToday,
    completionRate,
    rollingWindowDays,
    rollingWindowCompletionRate,
    rollingWindowCompleted,
    rollingWindowScheduled,
    weeklyTrend,
    monthlyTrend,
    yearlyTrend,
    loading: habitLoading
  } = useHabitAnalytics(user);

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <CompletedTargetCard
          completed={todayCompleted}
          target={todayTarget}
          loading={analyticsLoading}
        />
        <WeeklyCompletionChart
          onTime={onTimeCompletions}
          spillover={spilloverCompletions}
        />
        <HabitAnalyticsCard
          activeHabits={activeHabits}
          completedToday={habitsCompletedToday}
          completionRate={completionRate}
          weeklyTrend={weeklyTrend}
          loading={habitLoading}
        />
        <HabitConsistencyCard
          days={rollingWindowDays}
          completed={rollingWindowCompleted}
          scheduled={rollingWindowScheduled}
          completionRate={rollingWindowCompletionRate}
          loading={habitLoading}
        />
      </div>
      <HabitTrendChart
        weeklyTrend={weeklyTrend}
        monthlyTrend={monthlyTrend}
        yearlyTrend={yearlyTrend}
      />
      <WeeklyCompletionSpilloverChart data={weeklyCompletionBreakdown} />
    </section>
  );
}
