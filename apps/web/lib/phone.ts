function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeStoredPhone(value?: string | null) {
  const source = (value ?? "").trim();
  if (!source) {
    return "";
  }

  const digits = digitsOnly(source);
  if (!digits) {
    return "";
  }

  if (source.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  if (digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  return digits;
}

export function formatPhoneDisplay(value?: string | null) {
  const normalized = normalizeStoredPhone(value);
  if (!normalized) {
    return "N/A";
  }

  const digits = digitsOnly(normalized);
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return normalized;
}
