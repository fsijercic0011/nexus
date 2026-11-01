import { Search } from "lucide-react";
import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";

export function SearchInput(
  props: Omit<ComponentProps<typeof Input>, "type" | "className">,
) {
  return (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        {...props}
        type="search"
        className="h-10 rounded-md bg-card pl-10"
      />
    </div>
  );
}
