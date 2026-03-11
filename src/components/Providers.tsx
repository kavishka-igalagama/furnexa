"use client";

import { DesignProvider } from "@/context/DesignContext";
import { Toaster } from "@/components/ui/sonner";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <DesignProvider>
      {children}
      <Toaster richColors closeButton />
    </DesignProvider>
  );
};

export default Providers;
