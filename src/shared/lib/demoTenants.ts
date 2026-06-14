export type DemoTenant = {
  key: string;
  legacyId: string;
  name: string;
  rating: number;
  ticketCount: number;
  serviceFee: number;
};

export const DEMO_TENANTS: DemoTenant[] = [
  {
    key: "40880326-2ff7-443a-aca5-f9c44d11b7b8",
    legacyId: "agent-aurora",
    name: "SkyWay Travels",
    rating: 4.8,
    ticketCount: 1240,
    serviceFee: 8,
  },
  {
    key: "e7f2ece2-5d0a-4ba5-bc74-ae0d576aeb73",
    legacyId: "agent-skyline",
    name: "AeroLink Agents",
    rating: 4.6,
    ticketCount: 980,
    serviceFee: 6,
  },
  {
    key: "3227749b-3b9f-4319-9f50-a024546d3587",
    legacyId: "agent-mytrip",
    name: "Global Wings Agency",
    rating: 4.7,
    ticketCount: 383,
    serviceFee: 9,
  },
];

export const DEFAULT_DEMO_TENANT_KEY = DEMO_TENANTS[0].key;

export function resolveTenantKey(value?: string | null) {
  if (!value) return DEFAULT_DEMO_TENANT_KEY;

  return (
    DEMO_TENANTS.find(
      (tenant) => tenant.key === value || tenant.legacyId === value
    )?.key ?? value
  );
}

export function getDemoTenantByKey(key?: string | null) {
  const resolvedKey = resolveTenantKey(key);
  return DEMO_TENANTS.find((tenant) => tenant.key === resolvedKey);
}
