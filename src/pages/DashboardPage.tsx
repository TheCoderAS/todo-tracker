import { useAuth } from "@/components/auth/AuthProvider";
import CompletedTargetCard from "@/components/dashboard/CompletedTargetCard";
import HabitAnalyticsCard from "@/components/dashboard/HabitAnalyticsCard";
import HabitConsistencyCard from "@/components/dashboard/HabitConsistencyCard";
import HabitTrendChart from "@/components/dashboard/HabitTrendChart";
import ProductivityScoreCard from "@/components/dashboard/ProductivityScoreCard";
import WeeklyCompletionChart from "@/components/dashboard/WeeklyCompletionChart";
import WeeklyCompletionSpilloverChart from "@/components/dashboard/WeeklyCompletionSpilloverChart";
import WeeklySummaryCard from "@/components/dashboard/WeeklySummaryCard";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
import { useCompletionAnalytics } from "@/components/dashboard/useCompletionAnalytics";
import { useHabitAnalytics } from "@/components/dashboard/useHabitAnalytics";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useTodosData } from "@/hooks/todos/useTodosData";
import { useHabitsData } from "@/hooks/todos/useHabitsData";

export default function DashboardPage() {
  const { user } = useAuth();
  const { showOnboarding, completeOnboarding } = useOnboarding(user);
  const { todos, isInitialLoad: todosLoading } = useTodosData(user);
  const { habits, isInitialLoad: habitsLoading } = useHabitsData(user);
  const {
    todayTarget,
    todayCompleted,
    onTimeCompletions,
    spilloverCompletions,
    weeklyCompletionBreakdown,
    completionByDayOfWeek,
    completionByPriority,
    productivityScore,
    loading: analyticsLoading
  } = useCompletionAnalytics(todos, todosLoading);
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
  } = useHabitAnalytics(habits, habitsLoading);

  return (
    <section className="grid gap-4">
      <OnboardingModal isOpen={showOnboarding} onComplete={completeOnboarding} />
      <header>
        <p className="text-sm text-muted">Your progress</p>
        <h1 className="text-3xl font-semibold gradient-text">Insights</h1>
        <p className="mt-1 text-sm text-faint">
          Trends, streaks, and how your week is shaping up.
        </p>
      </header>
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
      <WeeklySummaryCard
        data={weeklyCompletionBreakdown}
        todayCompleted={todayCompleted}
        todayTarget={todayTarget}
      />
      <ProductivityScoreCard
        score={productivityScore}
        completionByDayOfWeek={completionByDayOfWeek}
        completionByPriority={completionByPriority}
      />
      <HabitTrendChart
        weeklyTrend={weeklyTrend}
        monthlyTrend={monthlyTrend}
        yearlyTrend={yearlyTrend}
      />
      <WeeklyCompletionSpilloverChart data={weeklyCompletionBreakdown} />
    </section>
  );
}
