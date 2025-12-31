import { ModelSeeder } from "@/forge/database/seeder/modelSeeder";
import {
  fromArray,
  fromCsv,
  fromCsvDir,
} from "@/forge/database/seeder/dataSource";
import { PolicySubject, PolicySubjectAttr } from "@/src/http/models/PolicySubject";
import { Role } from "@/src/http/models/Role";
import { Policy } from "@/src/http/models/Policy";

type PolicySubjectInput = Omit<PolicySubjectAttr, "id">;

export class PolicySubjectSeeder extends ModelSeeder<PolicySubjectInput> {
    name = 'PolicySubjectSeeder';
    model = PolicySubject;

    source = fromArray<PolicySubjectInput>([]);

    async run() {
        const roles = await (Role as any)
            .query()
            .whereIn('role_key', ['super_admin', 'user'])
            .get()

        const roleByKey = new Map(roles.map((r: any) => [r.role_key, r]));
        
        const policies: any[] = await (Policy as any)
            .query()
            .get();

        const policyByName = new Map(policies.map((p: any) => [p.name, p]));

        // Define subject (Which policy belongs to which subject)
        const subjectDefs: {
            subject_type: string;
            subject_value: string;
            policyNames: string[];
        }[] = [
            {
                subject_type: "role",
                subject_value: "super_admin",
                policyNames: ["*:*"]
            },
            {
                subject_type: "role",
                subject_value: "user",
                policyNames: ["user:view", "user:update", "user:softDelete"]
            }
        ]

        const rows: PolicySubjectInput[] = [];

        for (const def of subjectDefs) {
            const role = roleByKey.get(def.subject_value);
            if (!role) {
                console.warn(`Role ${def.subject_value} not found - skipping it's policies.`);
                continue;
            }

            for (const policyName of def.policyNames) {
                const policy = policyByName.get(policyName);
                if (!policy) {
                    console.warn(`Policy ${policyName} not found - skipping.`);
                    continue;
                }

                rows.push({
                    policy_id: policy.id,
                    subject_type: def.subject_type,
                    subject_value: def.subject_value
                });
            }
        }

        this.source = fromArray<PolicySubjectInput>(rows);

        await super.run();
    }

    mapRow(row: any): PolicySubjectInput {
        return {
            policy_id: row.policy_id,
            subject_type: row.subject_type,
            subject_value: row.subject_value
        };
    };

    upsert = {
        uniqueBy: ['policy_id'],
        update: ['subject_type', 'subject_value']
    };

    chunkSize = 500;
}