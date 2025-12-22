import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aura Pulse",
  description:
    "Aura Pulse is a next-gen daily productivity hub for tasks, events, schedules, fitness tracking, and goal management, brought to life with modern 3D motion and analytics dashboards.",
  keywords: [
    "Aura Pulse",
    "todo tracker",
    "task management",
    "productivity",
    "daily planner",
    "goal tracking",
    "schedule management"
  ],
  applicationName: "Aura Pulse",
  openGraph: {
    title: "Aura Pulse",
    description:
      "Aura Pulse is a next-gen daily productivity hub for tasks, events, schedules, fitness tracking, and goal management, brought to life with modern 3D motion and analytics dashboards.",
    type: "website",
    siteName: "Aura Pulse"
  },
  twitter: {
    card: "summary_large_image",
    title: "Aura Pulse",
    description:
      "Aura Pulse is a next-gen daily productivity hub for tasks, events, schedules, fitness tracking, and goal management, brought to life with modern 3D motion and analytics dashboards."
  },
  icons: {
    icon: "/aura-pulse.png",
    apple: "/aura-pulse.png"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
