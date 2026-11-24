"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, type InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPaise } from "@/lib/ordering/bill";
import { cn } from "@/lib/utils";
import { ConfirmButton } from "@/app/admin/_components/ConfirmButton";
import { adminRequest } from "@/app/admin/_components/request";
import { NoteLine, Switch, type Note } from "./CopyButton";

type Dish = { id: string; name: string; nameHi: string | null; pricePaise: number; isVeg: boolean; isAvailable: boolean };
type Section = { id: string; name: string; nameHi: string | null; items: Dish[] };

const rupees = (paise: number) => (paise % 100 ? (paise / 100).toFixed(2) : String(paise / 100));
const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const dishBody = (data: FormData) => ({ name: text(data, "name"), nameHi: text(data, "nameHi"), price: text(data, "price"), isVeg: text(data, "veg") === "veg" });

/** The Indian veg mark: a green or red square with a dot. */
export function VegDot({ isVeg }: { isVeg: boolean }) {
  return (
    <span role="img" aria-label={isVeg ? "Veg" : "Non-veg"} className={cn("flex size-4 shrink-0 items-center justify-center rounded-sm border-2", isVeg ? "border-g-green" : "border-g-red")}>
      <span className={cn("size-1.5 rounded-full", isVeg ? "bg-g-green" : "bg-g-red")} />
    </span>
  );
}

function Field({ label, ...props }: InputProps & { id: string; label: string }) {
  return (
    <div className="min-w-0">
      <Label htmlFor={props.id}>{label}</Label>
      <Input {...props} />
    </div>
  );
}

/** Saves, shows the error under the form, and clears the fields when it worked. */
function SaveForm({ label, onSave, onCancel, className, children }: { label: string; onSave: (data: FormData) => Promise<string | null>; onCancel?: () => void; className?: string; children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setNote(null);
    const problem = await onSave(new FormData(form));
    setBusy(false);
    setNote(problem ? { ok: false, text: problem } : { ok: true, text: "Saved." });
    if (!problem) form.reset();
  };
  return (
    <form onSubmit={submit} className={cn("grid items-end gap-3", className)}>
      {children}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" isLoading={busy}>{label}</Button>
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
      <div className="col-span-full empty:hidden"><NoteLine note={note} /></div>
    </form>
  );
}

function SectionFields({ id, section }: { id: string; section?: Section }) {
  return (
    <>
      <Field id={`${id}-name`} name="name" label="Section name" required maxLength={60} placeholder="Starters" defaultValue={section?.name} />
      <Field id={`${id}-hi`} name="nameHi" label="Hindi name (optional)" lang="hi" maxLength={60} placeholder="स्टार्टर" defaultValue={section?.nameHi ?? ""} />
    </>
  );
}

function DishFields({ id, dish }: { id: string; dish?: Dish }) {
  return (
    <>
      <Field id={`${id}-name`} name="name" label="Dish name" required maxLength={80} placeholder="Paneer tikka" defaultValue={dish?.name} />
      <Field id={`${id}-hi`} name="nameHi" label="Hindi name (optional)" lang="hi" maxLength={80} defaultValue={dish?.nameHi ?? ""} />
      <div className="min-w-0">
        <Label htmlFor={`${id}-price`}>Price before GST</Label>
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-moss">₹</span>
          <Input id={`${id}-price`} name="price" required inputMode="decimal" pattern="\d{1,6}(\.\d{1,2})?" title="Enter a price like 120 or 45.50" maxLength={9} defaultValue={dish ? rupees(dish.pricePaise) : ""} className="pl-8 tabular-nums" />
        </div>
      </div>
      <div className="min-w-0">
        <Label htmlFor={`${id}-veg`}>Type</Label>
        <select id={`${id}-veg`} name="veg" defaultValue={dish && !dish.isVeg ? "nonveg" : "veg"} className="block min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-base">
          <option value="veg">Veg</option>
          <option value="nonveg">Non-veg</option>
        </select>
      </div>
    </>
  );
}

const SECTION_GRID = "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]";
const DISH_GRID = "sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_8rem_8rem_auto]";

/** apiBase is "/api/admin/ordering/<shopId>" for Semsorted or "/api/restaurant" for the restaurant panel. */
export function MenuEditor({ apiBase, sections }: { apiBase: string; sections: Section[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async (path: string, method: string, body?: object) => {
    const result = await adminRequest(`${apiBase}${path}`, method, body);
    if (!result.ok) return result.error;
    setEditing(null);
    router.refresh();
    return null;
  };
  // Toggles and deletes have no form of their own, so their errors show above the menu.
  const act = async (path: string, method: string, body?: object) => {
    setError(null);
    setError(await send(path, method, body));
  };

  return (
    <div className="space-y-5">
      <section aria-labelledby="add-section" className="rounded-2xl bg-paper p-5">
        <h2 id="add-section" className="mb-4 text-xl font-semibold">Add a menu section</h2>
        <SaveForm label="Add section" className={SECTION_GRID} onSave={(data) => send("/categories", "POST", { name: text(data, "name"), nameHi: text(data, "nameHi") })}>
          <SectionFields id="new-section" />
        </SaveForm>
      </section>

      {error && <p role="alert" className="rounded-xl bg-g-red-tint p-3 text-sm font-semibold text-g-red">{error}</p>}

      {!sections.length && (
        <p className="rounded-2xl bg-paper p-6 text-moss">The menu is empty. Add a section like &ldquo;Starters&rdquo; first, then add its dishes.</p>
      )}

      {sections.map((section) => (
        <section key={section.id} aria-label={section.name} className="rounded-2xl bg-paper p-5">
          {editing === section.id ? (
            <SaveForm label="Save section" className={SECTION_GRID} onCancel={() => setEditing(null)} onSave={(data) => send(`/categories/${section.id}`, "PATCH", { name: text(data, "name"), nameHi: text(data, "nameHi") })}>
              <SectionFields id={`section-${section.id}`} section={section} />
            </SaveForm>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 flex-1 break-words text-xl font-semibold">
                {section.name}
                {section.nameHi && <span lang="hi" className="ml-2 text-base font-normal text-moss">{section.nameHi}</span>}
              </h2>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(section.id)}>Rename</Button>
              <ConfirmButton
                variant="ghost"
                size="sm"
                title={`Delete ${section.name}?`}
                message={section.items.length ? `This also deletes its ${section.items.length} ${section.items.length === 1 ? "dish" : "dishes"}. Past bills keep their lines.` : "This section has no dishes."}
                confirmLabel="Delete section"
                onConfirm={() => act(`/categories/${section.id}`, "DELETE")}
              >
                Delete
              </ConfirmButton>
            </div>
          )}

          {section.items.length ? (
            <ul className="mt-3 divide-y divide-line">
              {section.items.map((dish) => (
                <li key={dish.id} className="py-3">
                  {editing === dish.id ? (
                    <SaveForm label="Save dish" className={DISH_GRID} onCancel={() => setEditing(null)} onSave={(data) => send(`/items/${dish.id}`, "PATCH", dishBody(data))}>
                      <DishFields id={`dish-${dish.id}`} dish={dish} />
                    </SaveForm>
                  ) : (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex min-w-40 flex-1 items-center gap-2.5">
                        <VegDot isVeg={dish.isVeg} />
                        <span className={cn("min-w-0", !dish.isAvailable && "text-moss")}>
                          <span className="block break-words font-semibold">{dish.name}</span>
                          {dish.nameHi && <span lang="hi" className="block text-sm text-moss">{dish.nameHi}</span>}
                        </span>
                      </span>
                      <span className="font-semibold tabular-nums">{formatPaise(dish.pricePaise)}</span>
                      <Switch checked={dish.isAvailable} name={dish.name} label={dish.isAvailable ? "Available" : "Sold out"} onChange={(isAvailable) => act(`/items/${dish.id}`, "PATCH", { isAvailable })} />
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditing(dish.id)}>Edit</Button>
                      <ConfirmButton variant="ghost" size="sm" title={`Delete ${dish.name}?`} message="Guests will no longer see it. Past bills keep it." confirmLabel="Delete dish" onConfirm={() => act(`/items/${dish.id}`, "DELETE")}>
                        Delete
                      </ConfirmButton>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-moss">No dishes in this section yet.</p>
          )}

          <details className="group mt-3 rounded-xl bg-mist">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 text-sm font-semibold text-pine [&::-webkit-details-marker]:hidden">
              <Plus aria-hidden className="size-4 transition-transform group-open:rotate-45" /> Add a dish to {section.name}
            </summary>
            <div className="px-3 pb-3">
              <SaveForm label="Add dish" className={DISH_GRID} onSave={(data) => send("/items", "POST", { categoryId: section.id, ...dishBody(data) })}>
                <DishFields id={`add-${section.id}`} />
              </SaveForm>
            </div>
          </details>
        </section>
      ))}
    </div>
  );
}
