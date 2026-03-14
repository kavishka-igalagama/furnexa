"use client";

import { SessionProvider } from "next-auth/react";
import { DesignProvider } from "@/context/DesignContext";
import { Toaster } from "@/components/ui/sonner";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <DesignProvider>
        {children}
        <Toaster richColors closeButton />
      </DesignProvider>
    </SessionProvider>
  );
};

export default Providers;
