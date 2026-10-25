"use client";

import { useEffect } from "react";
import { clearFlash } from "@/app/staff/actions";

/** Shows the one-time message set by the last action, then deletes it so it is not shown again. */
export function StaffFlash({ message }: { message: string | null }) {
  useEffect(() => {
    if (message) void clearFlash();
  }, [message]);
  if (!message) return null;
  return (
    <p role="status" className="mb-6 rounded-xl border-l-4 border-ok bg-ok-soft p-4 font-semibold text-ok">
      {message}
    </p>
  );
}
