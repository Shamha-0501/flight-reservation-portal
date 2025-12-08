export type Testimonial = {
  quote: string;
  fname: string;
  lname: string;
  image: string;
  type: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The trip to the Alps was unforgettable. The guides were knowledgeable and the scenery was stunning.",
    fname: "Sarah",
    lname: "Johnson",
    image: "/assets/images/testimonials/t1.png",
    type: "Adventure Traveler",
  },
  {
    quote:
      "Japan was a dream come true. Every corner was picture perfect. Highly recommend this agency!",
    fname: "Michael",
    lname: "Chen",
    image: "/assets/images/testimonials/t2.png",
    type: "Photographer",
  },
  {
    quote:
      "Our family safari was safe, fun, and educational. The kids loved seeing the animals up close.",
    fname: "Emily",
    lname: "Davis",
    image: "/assets/images/testimonials/t3.png",
    type: "Family Vacationer",
  },
];
