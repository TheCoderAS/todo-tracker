import { useAuth } from "@/components/auth/AuthProvider";
import CompletedTargetCard from "@/components/dashboard/CompletedTargetCard";
import HabitAnalyticsCard from "@/components/dashboard/HabitAnalyticsCard";
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
    weeklyTrend,
    monthlyTrend,
    yearlyTrend,
    loading: habitLoading
  } = useHabitAnalytics(habits, habitsLoading);

  return (
    <section className="grid gap-6">
      <OnboardingModal isOpen={showOnboarding} onComplete={completeOnboarding} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CompletedTargetCard
          completed={todayCompleted}
          target={todayTarget}
          loading={analyticsLoading}
        />
        <WeeklyCompletionChart onTime={onTimeCompletions} spillover={spilloverCompletions} />
        <HabitAnalyticsCard
          activeHabits={activeHabits}
          completedToday={habitsCompletedToday}
          completionRate={completionRate}
          weeklyTrend={weeklyTrend}
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
