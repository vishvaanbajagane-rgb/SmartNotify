"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface UploadSessionContextType {
  hasUploaded: boolean;
  setHasUploaded: (value: boolean) => void;
}

const UploadSessionContext = createContext<UploadSessionContextType | undefined>(
  undefined
);

export function UploadSessionProvider({ children }: { children: ReactNode }) {
  // IMPORTANT:
  // This is intentionally only React state.
  // It disappears when the browser page is refreshed.
  const [hasUploaded, setHasUploaded] = useState(false);

  return (
    <UploadSessionContext.Provider
      value={{
        hasUploaded,
        setHasUploaded,
      }}
    >
      {children}
    </UploadSessionContext.Provider>
  );
}

export function useUploadSession() {
  const context = useContext(UploadSessionContext);

  if (!context) {
    throw new Error(
      "useUploadSession must be used inside UploadSessionProvider"
    );
  }

  return context;
}