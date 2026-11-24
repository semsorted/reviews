import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getStaff, HOME_FOR } from "@/lib/ordering/staff-auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Staff login" };

export default async function RestaurantLoginPage() {
  const staff = await getStaff();
  if (staff) redirect(HOME_FOR[staff.role]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="text-[2.1rem] font-bold leading-tight">Restaurant login</h1>
      <p className="mt-2 text-moss">For owners, managers, kitchen and waiters. Use the login your owner gave you.</p>
      <LoginForm />
      <p className="mt-10 flex items-center gap-2 text-sm text-moss">
        Powered by <Logo className="text-base" />
      </p>
    </main>
  );
}
