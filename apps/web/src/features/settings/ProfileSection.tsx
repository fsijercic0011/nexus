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

export function ProfileSection({ me }: { me: Me }) {
  return (
    <SettingsSection title="Profile">
      <SectionForm
        queryKey={ME_QUERY_KEY}
        initial={{ name: me.user.name }}
        editable
        valid={(values) => nameSchema.safeParse(values.name).success}
        save={(values) =>
          sendJson("PATCH", "/api/me/profile", values, nameResponse, {
            idempotencyKey: uuidv7(),
          })
        }
      >
        {(values, set) => (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField>
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={values.name}
                onChange={(event) => set("name", event.target.value)}
                maxLength={100}
                autoComplete="name"
              />
            </FormField>
            <FormField>
              <span className="text-sm font-medium">Email</span>
              <p className="truncate text-sm" title={me.user.email}>
                {me.user.email}
              </p>
              <p className="text-xs text-muted-foreground">
                Changing your email needs email delivery, which isn't set up
                yet.
              </p>
            </FormField>
          </div>
        )}
      </SectionForm>
    </SettingsSection>
  );
}
