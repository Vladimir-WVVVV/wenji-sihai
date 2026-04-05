export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function maskPhone(phone: string) {
  if (!phone || phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export function buildCsv(rows: Array<Record<string, string | number | null | undefined>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escape = (value: string | number | null | undefined) =>
    `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => escape(row[key])).join(",")),
  ];

  // Use UTF-8 BOM + CRLF so Excel/WPS on Windows can detect Chinese reliably.
  return `\uFEFF${lines.join("\r\n")}`;
}
