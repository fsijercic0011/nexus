import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { MultiSelect } from "./multi-select";

const options = [
  { value: "tip", label: "Tips" },
  { value: "message", label: "Messages" },
  { value: "ppv", label: "PPV" },
  { value: "subscription", label: "Subs" },
];
const render = (value: string[]) =>
  renderToStaticMarkup(
    <MultiSelect
      id="types"
      label="Type"
      allLabel="All types"
      options={options}
      value={value}
      onChange={() => {}}
    />,
  );

test("the closed dropdown names what is picked", () => {
  expect(render([])).toContain("All types");
  expect(render(["tip", "message", "ppv", "subscription"])).toContain(
    "All types",
  );
  expect(render(["ppv", "tip"])).toContain("Tips, PPV");
  expect(render(["tip", "message", "ppv"])).toMatch(/3 (of|van) 4/);
});
