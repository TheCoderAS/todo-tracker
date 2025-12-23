"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";

type TabState = "todos" | "habits";

const getTabFromParams = (params: URLSearchParams | ReadonlyURLSearchParams) =>
  params.get("tab") === "habits" ? "habits" : "todos";

export const useTabState = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabState>(() =>
    getTabFromParams(searchParams)
  );

  useEffect(() => {
    const nextTab = getTabFromParams(searchParams);
    setActiveTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [searchParams]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveTab(getTabFromParams(params));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const setTab = (tab: TabState) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "habits") {
      params.set("tab", "habits");
    } else {
      params.delete("tab");
    }
    const queryString = params.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    window.history.replaceState(null, "", nextUrl);
  };

  return { activeTab, setTab };
};
