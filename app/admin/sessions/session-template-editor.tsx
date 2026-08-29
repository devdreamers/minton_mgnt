"use client";

import { useState } from "react";
import type { SessionTemplate } from "@/lib/types";

export function SessionTemplateEditor({ template, days, action, deleteAction }: { template: SessionTemplate; days: string[]; action: (formData: FormData) => void; deleteAction: (formData: FormData) => void }) {
  const [editing, setEditing] = useState(false);
  if (!editing) return <div className="template-management">
    <button className="btn btn-compact" type="button" onClick={() => setEditing(true)}>수정</button>
    <form action={deleteAction} onSubmit={(event) => { if (!window.confirm("이 소모임 템플릿을 삭제할까요?")) event.preventDefault(); }}>
      <input name="template_id" type="hidden" value={template.id} />
      <button className="btn btn-compact btn-danger" type="submit">삭제</button>
    </form>
  </div>;
  return <form className="template-edit-form" action={action}>
    <input name="template_id" type="hidden" value={template.id} />
    <input name="title" defaultValue={template.title} aria-label="소모임명" required />
    <select name="day_of_week" defaultValue={template.day_of_week} aria-label="요일">{days.map((day, index) => <option value={index} key={day}>{day}</option>)}</select>
    <input name="start_time" type="time" defaultValue={template.start_time.slice(0, 5)} aria-label="시작 시간" required />
    <input name="end_time" type="time" defaultValue={template.end_time.slice(0, 5)} aria-label="종료 시간" required />
    <input name="application_open_time" type="time" defaultValue={template.application_open_time.slice(0, 5)} aria-label="신청 오픈 시간" required />
    <input name="capacity" type="number" min={1} defaultValue={template.capacity} aria-label="정원" required />
    <button className="btn btn-primary" type="submit">저장</button>
    <button className="btn" type="button" onClick={() => setEditing(false)}>취소</button>
  </form>;
}
