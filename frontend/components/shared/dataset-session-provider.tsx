
"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface DatasetSessionContextType {
  datasetUploaded: boolean;
  markDatasetUploaded: () => void;
  clearDatasetSession: () => void;
}

const DatasetSessionContext =
  createContext<DatasetSessionContextType | undefined>(undefined);

export function DatasetSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [datasetUploaded, setDatasetUploaded] = useState(false);

  const markDatasetUploaded = () => {
    setDatasetUploaded(true);
  };

  const clearDatasetSession = () => {
    setDatasetUploaded(false);
  };

  return (
    <DatasetSessionContext.Provider
      value={{
        datasetUploaded,
        markDatasetUploaded,
        clearDatasetSession,
      }}
    >
      {children}
    </DatasetSessionContext.Provider>
  );
}

export function useDatasetSession() {
  const context = useContext(DatasetSessionContext);

  if (!context) {
    throw new Error(
      "useDatasetSession must be used inside DatasetSessionProvider"
    );
  }

  return context;
}