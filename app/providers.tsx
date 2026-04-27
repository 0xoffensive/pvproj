"use client";

import { SessionProvider } from "next-auth/react";
import MessagingMenu from "./components/MessagingMenu";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <MessagingMenu />
    </SessionProvider>
  );
}