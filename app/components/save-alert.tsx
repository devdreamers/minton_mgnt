"use client";

import { useEffect } from "react";

export function SaveAlert({ message }: { message: string | null }) {
  useEffect(() => {
    if (message) window.alert(message);
  }, [message]);
  return null;
}
