import * as React from "react";

export function useDriverFilters() {
  const [filters, setFilters] = React.useState<{ search?: string; status?: string; compliant?: "ok"|"warn"|"bad"|"" }>({});
  return { filters, setFilters };
}
