"use client";

import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import CompletedTargetCard from "@/components/dashboard/CompletedTargetCard";
import HabitAnalyticsCard from "@/components/dashboard/HabitAnalyticsCard";
import SpilloverSummaryCard from "@/components/dashboard/SpilloverSummaryCard";
import WeeklyCompletionChart from "@/components/dashboard/WeeklyCompletionChart";
import WeeklyCompletionSpilloverChart from "@/components/dashboard/WeeklyCompletionSpilloverChart";
import { useCompletionAnalytics } from "@/components/dashboard/useCompletionAnalytics";
import { useHabitAnalytics } from "@/components/dashboard/useHabitAnalytics";

export default function DashboardPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const {
    todayTarget,
    todayCompleted,
    onTimeCompletions,
    spilloverCompletions,
    weeklyCompletionBreakdown,
    loading: analyticsLoading
  } = useCompletionAnalytics(user, pathname);
  const {
    activeHabits,
    completedToday: habitsCompletedToday,
    completionRate,
    weeklyTrend,
    loading: habitLoading
  } = useHabitAnalytics(user);

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <CompletedTargetCard
          completed={todayCompleted}
          target={todayTarget}
          loading={analyticsLoading}
        />
        <SpilloverSummaryCard onTime={onTimeCompletions} spillover={spilloverCompletions} />
        <WeeklyCompletionChart onTime={onTimeCompletions} spillover={spilloverCompletions} />
        <HabitAnalyticsCard
          activeHabits={activeHabits}
          completedToday={habitsCompletedToday}
          completionRate={completionRate}
          weeklyTrend={weeklyTrend}
          loading={habitLoading}
        />
      </div>
      <WeeklyCompletionSpilloverChart data={weeklyCompletionBreakdown} />
    </section>
  );
}
