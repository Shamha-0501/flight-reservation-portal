"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  normalizeSeatMaps,
  type DuffelSeatMapResponse,
  type SeatCabinView,
  type SeatCellView,
  type SeatRowView,
  type SeatSectionMarkerView,
  type SeatSectionView,
  type SeatServiceSelection,
} from "@/src/shared/lib/seatMaps";

type TravellerOption = {
  id: string;
  label: string;
  type: "ADULT" | "CHILD" | "INFANT";
  note?: string;
};

type SeatMapBrowserProps = {
  travellers: TravellerOption[];
  seatMaps?: DuffelSeatMapResponse | null;
  seatMapStatus?: string;
  loading?: boolean;
  error?: string | null;
  selectedSeatServices: SeatServiceSelection[];
  onSelectionChange: (selection: SeatServiceSelection[]) => void;
};

type CabinLayout = {
  cabinClass: string | null;
  rows: RowLayout[];
  sectionLabels: string[][];
};

type RowLayout = {
  rowLabel: string;
  sections: SectionLayout[];
};

type SectionLayout = {
  labels: string[];
  cellsByLabel: Map<string, SeatCellView[]>;
  markers: SeatSectionMarkerView[];
};

export default function SeatMapBrowser({
  travellers,
  seatMaps,
  seatMapStatus,
  loading = false,
  error = null,
  selectedSeatServices,
  onSelectionChange,
}: SeatMapBrowserProps) {
  const seatSegments = useMemo(() => normalizeSeatMaps(seatMaps), [seatMaps]);

  const eligibleTravellers = useMemo(
    () => travellers.filter((traveller) => traveller.type !== "INFANT"),
    [travellers]
  );

  const [activeTravellerId, setActiveTravellerId] = useState(
    eligibleTravellers[0]?.id ?? ""
  );

  const [activeSegmentId, setActiveSegmentId] = useState(
    seatSegments[0]?.segmentId ?? ""
  );

  useEffect(() => {
    if (!eligibleTravellers.length) {
      setActiveTravellerId("");
      return;
    }

    setActiveTravellerId((current) =>
      eligibleTravellers.some((traveller) => traveller.id === current)
        ? current
        : eligibleTravellers[0].id
    );
  }, [eligibleTravellers]);

  useEffect(() => {
    if (!seatSegments.length) {
      setActiveSegmentId("");
      return;
    }

    setActiveSegmentId((current) =>
      seatSegments.some((segment) => segment.segmentId === current)
        ? current
        : seatSegments[0].segmentId
    );
  }, [seatSegments]);

  const activeTraveller = eligibleTravellers.find(
    (traveller) => traveller.id === activeTravellerId
  );

  const activeSegment = seatSegments.find(
    (segment) => segment.segmentId === activeSegmentId
  );

  const seatSelectionMode = useMemo(() => {
    if (seatMapStatus === "available") {
      return {
        label: "Available",
        tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
        message: "Seat selection is available for this offer.",
        locked: false,
      };
    }

    if (seatMapStatus === "view_only") {
      return {
        label: "View only",
        tone: "border-amber-200 bg-amber-50 text-amber-700",
        message:
          "A seat map is available, but seat purchase is not allowed for this offer.",
        locked: true,
      };
    }

    return {
      label: "Unavailable",
      tone: "border-slate-200 bg-slate-50 text-slate-600",
      message: "Seat selection is not available for this offer.",
      locked: true,
    };
  }, [seatMapStatus]);

  const selectedForActiveTraveller = useMemo(
    () =>
      selectedSeatServices.filter(
        (selection) => selection.passengerId === activeTravellerId
      ),
    [activeTravellerId, selectedSeatServices]
  );

  const totalSeatAmount = useMemo(
    () =>
      selectedSeatServices.reduce(
        (total, selection) => total + selection.amount,
        0
      ),
    [selectedSeatServices]
  );

  const totalCurrency = selectedSeatServices[0]?.currency ?? "USD";
  const canSelectSeats = !seatSelectionMode.locked && Boolean(activeTravellerId);
  const hasMultipleSegments = seatSegments.length > 1;

  const cabinLayouts = useMemo(
    () => activeSegment?.cabins.map(buildCabinLayout) ?? [],
    [activeSegment]
  );

  const handleSeatSelect = (cell: SeatCellView) => {
    if (
      !canSelectSeats ||
      !activeTravellerId ||
      !cell.selectable ||
      !cell.serviceId ||
      !cell.passengerId
    ) {
      return;
    }

    const nextSelection: SeatServiceSelection = {
      passengerId: activeTravellerId,
      segmentId: cell.segmentId,
      serviceId: cell.serviceId,
      seatDesignator: cell.seatDesignator,
      amount: cell.amount,
      currency: cell.currency,
      sliceId: cell.sliceId,
      cabinClass: cell.cabinClass,
      disclosures: cell.disclosures,
    };

    const isDeselecting = selectedSeatServices.some(
      (selection) =>
        selection.passengerId === activeTravellerId &&
        selection.segmentId === cell.segmentId &&
        selection.serviceId === cell.serviceId
    );

    if (isDeselecting) {
      onSelectionChange(
        selectedSeatServices.filter(
          (selection) =>
            !(
              selection.passengerId === activeTravellerId &&
              selection.segmentId === cell.segmentId &&
              selection.serviceId === cell.serviceId
            )
        )
      );
      return;
    }

    onSelectionChange([
      ...selectedSeatServices.filter(
        (selection) =>
          !(
            selection.passengerId === activeTravellerId &&
            selection.segmentId === cell.segmentId
          )
      ),
      nextSelection,
    ]);
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3">
          <div className="h-3 w-24 rounded-full bg-slate-200" />
          <div className="mt-2 h-4 w-52 rounded-full bg-slate-200" />
          <div className="mt-2 h-3 w-full max-w-md rounded-full bg-slate-100" />
        </div>

        <div className="grid min-h-0 flex-1 gap-3 overflow-hidden px-3 py-3 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-3">
            <div className="h-20 rounded-2xl bg-slate-100" />
            <div className="h-[420px] rounded-3xl border border-slate-200 bg-slate-50" />
          </div>

          <div className="space-y-3">
            <div className="h-56 rounded-3xl border border-slate-200 bg-slate-50" />
            <div className="h-32 rounded-3xl border border-blue-100 bg-blue-50" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (!seatSegments.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-600">
        No seat map data was returned for this offer.
      </div>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
              Seat map
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Seat availability and prices are provided by the airline/provider and
              may change before booking confirmation.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={[
                "inline-flex rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]",
                seatSelectionMode.tone,
              ].join(" ")}
            >
              {seatSelectionMode.label}
            </span>

            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              {activeTraveller?.label ?? "Select traveller"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden px-3 py-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-h-0 flex-col gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-950">
                  {seatSelectionMode.message}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {canSelectSeats
                    ? "Select a traveller and choose an available seat."
                    : "You can review the layout, but seat selection is disabled."}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <LegendBadge
                  tone="border-blue-600 bg-blue-600 text-white"
                  label="Selected"
                />
                <LegendBadge
                  tone="border-slate-200 bg-white text-slate-700"
                  label="Available"
                />
                <LegendBadge
                  tone="border-slate-200 bg-slate-100 text-slate-500"
                  label="Unavailable"
                />
                <LegendBadge
                  tone="border-amber-200 bg-amber-50 text-amber-700"
                  label="Rule"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {eligibleTravellers.map((traveller) => {
                const isActive = traveller.id === activeTravellerId;

                return (
                  <button
                    key={traveller.id}
                    type="button"
                    onClick={() => setActiveTravellerId(traveller.id)}
                    className={[
                      "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
                      isActive
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {traveller.label}
                  </button>
                );
              })}

              {hasMultipleSegments
                ? seatSegments.map((segment, index) => (
                    <button
                      key={segment.segmentId}
                      type="button"
                      onClick={() => setActiveSegmentId(segment.segmentId)}
                      className={[
                        "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
                        segment.segmentId === activeSegmentId
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      Journey {index + 1}
                    </button>
                  ))
                : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto pr-1">
            <div className="space-y-3">
              {cabinLayouts.map((cabin, cabinIndex) => (
                <CabinCard
                  key={`${activeSegment?.segmentId ?? "segment"}:${
                    cabin.cabinClass ?? cabinIndex
                  }`}
                  cabin={cabin}
                  activeTravellerId={activeTravellerId}
                  activeTravellerLabel={activeTraveller?.label ?? ""}
                  selectedSeatServices={selectedSeatServices}
                  canSelectSeats={canSelectSeats}
                  onSeatSelect={handleSeatSelect}
                />
              ))}
            </div>
          </div>
        </div>

        <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 lg:sticky lg:top-0">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Selected seats
            </div>

            <div className="mt-3 space-y-3">
              {eligibleTravellers.map((traveller) => {
                const travellerSelections = selectedSeatServices.filter(
                  (selection) => selection.passengerId === traveller.id
                );

                return (
                  <div
                    key={traveller.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="text-sm font-semibold text-slate-950">
                      {traveller.label}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {traveller.note ?? "Seat selection"}
                    </div>

                    {travellerSelections.length ? (
                      <div className="mt-3 space-y-2">
                        {travellerSelections.map((selection) => {
                          const journeyIndex = getJourneyIndex(
                            seatSegments,
                            selection.segmentId
                          );

                          return (
                            <div
                              key={`${selection.passengerId}:${selection.segmentId}:${selection.serviceId}`}
                              className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"
                            >
                              <div className="font-semibold text-slate-950">
                                Journey {journeyIndex + 1}:{" "}
                                {selection.seatDesignator}
                              </div>

                              <div className="mt-0.5 text-xs text-slate-500">
                                {selection.cabinClass
                                  ? `${selection.cabinClass} · `
                                  : ""}
                                {selection.amount > 0
                                  ? `+ ${formatMoney(
                                      selection.amount,
                                      selection.currency
                                    )}`
                                  : "Included"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                        No seat selected yet.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
              Seat total
            </div>

            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {totalSeatAmount > 0
                ? formatMoney(totalSeatAmount, totalCurrency)
                : "Included"}
            </div>

            <div className="mt-1 text-sm text-slate-600">
              {selectedForActiveTraveller.length
                ? `Current traveller has ${
                    selectedForActiveTraveller.length
                  } selected seat${
                    selectedForActiveTraveller.length === 1 ? "" : "s"
                  }.`
                : "Seat selection is optional for this offer."}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function CabinCard({
  cabin,
  activeTravellerId,
  activeTravellerLabel,
  selectedSeatServices,
  canSelectSeats,
  onSeatSelect,
}: {
  cabin: CabinLayout;
  activeTravellerId: string;
  activeTravellerLabel: string;
  selectedSeatServices: SeatServiceSelection[];
  canSelectSeats: boolean;
  onSeatSelect: (cell: SeatCellView) => void;
}) {
  return (
    <section className="min-h-0 overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50/80 px-3 py-2">
        <div className="text-sm font-semibold capitalize text-slate-900">
          {cabin.cabinClass ?? "Cabin"}
        </div>

        <div className="mt-0.5 text-xs text-slate-500">
          {activeTravellerLabel
            ? `Showing seats for ${activeTravellerLabel}`
            : "Select a traveller to continue"}
        </div>
      </div>

      <div className="overflow-auto p-3">
        <div className="min-w-max space-y-2">
          <div className="flex items-center gap-8 pl-[72px]">
            {cabin.sectionLabels.map((labels, sectionIndex) => (
              <div
                key={`header:${sectionIndex}`}
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(
                    labels.length,
                    1
                  )}, 52px)`,
                }}
              >
                {labels.length ? (
                  labels.map((label) => (
                    <div
                      key={label}
                      className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400"
                    >
                      {label}
                    </div>
                  ))
                ) : (
                  <div />
                )}
              </div>
            ))}
          </div>

          {cabin.rows.map((row, rowIndex) => (
            <div
              key={row.rowLabel}
              className="flex items-center gap-8 rounded-2xl px-1.5 py-1 hover:bg-slate-50"
            >
              <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                {row.rowLabel}
              </div>

              {row.sections.map((section, sectionIndex) => (
                <div
                  key={`${row.rowLabel}:${sectionIndex}`}
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(
                      section.labels.length,
                      1
                    )}, 52px)`,
                  }}
                >
                  {section.labels.length ? (
                    section.labels.map((label, colIndex) => {
                      const matchingCells =
                        section.cellsByLabel.get(label) ?? [];

                      const activeCell =
                        matchingCells.find(
                          (cell) => cell.passengerId === activeTravellerId
                        ) ??
                        matchingCells[0] ??
                        null;

                      const isSelected = Boolean(
                        activeCell?.serviceId &&
                          selectedSeatServices.some(
                            (selection) =>
                              selection.passengerId === activeTravellerId &&
                              selection.segmentId === activeCell.segmentId &&
                              selection.serviceId === activeCell.serviceId
                          )
                      );

                      if (!activeCell) {
                        return (
                          <div
                            key={`${row.rowLabel}:${sectionIndex}:${label}`}
                            className="h-[52px] w-[52px] rounded-xl border border-dashed border-slate-200 bg-slate-50"
                            aria-hidden="true"
                          />
                        );
                      }

                      if (
                        !activeCell.selectable ||
                        !activeCell.serviceId ||
                        activeCell.passengerId !== activeTravellerId
                      ) {
                        return (
                          <UnavailableSeatCell
                            key={`${row.rowLabel}:${sectionIndex}:${label}`}
                            seatLabel={activeCell.seatDesignator}
                            amount={activeCell.amount}
                            currency={activeCell.currency}
                          />
                        );
                      }

                      return (
                        <SeatButton
                          key={`${row.rowLabel}:${sectionIndex}:${label}`}
                          cell={activeCell}
                          selected={isSelected}
                          disabled={!canSelectSeats}
                          rowIndex={rowIndex}
                          sectionIndex={sectionIndex}
                          colIndex={colIndex}
                          totalRows={cabin.rows.length}
                          onRequestFocus={handleGridNavigation}
                          onClick={() => onSeatSelect(activeCell)}
                        />
                      );
                    })
                  ) : (
                    <MarkerBlock markers={section.markers} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SeatButton({
  cell,
  selected,
  disabled,
  rowIndex,
  sectionIndex,
  colIndex,
  totalRows,
  onRequestFocus,
  onClick,
}: {
  cell: SeatCellView;
  selected: boolean;
  disabled: boolean;
  rowIndex: number;
  sectionIndex: number;
  colIndex: number;
  totalRows: number;
  onRequestFocus: (
    direction: "left" | "right" | "up" | "down",
    rowIndex: number,
    sectionIndex: number,
    colIndex: number,
    totalRows: number
  ) => void;
  onClick: () => void;
}) {
  const hasRule = cell.disclosures.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onRequestFocus("left", rowIndex, sectionIndex, colIndex, totalRows);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          onRequestFocus("right", rowIndex, sectionIndex, colIndex, totalRows);
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          onRequestFocus("up", rowIndex, sectionIndex, colIndex, totalRows);
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          onRequestFocus("down", rowIndex, sectionIndex, colIndex, totalRows);
        }
      }}
      disabled={disabled}
      title={cell.disclosures.join(", ") || cell.seatDesignator}
      data-seat-cell="true"
      data-seat-row={rowIndex}
      data-seat-section={sectionIndex}
      data-seat-col={colIndex}
      className={[
        "relative flex h-[52px] w-[52px] flex-col items-center justify-center rounded-xl border text-center text-xs transition",
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          : selected
            ? "border-blue-600 bg-blue-600 text-white shadow-sm"
            : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50",
      ].join(" ")}
      aria-pressed={selected}
    >
      {hasRule ? (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
      ) : null}

      <span className="font-bold leading-none">{cell.seatDesignator}</span>

      <span
        className={[
          "mt-1 text-[9px]",
          selected ? "text-blue-100" : "text-slate-500",
        ].join(" ")}
      >
        {cell.amount > 0
          ? formatCompactMoney(cell.amount, cell.currency)
          : "Included"}
      </span>
    </button>
  );
}

function UnavailableSeatCell({
  seatLabel,
  amount,
  currency,
}: {
  seatLabel: string;
  amount: number;
  currency: string;
}) {
  return (
    <div
      title="Unavailable"
      data-seat-cell="true"
      className="flex h-[52px] w-[52px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-center text-xs text-slate-400"
    >
      <span className="font-bold leading-none">{seatLabel}</span>
      <span className="mt-1 text-[9px]">
        {amount > 0 ? formatCompactMoney(amount, currency) : "N/A"}
      </span>
    </div>
  );
}

function MarkerBlock({ markers }: { markers: SeatSectionMarkerView[] }) {
  if (!markers.length) {
    return <div className="h-[52px] w-[52px]" />;
  }

  const label = markers
    .map((marker) => shortMarkerLabel(marker.label))
    .join(" / ");

  return (
    <div className="flex h-[52px] min-w-[52px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
      {label}
    </div>
  );
}

function LegendBadge({ tone, label }: { tone: string; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}
    >
      {label}
    </span>
  );
}

function buildCabinLayout(cabin: SeatCabinView): CabinLayout {
  const sectionLabels = deriveSectionLabels(cabin.rows);

  return {
    cabinClass: cabin.cabinClass,
    sectionLabels,
    rows: cabin.rows.map((row) => buildRowLayout(row, sectionLabels)),
  };
}

function buildRowLayout(
  row: SeatRowView,
  sectionLabels: string[][]
): RowLayout {
  return {
    rowLabel: row.rowLabel,
    sections: row.sections.map((section, index) =>
      buildSectionLayout(section, sectionLabels[index] ?? [])
    ),
  };
}

function buildSectionLayout(
  section: SeatSectionView,
  preferredLabels: string[]
): SectionLayout {
  const cellsByLabel = new Map<string, SeatCellView[]>();

  for (const cell of section.cells) {
    const label = deriveSeatColumnLabel(cell.seatDesignator);

    if (!cellsByLabel.has(label)) {
      cellsByLabel.set(label, []);
    }

    cellsByLabel.get(label)!.push(cell);
  }

  const labels = preferredLabels.length
    ? preferredLabels
    : Array.from(cellsByLabel.keys());

  return {
    labels,
    cellsByLabel,
    markers: section.markers,
  };
}

function handleGridNavigation(
  direction: "left" | "right" | "up" | "down",
  rowIndex: number,
  sectionIndex: number,
  colIndex: number,
  totalRows: number
) {
  let nextRow = rowIndex;
  let nextCol = colIndex;

  if (direction === "left") nextCol -= 1;
  if (direction === "right") nextCol += 1;
  if (direction === "up") nextRow -= 1;
  if (direction === "down") nextRow += 1;

  if (nextRow < 0 || nextRow >= totalRows) return;

  const selector = `[data-seat-cell="true"][data-seat-row="${nextRow}"][data-seat-section="${sectionIndex}"][data-seat-col="${nextCol}"]`;
  const target = document.querySelector<HTMLElement>(selector);

  target?.focus();
}

function deriveSectionLabels(rows: SeatRowView[]) {
  const firstSeatRow = rows.find((row) =>
    row.sections.some((section) => section.cells.length > 0)
  );

  if (!firstSeatRow) {
    return (
      rows[0]?.sections.map((section) => deriveLabelsFromSection(section)) ?? []
    );
  }

  return firstSeatRow.sections.map((section) =>
    deriveLabelsFromSection(section)
  );
}

function deriveLabelsFromSection(section: SeatSectionView) {
  const labels: string[] = [];

  for (const cell of section.cells) {
    const label = deriveSeatColumnLabel(cell.seatDesignator);

    if (!labels.includes(label)) {
      labels.push(label);
    }
  }

  return labels;
}

function deriveSeatColumnLabel(seatDesignator: string) {
  const trimmed = seatDesignator.trim();
  const match = trimmed.match(/^\d+\s*([A-Za-z].*)$/);

  if (match?.[1]) {
    return match[1].trim();
  }

  return trimmed;
}

function shortMarkerLabel(label: string) {
  const lower = label.toLowerCase();

  if (lower.includes("lavatory")) return "WC";
  if (lower.includes("galley")) return "Galley";
  if (lower.includes("bassinet")) return "Bassinet";
  if (lower.includes("exit")) return "Exit";

  return label;
}

function getJourneyIndex(
  seatSegments: Array<{ segmentId: string }>,
  segmentId: string
) {
  const index = seatSegments.findIndex(
    (segment) => segment.segmentId === segmentId
  );

  return index >= 0 ? index : 0;
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatCompactMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
