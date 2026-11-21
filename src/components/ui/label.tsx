import * as React from "react";
import { cn } from "@/lib/utils";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn("mb-1.5 block text-sm font-semibold text-ink", className)} {...props} />
));
Label.displayName = "Label";

export { Label };
