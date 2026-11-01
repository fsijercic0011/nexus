import { type Me, nameSchema } from "@nexus/shared";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionForm } from "@/components/ui/section-form";
import { ME_QUERY_KEY } from "@/hooks/useMe";
import { sendJson } from "@/lib/api";
import { SettingsSection } from "./SettingsSection";

const nameResponse = z.object({ name: z.string() });

export function HouseholdSection({ me }: { me: Me }) {
  return (
    <SettingsSection title="Household">
      <SectionForm
        queryKey={ME_QUERY_KEY}
        initial={{ name: me.household.name }}
        editable={me.role === "admin"}
        valid={(values) => nameSchema.safeParse(values.name).success}
        save={(values) =>
          sendJson("PATCH", "/api/household", values, nameResponse, {
            idempotencyKey: uuidv7(),
          })
        }
      >
        {(values, set) => (
          <FormField>
            <Label htmlFor="household-name">Household name</Label>
            <Input
              id="household-name"
              value={values.name}
              onChange={(event) => set("name", event.target.value)}
              maxLength={100}
            />
          </FormField>
        )}
      </SectionForm>
    </SettingsSection>
  );
}
