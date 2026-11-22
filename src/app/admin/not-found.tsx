import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="max-w-md py-12">
      <h1 className="text-[2.35rem] font-bold">Business not found</h1>
      <p className="mb-6 mt-3 text-moss">It may have been deleted.</p>
      <Link href="/admin" className={buttonVariants()}>
        Back to businesses
      </Link>
    </div>
  );
}
