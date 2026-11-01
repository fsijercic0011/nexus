import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { SearchableSelect } from "./searchable-select";

const render = (compact: boolean, value = "") =>
  renderToStaticMarkup(
    <SearchableSelect
      id="person"
      compact={compact}
      value={value}
      onChange={() => {}}
      label="Assignee"
      placeholder="All assignees"
      empty="Nobody"
      options={[
        { value: "", label: "All assignees" },
        { value: "4", label: "Zoe" },
      ]}
    />,
  );

test("compact: closed it is a dropdown trigger showing the chosen person, not a text field", () => {
  const html = render(true, "4");
  expect(html).toContain('data-slot="select-trigger"');
  expect(html).toContain("Zoe");
  expect(html).not.toMatch(/<input[^>]*id="person"/);
  expect(html).toContain("lucide-chevron-down");
});

test("forms: a field you type into", () => {
  expect(render(false)).toMatch(/<input[^>]*id="person"/);
});
