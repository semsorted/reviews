"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PrintButton = () => (
  <Button type="button" size="lg" onClick={() => window.print()}>
    <Printer aria-hidden className="size-5" /> Print
  </Button>
);
