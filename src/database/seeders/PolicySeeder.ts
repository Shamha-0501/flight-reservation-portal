import { ModelSeeder } from "@/forge/database/seeder/modelSeeder";
import {
  fromArray,
  fromCsv,
  fromCsvDir,
} from "@/forge/database/seeder/dataSource";
import { Policy, PolicyAttr } from "@/src/http/models/Policy";
import { Resource } from "@/src/http/models/Resource";
import { Action } from "@/src/http/models/Action";

type PolicyInput = Omit<PolicyAttr, "id">;

export class PolicySeeder extends ModelSeeder<PolicyInput> {
    name = 'PolicySeeder';
    model = Policy;

    source = fromArray<PolicyInput>([]);

    async run() {
        const resources = await (Resource as any)
            .query()
            .get();
            
        const actions = await (Action as any)
            .query()
            .get();

        const policies: PolicyInput[] = [];

        for (const resource of resources) {
            for (const action of actions) {
                policies.push({
                    name: `${resource.key}:${action.key}`,
                    effect: 'allow',
                    priority: 10,
                    resource_id: resource.id,
                    action_id: action.id,
                    condition: "{}",
                    enabled: true
                });
            }
        }

        this.source = fromArray<PolicyInput>(policies);

        await super.run();
    }

    mapRow(row: any): PolicyInput {
        return {
            name: row.name,
            effect: row.effect,
            priority: row.priority,
            resource_id: row.resource_id,
            action_id: row.action_id,
            condition: row.condition,
            enabled: row.enabled
        };
    }

    upsert = {
        uniqueBy: ['resource_id', 'action_id'],
        update: ['name', 'effect', 'priority', 'condition', 'enabled']
    };

    chunkSize = 500;
}