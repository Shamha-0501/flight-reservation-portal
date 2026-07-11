export type AirportOption = {
  name: string;
  subType: "AIRPORT" | "CITY";
  iataCode: string;
  address?: {
    cityName?: string;
    cityCode?: string;
    countryName?: string;
  };
};

export type DuffelPlace = {
  id?: string;
  type?: string;
  name?: string;
  iata_code?: string;
  city_name?: string;
  iata_city_code?: string;
  iata_country_code?: string;
  city?: {
    name?: string;
    iata_code?: string;
  };
  country?: {
    name?: string;
  };
};

export function toTitleCase(s: string) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatLocationLabel(v: AirportOption) {
  const code = v.iataCode || v.address?.cityCode || "";
  const city = v.address?.cityName ? toTitleCase(v.address.cityName) : "";
  const name = v.name ? toTitleCase(v.name) : "";

  if (v.subType === "AIRPORT") {
    return `${city ? city + " " : ""}${name} (${code})`.trim();
  }

  return `${city || name} (${code})`.trim();
}

export function extractIataCode(value: string) {
  const match = value.match(/\(([A-Z0-9]{3})\)/i);
  if (match?.[1]) return match[1].toUpperCase();
  if (/^[A-Z0-9]{3}$/i.test(value.trim())) return value.trim().toUpperCase();
  return "";
}

export function mapPlaceToAirportOption(
  place: DuffelPlace
): AirportOption | null {
  // The search UI and flight search flow rely on IATA codes as stable IDs.
  const iataCode = place.iata_code?.trim().toUpperCase();

  if (!iataCode) return null;

  return {
    name: place.name?.trim() || iataCode,
    // Normalize Duffel's provider-specific shape into the shared UI model.
    subType: place.type === "airport" ? "AIRPORT" : "CITY",
    iataCode,
    address: {
      cityName: place.city_name?.trim() || place.city?.name?.trim() || "",
      cityCode:
        place.iata_city_code?.trim().toUpperCase() ||
        place.city?.iata_code?.trim().toUpperCase() ||
        "",
      countryName:
        place.country?.name?.trim() ||
        place.iata_country_code?.trim().toUpperCase() ||
        "",
    },
  };
}
