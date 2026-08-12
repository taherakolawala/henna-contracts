import React, { useState } from "react";
import { HomeScreen } from "./screens/HomeScreen";
import { ContractFormScreen } from "./screens/ContractFormScreen";

type Route = { name: "home" } | { name: "form"; contractId: string | null };

export function App() {
  const [route, setRoute] = useState<Route>({ name: "home" });

  if (route.name === "home") {
    return (
      <HomeScreen
        onNew={() => setRoute({ name: "form", contractId: null })}
        onOpen={(id) => setRoute({ name: "form", contractId: id })}
      />
    );
  }

  return (
    <ContractFormScreen
      contractId={route.contractId}
      onBack={() => setRoute({ name: "home" })}
    />
  );
}
