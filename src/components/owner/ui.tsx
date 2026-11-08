"use client";

import type { ReactNode } from "react";
import { ViewSkeleton } from "../dashboard-ui";
import { useOwnerData } from "./useOwnerData";

export * from "../dashboard-ui";

/** Shows a skeleton until the owner's data has loaded. The layout always renders its children. */
export function OwnerReady({ children }: { children: ReactNode }) {
  const { ready } = useOwnerData();
  return ready ? <>{children}</> : <ViewSkeleton />;
}

