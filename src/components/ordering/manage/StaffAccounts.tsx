"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmButton } from "@/app/admin/_components/ConfirmButton";
import { adminRequest } from "@/app/admin/_components/request";
import { Panel } from "@/app/admin/_components/TrackingBlocks";
import type { StaffRole } from "@/lib/ordering/staff-auth";
import type { StaffAccount } from "@/lib/ordering/staff-page";
import { cn } from "@/lib/utils";
import { NoteLine, PasswordInput, type Note } from "./CopyButton";

const ROLES: { value: StaffRole; label: string; help: string; tone: string }[] = [
  { value: "OWNER", label: "Owner", help: "Everything, including staff logins and bill details.", tone: "bg-g-blue-tint text-g-blue" },
  { value: "MANAGER", label: "Manager", help: "Orders, tables, menu, table QR and sales. Not staff or bill details.", tone: "bg-g-green-tint text-g-green" },
  { value: "KITCHEN", label: "Kitchen", help: "Sees new orders, marks them cooking or served, turns sold-out dishes off.", tone: "bg-g-yellow-tint text-ink" },
  { value: "WAITER", label: "Waiter", help: "Takes orders at the table, marks them served and prepares the bill.", tone: "bg-mist text-ink" },
];
const roleOf = (role: StaffRole) => ROLES.find((item) => item.value === role) ?? ROLES[3];
const select = "block min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-base";
const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

function RoleField({ id, value, onChange }: { id: string; value: StaffRole; onChange: (role: StaffRole) => void }) {
  return (
    <div className="min-w-0">
      <Label htmlFor={id}>Role</Label>
      <select id={id} name="role" value={value} onChange={(event) => onChange(event.target.value as StaffRole)} aria-describedby={`${id}-help`} className={select}>
        {ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
      </select>
      <p id={`${id}-help`} className="mt-1 text-sm text-moss">{roleOf(value).help}</p>
    </div>
  );
}

function AddAccount({ url }: { url: string }) {
  const router = useRouter();
  const [role, setRole] = useState<StaffRole>("WAITER");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);

  const add = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setNote(null);
    const login = text(data, "login");
    const result = await adminRequest(url, "POST", { name: text(data, "name"), role, login, password: String(data.get("password") ?? "") });
    setBusy(false);
    if (!result.ok) return setNote({ ok: false, text: result.error });
    form.reset();
    setNote({ ok: true, text: `Account added. They log in with ${login}.` });
    router.refresh();
  };

  return (
    <Panel title="Add a staff account">
      <form onSubmit={add} className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="staff-name">Name</Label>
          <Input id="staff-name" name="name" required maxLength={60} autoComplete="off" placeholder="Ramesh" />
        </div>
        <RoleField id="staff-role" value={role} onChange={setRole} />
        <div>
          <Label htmlFor="staff-login">Login</Label>
          <Input id="staff-login" name="login" required maxLength={140} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="balaji.kitchen" aria-describedby="staff-login-help" />
          <p id="staff-login-help" className="mt-1 text-sm text-moss">An email, a 10-digit mobile number, or a username like balaji.kitchen.</p>
        </div>
        <div>
          <Label htmlFor="staff-password">Password</Label>
          <PasswordInput id="staff-password" name="password" required aria-describedby="staff-password-help" />
          <p id="staff-password-help" className="mt-1 text-sm text-moss">At least 8 characters. Tell it to them in person.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" isLoading={busy}>Add account</Button>
          <NoteLine note={note} />
        </div>
      </form>
    </Panel>
  );
}

function AccountRow({ account, url, isSelf }: { account: StaffAccount; url: string; isSelf: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(account.role);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const style = roleOf(account.role);

  const patch = async (body: object, done: string) => {
    setNote(null);
    const result = await adminRequest(`${url}/${account.id}`, "PATCH", body);
    setNote(result.ok ? { ok: true, text: done } : { ok: false, text: result.error });
    if (result.ok) router.refresh();
    return result.ok;
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = text(data, "name");
    const password = String(data.get("password") ?? "");
    // Only send what changed, so a rename does not sign anyone out.
    const body = { ...(name !== account.name && { name }), ...(role !== account.role && { role }), ...(password && { password }) };
    if (!Object.keys(body).length) return setEditing(false);
    setBusy(true);
    const ok = await patch(body, password ? "Saved. The new password signs them out on every device." : "Saved.");
    setBusy(false);
    if (ok) setEditing(false);
  };

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className={cn("min-w-48 flex-1", !account.isActive && "text-moss")}>
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            <span className="break-words">{account.name}</span>
            {isSelf && <span className="rounded-full bg-night px-2 py-0.5 text-xs font-semibold text-white">You</span>}
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", style.tone)}>{style.label}</span>
            {!account.isActive && <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-semibold text-moss ring-1 ring-line">Off</span>}
            {account.isLocked && <span className="rounded-full bg-g-red-tint px-2 py-0.5 text-xs font-semibold text-g-red">Locked</span>}
          </p>
          <p className="mt-0.5 break-all text-sm text-moss">
            {account.login}. {account.lastLogin ? `Last login ${account.lastLogin}` : "Never logged in"}
            {account.isLocked && ". Too many wrong passwords; it opens again in 15 minutes, or set a new password now"}
          </p>
        </div>
        {!editing && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => { setRole(account.role); setEditing(true); }}>Edit</Button>
            {!isSelf &&
              (account.isActive ? (
                <ConfirmButton
                  variant="ghost"
                  size="sm"
                  title={`Turn off ${account.name}?`}
                  message="They are signed out at once and cannot log in until you turn the account on again."
                  confirmLabel="Turn off"
                  onConfirm={async () => void (await patch({ isActive: false }, `${account.name} is turned off.`))}
                >
                  Turn off
                </ConfirmButton>
              ) : (
                <Button type="button" variant="ghost" size="sm" onClick={() => patch({ isActive: true }, `${account.name} can log in again.`)}>Turn on</Button>
              ))}
          </div>
        )}
      </div>

      {editing && (
        <form onSubmit={save} className="mt-3 grid gap-4 rounded-xl bg-mist p-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`name-${account.id}`}>Name</Label>
            <Input id={`name-${account.id}`} name="name" required maxLength={60} defaultValue={account.name} />
          </div>
          {isSelf ? (
            <p className="self-center text-sm text-moss">You cannot change your own role.</p>
          ) : (
            <RoleField id={`role-${account.id}`} value={role} onChange={setRole} />
          )}
          <div>
            <Label htmlFor={`password-${account.id}`}>New password (optional)</Label>
            <PasswordInput id={`password-${account.id}`} name="password" aria-describedby={`password-help-${account.id}`} />
            <p id={`password-help-${account.id}`} className="mt-1 text-sm text-moss">Leave empty to keep the current one.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <Button type="submit" isLoading={busy}>Save</Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </form>
      )}
      <div className="mt-2 empty:hidden"><NoteLine note={note} /></div>
    </li>
  );
}

/** apiBase is "/api/admin/ordering/<shopId>" for Semsorted or "/api/restaurant" for the owner. selfId marks the signed-in owner. */
export function StaffAccounts({ apiBase, accounts, selfId }: { apiBase: string; accounts: StaffAccount[]; selfId?: string }) {
  const url = `${apiBase}/staff`;
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Panel title="Staff accounts">
        <p className="-mt-2 text-sm text-moss">Everyone logs in with their own account and only sees what their role needs.</p>
        {accounts.length ? (
          <ul className="mt-2 divide-y divide-line">
            {accounts.map((account) => <AccountRow key={account.id} account={account} url={url} isSelf={account.id === selfId} />)}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl bg-mist p-4 text-sm text-moss">No accounts yet. Add the owner first.</p>
        )}
      </Panel>
      <AddAccount url={url} />
    </div>
  );
}
