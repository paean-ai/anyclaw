export interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: "US", name: "United States", dialCode: "1", flag: "🇺🇸" },
  { code: "CN", name: "China", dialCode: "86", flag: "🇨🇳" },
  { code: "GB", name: "United Kingdom", dialCode: "44", flag: "🇬🇧" },
  { code: "JP", name: "Japan", dialCode: "81", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", dialCode: "82", flag: "🇰🇷" },
  { code: "DE", name: "Germany", dialCode: "49", flag: "🇩🇪" },
  { code: "FR", name: "France", dialCode: "33", flag: "🇫🇷" },
  { code: "IN", name: "India", dialCode: "91", flag: "🇮🇳" },
  { code: "AU", name: "Australia", dialCode: "61", flag: "🇦🇺" },
  { code: "CA", name: "Canada", dialCode: "1", flag: "🇨🇦" },
  { code: "BR", name: "Brazil", dialCode: "55", flag: "🇧🇷" },
  { code: "RU", name: "Russia", dialCode: "7", flag: "🇷🇺" },
  { code: "SG", name: "Singapore", dialCode: "65", flag: "🇸🇬" },
  { code: "HK", name: "Hong Kong", dialCode: "852", flag: "🇭🇰" },
  { code: "TW", name: "Taiwan", dialCode: "886", flag: "🇹🇼" },
  { code: "MX", name: "Mexico", dialCode: "52", flag: "🇲🇽" },
  { code: "ID", name: "Indonesia", dialCode: "62", flag: "🇮🇩" },
  { code: "TH", name: "Thailand", dialCode: "66", flag: "🇹🇭" },
  { code: "VN", name: "Vietnam", dialCode: "84", flag: "🇻🇳" },
  { code: "PH", name: "Philippines", dialCode: "63", flag: "🇵🇭" },
  { code: "MY", name: "Malaysia", dialCode: "60", flag: "🇲🇾" },
  { code: "IT", name: "Italy", dialCode: "39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", dialCode: "34", flag: "🇪🇸" },
  { code: "NL", name: "Netherlands", dialCode: "31", flag: "🇳🇱" },
  { code: "SE", name: "Sweden", dialCode: "46", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", dialCode: "41", flag: "🇨🇭" },
  { code: "AE", name: "UAE", dialCode: "971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", dialCode: "966", flag: "🇸🇦" },
  { code: "TR", name: "Turkey", dialCode: "90", flag: "🇹🇷" },
  { code: "PL", name: "Poland", dialCode: "48", flag: "🇵🇱" },
  { code: "NG", name: "Nigeria", dialCode: "234", flag: "🇳🇬" },
  { code: "ZA", name: "South Africa", dialCode: "27", flag: "🇿🇦" },
  { code: "AR", name: "Argentina", dialCode: "54", flag: "🇦🇷" },
  { code: "IL", name: "Israel", dialCode: "972", flag: "🇮🇱" },
  { code: "NZ", name: "New Zealand", dialCode: "64", flag: "🇳🇿" },
];

export function getDefaultCountry(): CountryCode {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.startsWith("Asia/Shanghai") || tz.startsWith("Asia/Chongqing")) return COUNTRY_CODES.find(c => c.code === "CN")!;
    if (tz.startsWith("Asia/Tokyo")) return COUNTRY_CODES.find(c => c.code === "JP")!;
    if (tz.startsWith("Asia/Seoul")) return COUNTRY_CODES.find(c => c.code === "KR")!;
    if (tz.startsWith("Asia/Hong_Kong")) return COUNTRY_CODES.find(c => c.code === "HK")!;
    if (tz.startsWith("Asia/Taipei")) return COUNTRY_CODES.find(c => c.code === "TW")!;
    if (tz.startsWith("Asia/Singapore")) return COUNTRY_CODES.find(c => c.code === "SG")!;
    if (tz.startsWith("Europe/London")) return COUNTRY_CODES.find(c => c.code === "GB")!;
    if (tz.startsWith("Europe/Berlin")) return COUNTRY_CODES.find(c => c.code === "DE")!;
    if (tz.startsWith("Asia/Kolkata")) return COUNTRY_CODES.find(c => c.code === "IN")!;
  } catch { /* ignore */ }
  return COUNTRY_CODES[0]; // US
}
