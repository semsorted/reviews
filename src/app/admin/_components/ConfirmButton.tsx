"use client";

import { useRef, useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

interface ConfirmButtonProps extends Omit<ButtonProps, "onClick" | "title"> {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}

export function ConfirmButton({ title, message, confirmLabel, onConfirm, children, ...props }: ConfirmButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isBusy, setIsBusy] = useState(false);

  const confirm = async () => {
    setIsBusy(true);
    await onConfirm();
    setIsBusy(false);
    dialogRef.current?.close();
  };

  return (
    <>
      <Button type="button" onClick={() => dialogRef.current?.showModal()} {...props}>
        {children}
      </Button>
      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl bg-paper p-6 text-ink backdrop:bg-ink/40"
      >
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 whitespace-normal text-moss">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => dialogRef.current?.close()} disabled={isBusy}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={confirm} isLoading={isBusy}>
            {confirmLabel}
          </Button>
        </div>
      </dialog>
    </>
  );
}
