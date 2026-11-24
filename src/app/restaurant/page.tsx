import { redirect } from "next/navigation";
import { getStaff, HOME_FOR } from "@/lib/ordering/staff-auth";

export default async function RestaurantHome() {
  const staff = await getStaff();
  redirect(staff ? HOME_FOR[staff.role] : "/restaurant/login");
}
