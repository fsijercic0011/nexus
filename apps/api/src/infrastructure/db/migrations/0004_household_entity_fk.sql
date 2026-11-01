-- A household and a property are entities: their id is also their row in
-- "entities". households <-> entities reference each other, so the check is
-- deferred to the end of the transaction that creates both.
ALTER TABLE "households" ADD CONSTRAINT "households_id_entities_id_fk" FOREIGN KEY ("id") REFERENCES "public"."entities"("id") ON DELETE cascade DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_id_entities_id_fk" FOREIGN KEY ("id") REFERENCES "public"."entities"("id") ON DELETE cascade DEFERRABLE INITIALLY DEFERRED;
