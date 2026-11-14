export interface CalculatedAge {
  years: number;
  months: number;
  days: number;
  formatted: string;
  shortText: string;
}

/**
 * Menghitung umur lengkap (Tahun, Bulan, Hari) secara akurat dari tanggal lahir
 */
export function calculateAge(birthDateStr?: string | null): CalculatedAge {
  if (!birthDateStr) {
    return { years: 0, months: 0, days: 0, formatted: '-', shortText: '-' };
  }
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) {
    return { years: 0, months: 0, days: 0, formatted: '-', shortText: '-' };
  }
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) {
    return { years: 0, months: 0, days: 0, formatted: '0 Hari (Tanggal Belum Tiba)', shortText: '0 th' };
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} Tahun`);
  if (months > 0 || (years === 0 && days === 0)) parts.push(`${months} Bulan`);
  if (years === 0 && days > 0) parts.push(`${days} Hari`);

  const formatted = parts.length > 0 ? parts.join(' ') : '0 Bulan';
  const shortText = years > 0 
    ? `${years} th${months > 0 ? ` ${months} bln` : ''}` 
    : (months > 0 ? `${months} bln` : `${days} hr`);

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    formatted,
    shortText,
  };
}

/**
 * Menampilkan keterangan umur pasien secara dinamis dan sesuai
 */
export function getPatientAgeDisplay(patient?: {
  birthDate?: string | null;
  ageYears?: number;
  ageMonths?: number;
}): string {
  if (!patient) return '-';
  if (patient.birthDate) {
    const calc = calculateAge(patient.birthDate);
    if (calc.formatted && calc.formatted !== '-') {
      return calc.formatted;
    }
  }
  const y = patient.ageYears ?? 0;
  const m = patient.ageMonths ?? 0;
  if (y > 0 && m > 0) return `${y} Tahun ${m} Bulan`;
  if (y > 0) return `${y} Tahun`;
  if (m > 0) return `${m} Bulan`;
  return '0 Tahun';
}
