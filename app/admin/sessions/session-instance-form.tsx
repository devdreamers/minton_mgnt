"use client";

import { useMemo, useState } from "react";
import type { SessionTemplate } from "@/lib/types";

export function SessionInstanceForm({ templates, days, action }: { templates: SessionTemplate[]; days: string[]; action: (formData: FormData) => void }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [date, setDate] = useState("");
  const selected = useMemo(() => templates.find((template) => template.id === templateId), [templateId, templates]);
  return <form className="form" action={action} style={{ marginTop: 20 }}>
    <div className="grid cols-2"><div className="field"><label htmlFor="instance-template">템플릿</label><select id="instance-template" name="template_id" value={templateId} onChange={(event) => setTemplateId(event.target.value)} required>{templates.map((template) => <option value={template.id} key={template.id}>{template.title}</option>)}</select></div><div className="field"><label htmlFor="instance-date">회차 날짜</label><input id="instance-date" name="session_date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></div></div>
    {selected ? <div className="notice"><strong>자동 적용 정보</strong><br />{days[selected.day_of_week]} · {selected.start_time.slice(0, 5)}–{selected.end_time.slice(0, 5)} · 신청 오픈 {selected.application_open_time.slice(0, 5)} · 정원 {selected.capacity}명</div> : null}
    <button className="btn btn-primary" type="submit">템플릿으로 회차 생성</button>
  </form>;
}
