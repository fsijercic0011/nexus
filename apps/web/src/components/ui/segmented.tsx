import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  id: T;
  label: string;
  disabled?: boolean;
}

/** Single-select pill group . The active state is
 * aria-pressed; one shared fill measures the active button and slides
 * to it instead of each button painting its own background. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  ...rest
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
    height: number;
  } | null>(null);

  // Measured before paint so the fill never flashes at the wrong spot; a
  // ResizeObserver re-measures when the group itself resizes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the options (button sizes) change.
  useLayoutEffect(() => {
    function measure() {
      const button = buttonRefs.current.get(value);
      if (button)
        setIndicator({
          left: button.offsetLeft,
          width: button.offsetWidth,
          height: button.offsetHeight,
        });
    }
    measure();
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [value, options]);

  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would add form semantics and default styling to a toolbar control.
    <div
      ref={containerRef}
      role="group"
      aria-label={rest["aria-label"]}
      className={cn(
        "relative flex w-fit shrink-0 gap-0.5 rounded-full border border-border bg-secondary p-[3px]",
        className,
      )}
    >
      {indicator && (
        <span
          aria-hidden="true"
          className="absolute top-[3px] left-0 rounded-full bg-foreground transition-[transform,width] duration-200 ease-out motion-reduce:transition-none"
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: indicator.width,
            height: indicator.height,
          }}
        />
      )}
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            disabled={option.disabled}
            ref={(el) => {
              if (el) buttonRefs.current.set(option.id, el);
              else buttonRefs.current.delete(option.id);
            }}
            onClick={() => {
              if (!option.disabled) onChange(option.id);
            }}
            className={cn(
              "relative z-10 inline-flex h-8 cursor-pointer items-center justify-center rounded-full px-3.5 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
              active && "text-background hover:text-background",
              option.disabled &&
                "cursor-not-allowed opacity-40 hover:text-muted-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
