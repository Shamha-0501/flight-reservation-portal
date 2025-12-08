export type Destination = {
  path: string;
  country: string;
  duration: string;
  title: string;
  description: string;
  price: string;
  rating: string;
};

export const DESTINATIONS: Destination[] = [
  {
    path: "/assets/images/destinations/td1.png",
    country: "Switzerland",
    duration: "7 Days",
    title: "Majestic Alps Adventure",
    description:
      "Experience the breathtaking beauty of the Swiss Alps with guided hikes",
    price: "$2499",
    rating: "4.8",
  },
  {
    path: "/assets/images/destinations/td2.png",
    country: "Japan",
    duration: "10 Days",
    title: "Kyoto Cultural Immersion",
    description:
      "Dive deep into Japanese culture, visiting ancient temples, tea",
    price: "$1899",
    rating: "4.9",
  },
  {
    path: "/assets/images/destinations/td3.png",
    country: "Tanzania",
    duration: "8 Days",
    title: "Safari in Serengeti",
    description:
      "Witness the Great Migration and see the Big Five in their natural",
    price: "$3200",
    rating: "4.9",
  },
];
