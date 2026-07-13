import type { ComponentType } from "react";

const MountainIcon = (() => null) as ComponentType<{ className?: string; size?: number }>;
const WavesIcon = (() => null) as ComponentType<{ className?: string; size?: number }>;
const BeachIcon = (() => null) as ComponentType<{ className?: string; size?: number }>;

export type VactionOption = {
  tags: string[];
  image: ComponentType<{ className?: string; size?: number }>;
  color: string;
  gradient: string;
  title: string;
  price: string;
  description: string;
  features: string[];
  hasExpert: boolean;
  hasSupport: boolean;
  hasAccountManager: boolean;
};

export const VACATION_OPTIONS: VactionOption[] = [
  {
    tags: ["Solo", "Focused"],
    image: MountainIcon,
    color: "text-emerald-400",
    gradient: "from-emerald-500 to-teal-500",
    title: "Mountain Escape",
    price: "220",
    description: "Quiet, self-guided travel for travelers who want space and flexibility.",
    features: ["Flexible dates", "Private stays", "Light support"],
    hasExpert: true,
    hasSupport: true,
    hasAccountManager: false,
  },
  {
    tags: ["Social", "Balanced"],
    image: WavesIcon,
    color: "text-sky-400",
    gradient: "from-sky-500 to-cyan-500",
    title: "Coastal Retreat",
    price: "380",
    description: "A comfortable mix of relaxation, activity, and guided planning.",
    features: ["Curated stays", "Local experiences", "Priority support"],
    hasExpert: true,
    hasSupport: true,
    hasAccountManager: true,
  },
  {
    tags: ["Luxury", "Planned"],
    image: BeachIcon,
    color: "text-amber-400",
    gradient: "from-amber-500 to-orange-500",
    title: "Luxury Beach Plan",
    price: "640",
    description: "A premium itinerary with personal coordination and added convenience.",
    features: ["Full planning", "Premium transfers", "Dedicated support"],
    hasExpert: true,
    hasSupport: true,
    hasAccountManager: true,
  },
];
