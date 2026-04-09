export function deriveHQ(email: string, timezone: string): string {
  if (!email) return "GLOBAL";

  try {
    const emailLower = email.toLowerCase();
    
    if (emailLower.includes("+india")) return "INDIA";
    if (emailLower.includes("+usa")) return "USA";
    if (emailLower.includes("+korea")) return "KOREA";
    if (emailLower.includes("+europe")) return "EUROPE";
    if (emailLower.includes("+uae")) return "UAE";
    if (emailLower.includes("+africa")) return "AFRICA";
    if (emailLower.includes("+china")) return "CHINA";
    if (emailLower.includes("+hongkong")) return "HONG_KONG";
    if (emailLower.includes("+taiwan")) return "TAIWAN";
    if (emailLower.includes("+singapore")) return "SINGAPORE";
    if (emailLower.includes("+australia")) return "AUSTRALIA";
    if (emailLower.includes("+canada")) return "CANADA";
    if (emailLower.includes("+brazil")) return "BRAZIL";
    if (emailLower.includes("+semiconductor")) return "SEMICONDUCTOR";
    if (emailLower.includes("+digitalcity")) return "DIGITAL_CITY";

    if (timezone.includes("Asia/Kolkata")) return "INDIA";
    if (timezone.includes("America/New_York")) return "USA";
    if (timezone.includes("Asia/Seoul")) return "KOREA";

    return "GLOBAL";
  } catch (err) {
    return "GLOBAL";
  }
}
