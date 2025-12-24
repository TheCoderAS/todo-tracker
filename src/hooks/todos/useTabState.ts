import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

type TabState = "todos" | "habits";

const getTabFromParams = (params: URLSearchParams) =>
  params.get("tab") === "habits" ? "habits" : "todos";

export const useTabState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabState>(() =>
    getTabFromParams(searchParams)
  );

  useEffect(() => {
    const nextTab = getTabFromParams(searchParams);
    setActiveTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [searchParams]);

  const setTab = (tab: TabState) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "habits") {
      params.set("tab", "habits");
    } else {
      params.delete("tab");
    }
    setSearchParams(params, { replace: true });
  };

  return { activeTab, setTab };
};
