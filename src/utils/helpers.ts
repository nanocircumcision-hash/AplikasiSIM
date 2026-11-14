/**
 * Helper utilities for CLINIC MANAGEMENT SYSTEM
 */

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${parseInt(day, 10)} ${monthNames[monthIndex] || parts[1]} ${year}`;
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function calculateAge(birthDateStr: string): { years: number; months: number; text: string } {
  if (!birthDateStr) return { years: 0, months: 0, text: '0 Th' };
  try {
    const birth = new Date(birthDateStr);
    const today = new Date('2026-09-02'); // Consistent app time
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }

    if (years === 0) {
      return { years: 0, months: Math.max(0, months), text: `${Math.max(1, months)} Bulan` };
    }
    return { years, months, text: `${years} Tahun` };
  } catch {
    return { years: 0, months: 0, text: '-' };
  }
}

export function getTodayDateString(): string {
  return '2026-09-02';
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Play a soothing 2-tone clinic chime using Web Audio API
 */
export function playChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      // Tone 1 (High)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Tone 2 (Lower harmonic pleasant bell)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.25); // C5
      gain2.gain.setValueAtTime(0.35, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 1.2);

      setTimeout(() => {
        resolve();
      }, 700);
    } catch {
      resolve();
    }
  });
}

/**
 * Announce queue patient with Indonesian speech synthesis
 */
export async function announceQueue(queueNumber: string, roomName: string): Promise<void> {
  await playChime();
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `Nomor antrean, ${queueNumber.split('').join(' ')}, silakan menuju ke ${roomName}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  } catch (err) {
    console.log('Speech synthesis not permitted in current context', err);
  }
}

/**
 * Export data array to CSV file with UTF-8 BOM for Microsoft Excel compatibility
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const processCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(processCell).join(';'),
    ...rows.map(row => row.map(processCell).join(';'))
  ].join('\r\n');

  // \uFEFF is UTF-8 Byte Order Mark for Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
