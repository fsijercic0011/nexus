import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Our theme's font-size tokens (index.css). Without them tailwind-merge reads
// `text-micro`/`text-caption` as text colors and drops them next to one.
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ["caption", "micro"] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
