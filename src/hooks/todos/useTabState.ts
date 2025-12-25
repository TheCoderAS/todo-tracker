import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

type TabState = "todos" | "habits" | "focus";

const getTabFromParams = (params: URLSearchParams) => {
  const tab = params.get("tab");
  if (tab === "habits" || tab === "focus") return tab;
  return "todos";
};

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
    if (tab === "habits" || tab === "focus") {
      params.set("tab", tab);
    } else {
      params.delete("tab");
    }
    setSearchParams(params, { replace: true });
  };

  return { activeTab, setTab };
};
