import { BriefcaseBusiness, Car, GraduationCap, Hotel, House, ShoppingBag, Sparkles, Stethoscope, UtensilsCrossed, type LucideIcon } from "lucide-react";

export const BUSINESS_GROUPS: Record<string, { label: string; icon: LucideIcon; tint: string }> = {
  "Food and drink": { label: "Food and drink", icon: UtensilsCrossed, tint: "bg-g-red-tint text-g-red" },
  Retail: { label: "Shops", icon: ShoppingBag, tint: "bg-g-blue-tint text-g-blue" },
  "Beauty and wellness": { label: "Salon and fitness", icon: Sparkles, tint: "bg-g-yellow-tint text-ink" },
  Health: { label: "Clinic and health", icon: Stethoscope, tint: "bg-g-green-tint text-g-green" },
  "Auto and transport": { label: "Auto", icon: Car, tint: "bg-g-blue-tint text-g-blue" },
  Education: { label: "Education", icon: GraduationCap, tint: "bg-g-yellow-tint text-ink" },
  "Home services": { label: "Home services", icon: House, tint: "bg-g-green-tint text-g-green" },
  "Professional services": { label: "Professional", icon: BriefcaseBusiness, tint: "bg-g-blue-tint text-g-blue" },
  "Events and stays": { label: "Hotels and events", icon: Hotel, tint: "bg-g-red-tint text-g-red" },
};
