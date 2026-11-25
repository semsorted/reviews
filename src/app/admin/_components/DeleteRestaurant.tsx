"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmButton } from "./ConfirmButton";
import { adminRequest } from "./request";

export function DeleteRestaurant({ shopId, name }: { shopId: string; name: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setError(null);
    const result = await adminRequest(`/api/admin/restaurants/${shopId}`, "DELETE");
    if (!result.ok) return setError(result.error);
    router.replace("/admin/restaurants");
    router.refresh();
  };

  return (
    <div>
      <ConfirmButton
        variant="outline"
        title={`Delete ${name}?`}
        message="This deletes the restaurant for good: menu, tables, staff logins, orders, bills, payments and its review QR. Printed QR codes stop working. It cannot be undone."
        confirmLabel="Delete for good"
        onConfirm={remove}
        className="text-danger"
      >
        <Trash2 aria-hidden className="size-4" /> Delete restaurant
      </ConfirmButton>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
