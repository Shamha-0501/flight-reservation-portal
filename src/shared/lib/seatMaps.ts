export type DuffelSeatMapResponse = {
  data?: DuffelSeatMap[];
};

export type DuffelSeatMap = {
  seat_map_id?: string;
  id?: string;
  slice_id?: string;
  segment_id?: string;
  cabins?: DuffelSeatCabin[];
  [key: string]: unknown;
};

export type DuffelSeatCabin = {
  cabin_class?: string;
  rows?: DuffelSeatRow[];
  [key: string]: unknown;
};

export type DuffelSeatRow = {
  number?: string | number;
  row?: string | number;
  designator?: string | number;
  label?: string;
  name?: string;
  sections?: DuffelSeatSection[];
  [key: string]: unknown;
};

export type DuffelSeatSection = {
  elements?: DuffelSeatElement[];
  [key: string]: unknown;
};

export type DuffelSeatElement = {
  type?: string;
  designator?: string;
  available_services?: DuffelSeatService[];
  disclosures?: unknown;
  [key: string]: unknown;
};

export type DuffelSeatService = {
  id?: string;
  passenger_id?: string;
  total_amount?: string | number | null;
  total_currency?: string | null;
  [key: string]: unknown;
};

export type SeatServiceSelection = {
  passengerId: string;
  segmentId: string;
  serviceId: string;
  seatDesignator: string;
  amount: number;
  currency: string;
  sliceId?: string | null;
  cabinClass?: string | null;
  disclosures: string[];
};

export type SeatCellView = {
  passengerId: string | null;
  segmentId: string;
  serviceId: string | null;
  seatDesignator: string;
  amount: number;
  currency: string;
  sliceId?: string | null;
  cabinClass?: string | null;
  disclosures: string[];
  rowLabel: string;
  sectionIndex: number;
  elementIndex: number;
  selectable: boolean;
};

export type SeatRowView = {
  rowLabel: string;
  sections: SeatSectionView[];
};

export type SeatSectionView = {
  cells: SeatCellView[];
  markers: SeatSectionMarkerView[];
};

export type SeatSectionMarkerView = {
  type: string;
  label: string;
};

export type SeatCabinView = {
  cabinClass: string | null;
  rows: SeatRowView[];
};

export type SeatSegmentView = {
  sliceId: string | null;
  segmentId: string;
  cabins: SeatCabinView[];
};

export function normalizeSeatMaps(
  payload: DuffelSeatMapResponse | null | undefined
): SeatSegmentView[] {
  const seatMaps = Array.isArray(payload?.data) ? payload.data : [];
  const segments: SeatSegmentView[] = [];

  for (const seatMap of seatMaps) {
    if (!seatMap || typeof seatMap !== "object") continue;

    const segmentId = toStringOrNull(seatMap.segment_id);
    if (!segmentId) continue;

    const cabins = Array.isArray(seatMap.cabins) ? seatMap.cabins : [];
    const normalizedCabins: SeatCabinView[] = [];

    for (const cabin of cabins) {
      if (!cabin || typeof cabin !== "object") continue;

      const rows = Array.isArray(cabin.rows) ? cabin.rows : [];
      const normalizedRows = rows
        .map((row, rowIndex) =>
          normalizeSeatRow(
            row,
            rowIndex,
            segmentId,
            cabin.cabin_class,
            seatMap.slice_id
          )
        )
        .filter((row): row is SeatRowView => Boolean(row));

      normalizedCabins.push({
        cabinClass: toStringOrNull(cabin.cabin_class),
        rows: normalizedRows,
      });
    }

    segments.push({
      sliceId: toStringOrNull(seatMap.slice_id),
      segmentId,
      cabins: normalizedCabins,
    });
  }

  return segments;
}

function normalizeSeatRow(
  row: DuffelSeatRow | undefined,
  rowIndex: number,
  segmentId: string,
  cabinClass: string | undefined,
  sliceId: string | undefined
): SeatRowView | null {
  if (!row || typeof row !== "object") return null;

  const sections = Array.isArray(row.sections) ? row.sections : [];
  const fallbackRowLabel = resolveRowLabel(row, rowIndex);

  const normalizedSections: SeatSectionView[] = sections.map(
    (section, sectionIndex) => {
      const elements = Array.isArray(section?.elements) ? section.elements : [];
      const cells: SeatCellView[] = [];
      const markers: SeatSectionMarkerView[] = [];

      elements.forEach((element, elementIndex) => {
        if (!element || typeof element !== "object") return;

        const elementType = toStringOrNull(element.type);

        if (elementType !== "seat") {
          const markerLabel = humanizeSeatElementLabel(
            elementType,
            element.designator
          );

          if (markerLabel && elementType !== "empty") {
            markers.push({
              type: elementType ?? "unknown",
              label: markerLabel,
            });
          }

          return;
        }

        const designator = toStringOrNull(element.designator);
        if (!designator) return;

        const availableServices = Array.isArray(element.available_services)
          ? element.available_services
          : [];

        if (!availableServices.length) {
          cells.push({
            passengerId: null,
            segmentId,
            serviceId: null,
            seatDesignator: designator,
            amount: 0,
            currency: "USD",
            sliceId: toStringOrNull(sliceId),
            cabinClass: toStringOrNull(cabinClass),
            disclosures: toStringArray(element.disclosures),
            rowLabel: fallbackRowLabel,
            sectionIndex,
            elementIndex,
            selectable: false,
          });

          return;
        }

        availableServices.forEach((service) => {
          const serviceId = toStringOrNull(service?.id);
          const passengerId = toStringOrNull(service?.passenger_id);

          cells.push({
            passengerId,
            segmentId,
            serviceId,
            seatDesignator: designator,
            amount: toNumber(service?.total_amount),
            currency: normalizeCurrency(service?.total_currency),
            sliceId: toStringOrNull(sliceId),
            cabinClass: toStringOrNull(cabinClass),
            disclosures: toStringArray(element.disclosures),
            rowLabel: fallbackRowLabel,
            sectionIndex,
            elementIndex,
            selectable: Boolean(serviceId && passengerId),
          });
        });
      });

      return { cells, markers };
    }
  );

  const firstSeat = normalizedSections
    .flatMap((section) => section.cells)
    .find((cell) => cell.seatDesignator);

  return {
    rowLabel: firstSeat
      ? `Row ${extractSeatRowNumber(firstSeat.seatDesignator) ?? rowIndex + 1}`
      : fallbackRowLabel,
    sections: normalizedSections,
  };
}

export function extractSelectedSeatServices(
  selections: SeatServiceSelection[]
): Array<{ id: string; quantity: 1 }> {
  return selections.map((selection) => ({
    id: selection.serviceId,
    quantity: 1 as const,
  }));
}

function resolveRowLabel(row: DuffelSeatRow, rowIndex: number) {
  const candidates = [row.number, row.row, row.designator, row.label, row.name];

  for (const candidate of candidates) {
    const value = toStringOrNull(candidate);
    if (value) return value;
  }

  return `Row ${rowIndex + 1}`;
}

function extractSeatRowNumber(designator: string) {
  const match = designator.trim().match(/^(\d+)/);
  return match?.[1] ?? null;
}

function humanizeSeatElementLabel(type: string | null, designator: unknown) {
  const normalizedType = (type ?? "").toLowerCase();
  const designatorLabel = toStringOrNull(designator);

  const knownLabels: Record<string, string> = {
    empty: "",
    lavatory: "Lavatory",
    toilet: "Lavatory",
    galley: "Galley",
    bassinet: "Bassinet",
    exit_row: "Exit row",
    exitrow: "Exit row",
    exit: "Exit row",
    stairs: "Stairs",
    closet: "Closet",
    wall: "Wall",
    separator: "Aisle",
    aisle: "Aisle",
    exit_seat: "Exit row",
  };

  if (knownLabels[normalizedType] !== undefined) {
    return knownLabels[normalizedType] || null;
  }

  if (designatorLabel) return designatorLabel;
  if (!normalizedType) return null;

  return normalizedType
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => toStringOrNull(item))
    .filter((item): item is string => Boolean(item));
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  return 0;
}

function normalizeCurrency(value: unknown) {
  const currency = toStringOrNull(value);
  return currency ? currency.toUpperCase() : "USD";
}