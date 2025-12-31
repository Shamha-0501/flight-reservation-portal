import { ModelSeeder } from "@/forge/database/seeder/modelSeeder";
import {
  fromArray,
  fromCsv,
  fromCsvDir,
} from "@/forge/database/seeder/dataSource";
import { Resource, ResourceAttr } from "@/src/http/models/Resource";

type ResourceInput = Omit<ResourceAttr, "id">;

export class ResourceSeeder extends ModelSeeder<ResourceInput> {
    name = "ResourceSeeder";
    model = Resource;

    source = fromArray<ResourceInput>([
        {key: "*", description: "All resources"},
        {key: "action", description: "What operation is resource"},
        {key: "resource", description: "What being accessed resource"},
        {key: "policy", description: "Policy rule resource"},
        {key: "policySubject", description: "Who the policy apply to resource"},
        {key: "policyContext", description: "Dynamic rules resource"},
        {key: "userRole", description: "Role maped User resource"},
        {key: "role", description: "Role information resource"},
        {key: "user", description: "User information resource"},
        {key: "userProfile", description: "User personal information resource"},
        {key: "session", description: "Logged user information resource"},
        {key: "countryRegion", description: "Country region resource"},
        {key: "countrySubRegion", description: "Country sub region resource"},
        {key: "country", description: "Country resource"},
        {key: "province", description: "Country resource"},
        {key: "district", description: "Country resource"},
        {key: "city", description: "Country resource"},
        {key: "country", description: "Country resource"},
    ]);

    mapRow(row: any): ResourceInput {
        return {
            key: row.key,
            description: row.description
        };
    };

    upsert = {
        uniqueBy: ['key'],
        update: ['description']
    };

    chunkSize = 500;
}