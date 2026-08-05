CREATE TABLE "veritie_job_leases" (
	"job_id" text PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "veritie_job_leases" ADD CONSTRAINT "veritie_job_leases_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "veritie_job_leases" ADD CONSTRAINT "veritie_job_leases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "veritie_job_leases_account_id_idx" ON "veritie_job_leases" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "captures_account_veritie_job_uidx" ON "captures" USING btree ("account_id","veritie_job_id") WHERE "captures"."veritie_job_id" IS NOT NULL;