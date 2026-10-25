"use client";

import { SearchInput } from "@whiteoligator/drill-kit";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBox() {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
      }}
    >
      <SearchInput
        size="md"
        testId="header-search"
        placeholder="Искать товары, бренды и магазины"
        value={value}
        onChange={setValue}
      />
    </form>
  );
}
