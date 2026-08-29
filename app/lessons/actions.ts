"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApprovedMember } from "@/lib/auth/require-admin";
import { bookLesson, cancelLessonBooking } from "@/lib/services/lesson-service";

export async function bookLessonAction(formData: FormData) {
  const member = await requireApprovedMember();
  const slotId = String(formData.get("slot_id") ?? "");
  if (!slotId) throw new Error("slot_id is required");
  try { await bookLesson(slotId, member.id); }
  catch (error) { redirect(`/lessons?error=${error instanceof Error && error.message.includes("membership") ? "membership" : "unavailable"}`); }
  redirect("/lessons?result=booked");
}

export async function cancelLessonAction(formData: FormData) {
  const member = await requireApprovedMember();
  const bookingId = String(formData.get("booking_id") ?? "");
  if (!bookingId) throw new Error("booking_id is required");
  try { await cancelLessonBooking(bookingId, member.id); }
  catch (error) { redirect(`/lessons?error=${error instanceof Error && error.message.includes("cancelable") ? "cutoff" : "failed"}`); }
  revalidatePath("/lessons");
  redirect("/lessons?result=canceled");
}
