export type Destination = {
  path: string;
  country: string;
  duration: string;
  title: string;
  description: string;
  price: string;
  rating: number;
};

export const DESTINATIONS: Destination[] = [
  {
    path: "/destinations/bali.jpg",
    country: "Indonesia",
    duration: "5 days",
    title: "Bali Island Escape",
    description: "Relaxed island travel with beaches, temples, and premium stays.",
    price: "$890",
    rating: 4.8,
  },
  {
    path: "/destinations/rome.jpg",
    country: "Italy",
    duration: "7 days",
    title: "Rome Heritage Tour",
    description: "Historic city break with curated sightseeing and dining.",
    price: "$1,120",
    rating: 4.9,
  },
  {
    path: "/destinations/maldives.jpg",
    country: "Maldives",
    duration: "4 days",
    title: "Maldives Water Villas",
    description: "Luxury overwater villas with transfers and concierge support.",
    price: "$1,560",
    rating: 5.0,
  },
  {
    path: "/destinations/singapore.jpg",
    country: "Singapore",
    duration: "3 days",
    title: "Singapore City Break",
    description: "A short city escape with modern attractions and easy planning.",
    price: "$760",
    rating: 4.7,
  },
];
