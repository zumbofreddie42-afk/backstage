"use client";

import { useEffect, useState } from "react";
import { clearFlash } from "@/app/staff/actions";

/**
 * Shows the one-time message set by the last action (e.g. a new student's temporary password), then
 * deletes the cookie so it is not shown again. Deleting it refreshes the page with no message, so the
 * last message is kept in state until the user leaves the page.
 */
export function StaffFlash({ message }: { message: string | null }) {
  const [shown, setShown] = useState(message);
  if (message && message !== shown) setShown(message);

  useEffect(() => {
    if (message) void clearFlash();
  }, [message]);

  if (!shown) return null;
  return (
    <p role="status" className="mb-6 rounded-xl border-l-4 border-ok bg-ok-soft p-4 font-semibold text-ok">
      {shown}
    </p>
  );
}
