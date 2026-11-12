/** Small CSV reader (quoted fields, commas/newlines inside quotes). Returns header-keyed rows. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const pick = (r: Record<string, string>, keys: string[]) => {
  for (const k of keys) if (r[k]) return r[k];
  return "";
};

/** Maps our research CSV or an Explee export onto contact fields. */
export function toContactRow(r: Record<string, string>) {
  const first = pick(r, ["first name", "first_name", "firstname"]);
  const last = pick(r, ["last name", "last_name", "lastname"]);
  return {
    category: pick(r, ["category", "campaign", "campaign name", "list", "segment"]) || null,
    email: pick(r, ["email", "email address", "work email", "e-mail"]),
    contact_name: pick(r, ["contact_name", "name", "full name", "contact name"]) || [first, last].filter(Boolean).join(" ") || null,
    org_name: pick(r, ["org_name", "company", "company name", "organization", "business", "account"]) || null,
    website: pick(r, ["website", "company website", "domain", "url"]) || null,
    instagram: pick(r, ["instagram", "instagram handle"]) || null,
    city: pick(r, ["city"]) || null,
    state: pick(r, ["state", "region"]) || null,
    followers: pick(r, ["followers", "follower count"]) || null,
    personal_detail: pick(r, ["personal_detail", "notes", "note", "personalization", "icebreaker", "title", "job title"]) || null,
    source_url: pick(r, ["source_url", "source", "linkedin", "linkedin url"]) || null,
  };
}
