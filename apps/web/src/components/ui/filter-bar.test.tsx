import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { FilterBar } from "./filter-bar";

const render = (activeCount: number) =>
  renderToStaticMarkup(
    <FilterBar
      search={<input aria-label="search" />}
      activeCount={activeCount}
      resultCount={3}
      onClearSheet={() => {}}
      onReset={() => {}}
    >
      <span>status control</span>
    </FilterBar>,
  );

test("desktop: search, then the Filters toggle and Clear; the filter row starts closed", () => {
  const html = render(0);
  expect(html.indexOf('aria-label="search"')).toBeLessThan(
    html.indexOf("Filters"),
  );
  expect(html.indexOf("Filters")).toBeLessThan(
    html.indexOf('aria-label="Clear filters"'),
  );
  expect(html).toContain('aria-expanded="false"');
  expect(html).toMatch(/<div id="[^"]+" hidden=""[^>]*><span>status control/);
});

test("desktop: with a filter already set the row opens and the toggle shows the count", () => {
  const html = render(2);
  expect(html).toContain('aria-expanded="true"');
  expect(html).not.toMatch(/hidden=""[^>]*><span>status control/);
  expect(html).toContain("2 active");
});
