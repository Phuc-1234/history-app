/**
 * Strip HTML tags and decode HTML entities into plain text.
 */
export function stripHtml(html?: string | null): string {
    if (!html) return "";

    let clean = html.replace(/<[^>]*>/g, " ");

    const entities: Record<string, string> = {
        "&nbsp;": " ",
        "&lt;": "<",
        "&gt;": ">",
        "&amp;": "&",
        "&quot;": '"',
        "&apos;": "'",
        "&cent;": "¢",
        "&pound;": "£",
        "&yen;": "¥",
        "&euro;": "€",
        "&copy;": "©",
        "&reg;": "®",
        "&ldquo;": "“",
        "&rdquo;": "”",
        "&lsquo;": "‘",
        "&rsquo;": "’",
        "&hellip;": "…",
        "&bull;": "•",
        "&trade;": "™",
    };

    clean = clean.replace(/&[a-zA-Z0-9#]+;/g, (match) => {
        if (entities[match]) return entities[match];
        if (match.startsWith("&#")) {
            const body = match.slice(2, -1);
            const isHex = body[0] === "x" || body[0] === "X";
            const code = parseInt(isHex ? body.slice(1) : body, isHex ? 16 : 10);
            if (!isNaN(code)) return String.fromCodePoint(code);
        }
        return match;
    });

    clean = clean.replace(/<[^>]*>/g, " ");
    return clean.replace(/\s+/g, " ").trim();
}
