import { useAuth } from "@/components/auth/AuthProvider";
import CompletedTargetCard from "@/components/dashboard/CompletedTargetCard";
import DashboardParallax from "@/components/dashboard/DashboardParallax";
import HabitAnalyticsCard from "@/components/dashboard/HabitAnalyticsCard";
import HabitConsistencyCard from "@/components/dashboard/HabitConsistencyCard";
import HabitTrendChart from "@/components/dashboard/HabitTrendChart";
import ProgressOrbCard from "@/components/dashboard/ProgressOrbCard";
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
    <DashboardParallax>
      <section className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="dashboard-card md:col-span-2 lg:col-span-2">
            <ProgressOrbCard
              completed={todayCompleted}
              target={todayTarget}
              loading={analyticsLoading}
            />
          </div>
          <div className="dashboard-card">
            <CompletedTargetCard
              completed={todayCompleted}
              target={todayTarget}
              loading={analyticsLoading}
            />
          </div>
          <div className="dashboard-card">
            <WeeklyCompletionChart
              onTime={onTimeCompletions}
              spillover={spilloverCompletions}
            />
          </div>
          <div className="dashboard-card">
            <HabitAnalyticsCard
              activeHabits={activeHabits}
              completedToday={habitsCompletedToday}
              completionRate={completionRate}
              weeklyTrend={weeklyTrend}
              loading={habitLoading}
            />
          </div>
          <div className="dashboard-card">
            <HabitConsistencyCard
              days={rollingWindowDays}
              completed={rollingWindowCompleted}
              scheduled={rollingWindowScheduled}
              completionRate={rollingWindowCompletionRate}
              loading={habitLoading}
            />
          </div>
        </div>
        <div className="dashboard-card">
          <HabitTrendChart
            weeklyTrend={weeklyTrend}
            monthlyTrend={monthlyTrend}
            yearlyTrend={yearlyTrend}
          />
        </div>
        <div className="dashboard-card">
          <WeeklyCompletionSpilloverChart data={weeklyCompletionBreakdown} />
        </div>
      </section>
    </DashboardParallax>
  );
}
