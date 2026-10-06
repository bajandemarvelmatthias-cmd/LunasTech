// Builds a two-column CSV (metric, value) and starts the download.
// Everything in it is already on screen; nothing is fetched here.
export function downloadReport(rows: readonly (readonly [string, string | number])[]) {
  const quote = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`;
  const csv = [["Metric", "Value"], ...rows].map((r) => r.map(quote).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `lunastech-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
