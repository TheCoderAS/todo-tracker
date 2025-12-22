"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import CompletedTargetCard from "@/components/dashboard/CompletedTargetCard";
import SpilloverSummaryCard from "@/components/dashboard/SpilloverSummaryCard";
import WeeklyCompletionChart from "@/components/dashboard/WeeklyCompletionChart";
import { useCompletionAnalytics } from "@/components/dashboard/useCompletionAnalytics";

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    dailyCompletions,
    todayTarget,
    todayCompleted,
    onTimeCompletions,
    spilloverCompletions,
    loading: analyticsLoading
  } = useCompletionAnalytics(user);

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <CompletedTargetCard
          completed={todayCompleted}
          target={todayTarget}
          loading={analyticsLoading}
        />
        <SpilloverSummaryCard onTime={onTimeCompletions} spillover={spilloverCompletions} />
        <WeeklyCompletionChart days={dailyCompletions} />
      </div>
    </section>
  );
}
