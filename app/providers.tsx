"use client";

import { Provider } from "react-redux";
import { store } from "@/src/shared/redux/store";
import { AuthProvider } from "@/src/shared/auth/AuthProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>{children}</AuthProvider>
    </Provider>
  );
}
