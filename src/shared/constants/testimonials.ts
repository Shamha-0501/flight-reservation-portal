export type Testimonial = {
  quote: string;
  fname: string;
  lname: string;
  image: string;
  type: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "The booking flow is fast and the support team handled our changes quickly.",
    fname: "Nuwan",
    lname: "Perera",
    image: "/assets/images/testimonials/user1.jpg",
    type: "Travel Agent",
  },
  {
    quote: "I could finish my booking in minutes and received the ticket immediately.",
    fname: "Ayesha",
    lname: "Rahman",
    image: "/assets/images/testimonials/user2.jpg",
    type: "Frequent Traveler",
  },
  {
    quote: "The workflow fits our agency operations and helps us manage bookings daily.",
    fname: "Imran",
    lname: "Khan",
    image: "/assets/images/testimonials/user3.jpg",
    type: "Agency Owner",
  },
];
