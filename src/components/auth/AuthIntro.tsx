import { FiCheckCircle, FiShield, FiTrendingUp } from "react-icons/fi";

import FeatureCard from "@/components/auth/FeatureCard";
import Card from "@/components/ui/Card";

const features = [
  {
    title: "Guided structure",
    description:
      "Separate sign-in and sign-up flows with clear steps and supporting copy.",
    icon: FiCheckCircle
  },
  {
    title: "Secure by design",
    description: "Email + Google authentication with trusted Firebase security.",
    icon: FiShield
  },
  {
    title: "Focused productivity",
    description: "Track priorities, due dates, and completion insights effortlessly.",
    icon: FiTrendingUp
  }
];

export default function AuthIntro() {
  return (
    <Card className="bg-slate-900/50">
      <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-sky-200">
        Modern workspace
      </span>
      <h2 className="mt-6 text-3xl font-semibold text-white">
        A more focused way to manage every task
      </h2>
      <p className="mt-3 max-w-xl text-sm text-slate-300">
        Aura Pulse keeps your goals organized in one space. Sign in to pick up where you
        left off, or create a personalized workspace in minutes.
      </p>
      <div className="mt-8 grid gap-4">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </Card>
  );
}
