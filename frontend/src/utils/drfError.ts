// src/utils/drfError.ts
type AnyObj = Record<string, any>;

export function parseDrfError(data: any, status?: number): string {
    if (!data) return `Request failed${status ? ` (${status})` : ""}.`;

    // DRF common keys
    if (typeof data === "string") return data;
    if (data.detail) return toText(data.detail);
    if (data.non_field_errors) return toList(data.non_field_errors);

    // Field errors -> "field: msg" lines
    if (typeof data === "object") {
        const lines: string[] = [];
        for (const [field, msgs] of Object.entries(data as AnyObj)) {
            if (Array.isArray(msgs)) lines.push(`${field}: ${msgs.join(", ")}`);
            else if (msgs != null) lines.push(`${field}: ${toText(msgs)}`);
        }
        if (lines.length) return lines.join("\n");
    }

    return `Request failed${status ? ` (${status})` : ""}.`;
}

function toText(v: any) {
    if (typeof v === "string") return v;
    try { return JSON.stringify(v); } catch { return String(v); }
}
function toList(v: any) {
    return Array.isArray(v) ? v.map(toText).join(", ") : toText(v);
}
