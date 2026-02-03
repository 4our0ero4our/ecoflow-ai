"use client";

import { ReactNode } from "react";
import { CustomAlertProvider } from "./CustomAlert";

export function Providers({ children }: { children: ReactNode }) {
  return <CustomAlertProvider>{children}</CustomAlertProvider>;
}
