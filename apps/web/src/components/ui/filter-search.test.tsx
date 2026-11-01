import { Tag } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { FilterField, FilterSearch } from "./filter-search";

test("the shared filter search: labelled for screen readers, magnifier icon, bordered", () => {
  const html = renderToStaticMarkup(
    <FilterSearch
      id="x-search"
      label="Search"
      placeholder="Zoek…"
      value=""
      onChange={() => {}}
    />,
  );
  expect(html).toContain('for="x-search"');
  expect(html).toContain("sr-only");
  expect(html).toContain("lucide-search");
  expect(html).not.toContain("border-transparent");
});

test("a compact filter field: fixed desktop width, label for screen readers only", () => {
  const html = renderToStaticMarkup(
    <FilterField id="x-role" label="Rol">
      <span>control</span>
    </FilterField>,
  );
  expect(html).toContain("md:w-48");
  expect(html).toMatch(/<label[^>]*sr-only[^>]*>Rol<\/label>/);
});

test("a filter field's icon takes its sidebar color family", () => {
  const html = renderToStaticMarkup(
    <FilterField id="x-type" label="Type" icon={Tag} tone="violet">
      <span>control</span>
    </FilterField>,
  );
  expect(html).toContain("var(--nav-violet-2)");
  expect(html).toContain('aria-hidden="true"');
});
