/**
 * Utility untuk parsing teks pendaftaran pasien (e.g. dari pesan WhatsApp / Form Copas)
 * secara otomatis ke dalam field formulir pendaftaran pasien.
 */

export interface ParsedPatientData {
  fullName?: string;
  nickname?: string;
  gender?: 'Laki-laki' | 'Perempuan';
  birthDate?: string; // YYYY-MM-DD
  birthPlace?: string;
  ageYears?: number;
  ageMonths?: number;
  school?: string;
  grade?: string;
  weightKg?: string;
  heightCm?: string;
  allergies?: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  relationship?: string;
  phone?: string;
  address?: string;
  notes?: string;
  guardianNotes?: string;
  bookingDate?: string; // YYYY-MM-DD
  bookingTime?: string; // HH:mm (24-hour format)
  circumcisionMethod?: string;
  packageCategory?: string;
  patientSource?: string;
  discountAmount?: number;
  dpAmount?: number;
  paymentMethod?: 'TRANSFER' | 'CASH' | 'QRIS';
  extractedFields: string[];
}

const MONTH_MAP: Record<string, string> = {
  januari: '01', jan: '01',
  februari: '02', pebruari: '02', feb: '02',
  maret: '03', mar: '03',
  april: '04', apr: '04',
  mei: '05', may: '05',
  juni: '06', jun: '06',
  juli: '07', jul: '07',
  agustus: '08', ags: '08', agt: '08', august: '08', aug: '08',
  september: '09', sep: '09', sept: '09',
  oktober: '10', okt: '10', october: '10', oct: '10',
  november: '11', nopember: '11', nov: '11',
  desember: '12', des: '12', december: '12', dec: '12',
};

const DAY_NAMES = [
  'senin', 'selasa', 'rabu', 'kamis', 'jumat', "jum'at", 'sabtu', 'minggu',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

/**
 * Normalisasi format tanggal ke format ISO YYYY-MM-DD
 * Mampu membaca berbagai variasi format tanggal Indonesia & ekstra teks
 */
export function parseIndonesianDate(rawDateStr: string): string | null {
  if (!rawDateStr) return null;
  let clean = rawDateStr.trim().toLowerCase();

  // 1. Bersihkan nama hari (misal: "Kamis, 10 September 2026" atau "Sabtu, 06-06-2020")
  for (const day of DAY_NAMES) {
    clean = clean.replace(new RegExp(`\\b${day}\\b[,.:]?\\s*`, 'gi'), '');
  }
  clean = clean.replace(/[*_~#]/g, '').trim();

  // 2. Cek format dengan nama bulan teks: "10 September 2026" atau "6 Juni 2020" atau "06 Jun 2020"
  const textMonthMatch = clean.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{2,4})/i);
  if (textMonthMatch) {
    const d = textMonthMatch[1].padStart(2, '0');
    const monthKey = textMonthMatch[2].toLowerCase();
    let y = textMonthMatch[3];
    if (y.length === 2) {
      y = (Number(y) > 50 ? '19' : '20') + y;
    }
    const m = MONTH_MAP[monthKey];
    if (m && Number(d) >= 1 && Number(d) <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  // 3. Cek format ISO YYYY-MM-DD atau YYYY/MM/DD
  const isoMatch = clean.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    if (Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  // 4. Cek format DD-MM-YYYY atau DD/MM/YYYY atau DD.MM.YYYY (contoh: 06-06-2020 atau 6/6/2020)
  const dmyMatch = clean.match(/(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    if (Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  // 5. Cek format 2 digit tahun DD-MM-YY (contoh: 06-06-20 -> 2020)
  const dmyShortMatch = clean.match(/(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{2})\b/);
  if (dmyShortMatch) {
    const d = dmyShortMatch[1].padStart(2, '0');
    const m = dmyShortMatch[2].padStart(2, '0');
    const rawY = Number(dmyShortMatch[3]);
    const y = (rawY > 50 ? '19' : '20') + String(rawY).padStart(2, '0');
    if (Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  return null;
}

/**
 * Normalisasi format waktu ke format standar 24 jam HH:mm (contoh: 07:00)
 * Mendukung variasi Indonesia: titik (07.00), WIB, jam 7 pagi, 1 siang, dll.
 */
export function parseIndonesianTime(rawTimeStr: string): string | null {
  if (!rawTimeStr) return null;
  const clean = rawTimeStr.trim().toLowerCase();

  // 1. Cek format HH:mm atau HH.mm (contoh: 07:00, 07.00, 7:00, 7.30, 14.00)
  const hhmmMatch = clean.match(/(\d{1,2})[:.](\d{2})/);
  if (hhmmMatch) {
    let h = parseInt(hhmmMatch[1], 10);
    const m = hhmmMatch[2];
    if (h >= 0 && h <= 23 && parseInt(m, 10) >= 0 && parseInt(m, 10) <= 59) {
      // Penyesuaian waktu siang/sore/malam jika format 12 jam
      if (h < 12) {
        if (clean.includes('sore') || clean.includes('malam') || clean.includes('pm')) {
          h += 12;
        } else if (clean.includes('siang') && h >= 1 && h <= 5) {
          h += 12;
        }
      }
      return `${String(h).padStart(2, '0')}:${m}`;
    }
  }

  // 2. Cek format kata waktu: "7 pagi", "jam 8 pagi", "1 siang", "2 siang", "7 malam"
  const wordMatch = clean.match(/(?:jam\s*)?(\d{1,2})\s*(pagi|siang|sore|malam|am|pm)/i);
  if (wordMatch) {
    let h = parseInt(wordMatch[1], 10);
    const period = wordMatch[2].toLowerCase();
    if (h >= 1 && h <= 12) {
      if (period === 'siang' && h >= 1 && h <= 5) h += 12;
      else if ((period === 'sore' || period === 'malam' || period === 'pm') && h < 12) h += 12;
      else if ((period === 'pagi' || period === 'am') && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:00`;
    }
  }

  // 3. Cek format sederhana "jam 7" atau "jam 08"
  const justHourMatch = clean.match(/jam\s*(\d{1,2})/i);
  if (justHourMatch) {
    const h = parseInt(justHourMatch[1], 10);
    if (h >= 0 && h <= 23) {
      return `${String(h).padStart(2, '0')}:00`;
    }
  }

  return null;
}

/**
 * Membersihkan emoji dan karakter aneh dari string tanpa menghapus angka (0-9)
 * PENTING: \p{Emoji} dalam regex Unicode mencakup angka 0-9 dan karakter ASCII!
 * Oleh karena itu HANYA gunakan \p{Extended_Pictographic} dan range emoji spesifik.
 */
export function stripEmojis(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F1E6}-\u{1F1FF}\u{200D}\u{FE0F}\u{FE0E}]/gu, '')
    .trim();
}

/**
 * Parse teks chat WA pendaftaran pasien menjadi objek formulir pendaftaran
 */
export function parsePatientRegistrationText(text: string): ParsedPatientData {
  const result: ParsedPatientData = {
    gender: 'Laki-laki',
    relationship: 'Ayah Kandung',
    extractedFields: [],
  };

  if (!text || !text.trim()) return result;

  const lines = text.split(/\r?\n/);
  const additionalNotesList: string[] = [];

  let rawAddress = '';
  let rawRtRw = '';
  let rawSchoolLine = '';
  let rawBbTb = '';

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Remove leading bullet points like "*", "-", "•", numbering "1."
    const cleanLine = line.replace(/^[\s*\-•#_]+|\s*[\s*\-•#_]+$/g, '').trim();
    if (!cleanLine) continue;

    // Check if line contains a key-value separator ":" or "=" or "-"
    let colonIdx = cleanLine.indexOf(':');
    let separator = ':';
    if (colonIdx === -1) {
      const eqIdx = cleanLine.indexOf('=');
      if (eqIdx !== -1) {
        colonIdx = eqIdx;
        separator = '=';
      }
    }

    let key = '';
    let val = '';

    if (colonIdx !== -1) {
      key = cleanLine.slice(0, colonIdx).replace(/[*_~#]/g, '').trim().toLowerCase();
      val = cleanLine.slice(colonIdx + 1).replace(/^[*_~#]+|[*_~#]+$/g, '').trim();
    } else {
      // Periksa kemungkinan format tanpa titik dua, misal: "- Tgl Lahir Anak 06-06-2020" atau "- BB 18"
      const tglLahirMatch = cleanLine.match(/^(?:tgl\s*lahir(?:\s*anak)?|tanggal\s*lahir(?:\s*anak)?|ttl)\s+([^\n\r]+)$/i);
      if (tglLahirMatch) {
        key = 'tgl lahir anak';
        val = tglLahirMatch[1].trim();
      }

      const bbMatch = cleanLine.match(/^(?:bb(?:\s*&\s*tb)?(?:\s*anak)?|berat\s*badan(?:\s*anak)?)\s+([^\n\r]+)$/i);
      if (bbMatch) {
        key = 'bb';
        val = bbMatch[1].trim();
      }

      const tglSunatMatch = cleanLine.match(/^(?:tanggal\s*sunat|tgl\s*sunat|tanggal\s*khitan|tgl\s*khitan|rencana\s*sunat|jadwal\s*sunat)\s+([^\n\r]+)$/i);
      if (tglSunatMatch) {
        key = 'tanggal sunat';
        val = tglSunatMatch[1].trim();
      }

      const reqJamMatch = cleanLine.match(/^(?:request\s*jam(?:\s*tindakan)?|jam\s*tindakan|jam\s*sunat|request\s*waktu)\s+([^\n\r]+)$/i);
      if (reqJamMatch) {
        key = 'request jam';
        val = reqJamMatch[1].trim();
      }

      const namaAnakMatch = cleanLine.match(/^(?:nama\s*anak|nama\s*pasien)\s+([^\n\r]+)$/i);
      if (namaAnakMatch) {
        key = 'nama anak';
        val = namaAnakMatch[1].trim();
      }

      const ibuMatch = cleanLine.match(/^(?:ibu|nama\s+ibu)\s*:\s*(.+)$/i);
      if (ibuMatch) {
        result.motherName = stripEmojis(ibuMatch[1]).trim();
        result.extractedFields.push('Nama Ibu');
        continue;
      }

      if (!key) continue;
    }

    // 1. Nama Anak
    if (key.includes('nama anak') || key === 'nama pasien' || key === 'nama') {
      const name = stripEmojis(val);
      if (name) {
        result.fullName = name;
        const words = name.split(/\s+/);
        result.nickname = words[0]; // ambil nama panggilan dari nama depan
        result.extractedFields.push('Nama Anak');
      }
    }

    // 2. Tanggal Lahir Anak (Tgl Lahir Anak) -> Otomatis Salin ke Form Tanggal Lahir & Hitung Umur
    else if (
      key.includes('tgl lahir anak') ||
      key.includes('tanggal lahir anak') ||
      key.includes('tgl lahir') ||
      key.includes('tanggal lahir') ||
      key.includes('ttl')
    ) {
      let datePart = val;
      // Periksa apakah format menyertakan tempat lahir, contoh: "Bangkalan, 06-06-2020"
      if (val.includes(',')) {
        const parts = val.split(',');
        const possiblePlace = stripEmojis(parts[0]).trim();
        // Pastikan bukan nama hari (seperti "Sabtu, 06-06-2020")
        if (!DAY_NAMES.includes(possiblePlace.toLowerCase())) {
          result.birthPlace = possiblePlace;
          result.extractedFields.push('Tempat Lahir');
        }
        datePart = parts.slice(1).join(',').trim();
      } else {
        // Cek jika tempat dan tanggal tanpa koma (misal: "Bangkalan 06 Juni 2020")
        const placeDateMatch = val.match(/^([a-zA-Z\s]+?)\s+(\d{1,2}\s+[-/.\w]+\s+\d{2,4})/);
        if (placeDateMatch) {
          const possiblePlace = stripEmojis(placeDateMatch[1]).trim();
          if (!DAY_NAMES.includes(possiblePlace.toLowerCase())) {
            result.birthPlace = possiblePlace;
            result.extractedFields.push('Tempat Lahir');
          }
          datePart = placeDateMatch[2].trim();
        }
      }

      const parsedDate = parseIndonesianDate(stripEmojis(datePart));
      if (parsedDate) {
        result.birthDate = parsedDate;
        result.extractedFields.push('Tgl Lahir Anak');
      } else {
        // Jika format belum standar, simpan pembersihan teksnya
        result.birthDate = stripEmojis(datePart);
      }
    }

    // 3. Berat Badan (BB) -> Otomatis Salin dari teks "BB" / "BB & TB Anak"
    else if (
      key === 'bb' ||
      key.startsWith('bb ') ||
      key.includes('bb & tb') ||
      key.includes('bb/tb') ||
      key.includes('berat badan') ||
      key.includes('berat')
    ) {
      rawBbTb = stripEmojis(val);
      // Ekstrak angka berat badan: contoh "18", "18 kg", "18kg", "18.5", "18,5 kg", "18🙏🏻"
      const bbMatch = rawBbTb.match(/(\d+(?:[.,]\d+)?)\s*(?:kg)?/i);
      if (bbMatch) {
        result.weightKg = bbMatch[1].replace(',', '.');
        result.extractedFields.push('Berat Badan (BB)');
      }
      // Ekstrak juga tinggi badan jika ada format "18 kg / 115 cm" atau "TB: 115"
      const tbMatch = rawBbTb.match(/(?:tb|tinggi|\/)\s*(\d+(?:[.,]\d+)?)\s*(?:cm)?/i);
      if (tbMatch) {
        result.heightCm = tbMatch[1].replace(',', '.');
        result.extractedFields.push('Tinggi Badan (TB)');
      }
    }

    // 4. Kelas & Nama Sekolah
    else if (key.includes('sekolah') || key.includes('kelas')) {
      rawSchoolLine = stripEmojis(val);
      // Check for class/grade
      const gradeMatch = rawSchoolLine.match(/(kelas\s*[\w\d]+)/i);
      if (gradeMatch) {
        result.grade = gradeMatch[1];
        result.extractedFields.push('Kelas');
      }
      result.school = rawSchoolLine;
      result.extractedFields.push('Nama Sekolah');
    }

    // 5. Nama Orang Tua / Ayah / Ibu
    else if (key.includes('nama ortu') || key.includes('orang tua') || key.includes('ayah') || key.includes('wali')) {
      const subAyahMatch = val.match(/(?:ayah\s*:\s*)?([^,;]+)/i);
      if (subAyahMatch) {
        const fatherClean = stripEmojis(subAyahMatch[1].replace(/^ayah\s*:\s*/i, '')).trim();
        if (fatherClean) {
          result.fatherName = fatherClean;
          result.guardianName = fatherClean;
          result.extractedFields.push('Nama Ayah');
        }
      }
      const subIbuMatch = val.match(/ibu\s*:\s*([^,;]+)/i);
      if (subIbuMatch) {
        result.motherName = stripEmojis(subIbuMatch[1]).trim();
        result.extractedFields.push('Nama Ibu');
      }
    } else if (key.includes('ibu')) {
      const motherClean = stripEmojis(val).trim();
      if (motherClean) {
        result.motherName = motherClean;
        result.extractedFields.push('Nama Ibu');
      }
    }

    // 6. No HP / WhatsApp
    else if (key.includes('hp') || key.includes('wa') || key.includes('telepon') || key.includes('telp') || key.includes('kontak')) {
      const phoneDigits = val.replace(/[^\d+]/g, '');
      if (phoneDigits) {
        result.phone = phoneDigits;
        result.extractedFields.push('No. WhatsApp / HP');
      }
    }

    // 7. Alamat Lengkap
    else if (key.includes('alamat')) {
      rawAddress = stripEmojis(val);
      result.extractedFields.push('Alamat Lengkap');
    }

    // 8. RT / RW / Dusun / Kelurahan
    else if (key.includes('rt') || key.includes('rw')) {
      rawRtRw = stripEmojis(val);
    }

    // 9. Request Jam -> Request Jam Tindakan Otomatis (Format 24 Jam HH:mm)
    else if (
      key.includes('request jam') ||
      key.includes('jam tindakan') ||
      key.includes('jam sunat') ||
      key.includes('jam khitan') ||
      key.includes('request waktu') ||
      key.includes('waktu tindakan') ||
      key.includes('waktu sunat') ||
      key.startsWith('jam ') ||
      key === 'jam' ||
      key === 'waktu' ||
      key.includes('pukul')
    ) {
      const parsedTime = parseIndonesianTime(stripEmojis(val));
      if (parsedTime) {
        result.bookingTime = parsedTime;
        additionalNotesList.push(`Request Jam: ${parsedTime}`);
        result.extractedFields.push('Request Jam Tindakan');
      } else {
        result.bookingTime = stripEmojis(val);
      }
    }

    // 10. Tanggal Sunat -> Rencana Tindakan Khitan & Jadwal Booking Otomatis
    else if (
      !key.includes('jam') &&
      !key.includes('pukul') &&
      !key.includes('waktu') &&
      (
        key.includes('tanggal sunat') ||
        key.includes('tgl sunat') ||
        key.includes('tanggal khitan') ||
        key.includes('tgl khitan') ||
        key.includes('rencana sunat') ||
        key.includes('rencana khitan') ||
        key.includes('jadwal sunat') ||
        key.includes('jadwal khitan') ||
        key.includes('rencana tindakan') ||
        key.includes('tgl tindakan') ||
        key.includes('tanggal tindakan') ||
        key === 'tindakan' ||
        key === 'jadwal'
      )
    ) {
      const parsedSunatDate = parseIndonesianDate(stripEmojis(val));
      if (parsedSunatDate) {
        result.bookingDate = parsedSunatDate;
        additionalNotesList.push(`Rencana Tgl Sunat: ${parsedSunatDate}`);
        result.extractedFields.push('Tanggal Sunat (Jadwal Booking)');
      } else {
        result.bookingDate = stripEmojis(val);
      }

      // Periksa jika jam ikut tertulis pada baris yang sama (misal: "10 September 2026 jam 07:00")
      if (!result.bookingTime) {
        const inlineTime = parseIndonesianTime(stripEmojis(val));
        if (inlineTime) {
          result.bookingTime = inlineTime;
          result.extractedFields.push('Request Jam Tindakan');
        }
      }
    }

    // 11. Cabang / Lokasi
    else if (key.includes('cabang')) {
      const branch = stripEmojis(val);
      if (!result.birthPlace && branch) {
        result.birthPlace = branch.charAt(0).toUpperCase() + branch.slice(1);
      }
      additionalNotesList.push(`Cabang: ${branch}`);
    }

    // 12. Metode Sunat
    else if (key.includes('metode')) {
      result.circumcisionMethod = stripEmojis(val);
      additionalNotesList.push(`Request Metode: ${stripEmojis(val)}`);
      result.extractedFields.push('Metode Sunat');
    }

    // 13. Paket REG / VIP
    else if (key.includes('paket')) {
      result.packageCategory = stripEmojis(val);
      additionalNotesList.push(`Paket: ${stripEmojis(val)}`);
      result.extractedFields.push('Paket Layanan');
    }

    // 14. Alergi
    else if (key.includes('alergi')) {
      result.allergies = stripEmojis(val);
      result.extractedFields.push('Riwayat Alergi');
    }

    // 15. Sumber Informasi Pasien
    else if (key.includes('sumber informasi') || key.includes('sumber info') || key.includes('info sunat') || key === 'sumber') {
      const srcRaw = stripEmojis(val);
      if (srcRaw) {
        let normalizedSource = srcRaw;
        const low = srcRaw.toLowerCase();
        if (low.includes('tik tok') || low.includes('tiktok')) normalizedSource = 'TikTok Video';
        else if (low.includes('instagram') || low.includes('ig')) normalizedSource = 'Instagram / Ads';
        else if (low.includes('wa') || low.includes('whatsapp') || low.includes('chat')) normalizedSource = 'WhatsApp / Chat Pendaftaran';
        else if (low.includes('teman') || low.includes('keluarga') || low.includes('rekomendasi') || low.includes('saudara')) normalizedSource = 'Rekomendasi Keluarga / Teman';
        else if (low.includes('datang') || low.includes('langsung') || low.includes('walk in') || low.includes('walk-in')) normalizedSource = 'Datang Langsung (Walk-in)';
        else if (low.includes('google') || low.includes('web')) normalizedSource = 'Google / Website';
        
        result.patientSource = normalizedSource;
        result.extractedFields.push('Sumber Informasi');
        additionalNotesList.push(`Sumber Info: ${srcRaw}`);
      }
    }

    // 16. Diskon / Voucher
    else if (key.includes('diskon') || key.includes('voucher') || key.includes('vocher')) {
      const cleanVal = stripEmojis(val).replace(/[^\d]/g, '');
      if (cleanVal) {
        const num = parseInt(cleanVal, 10);
        if (!isNaN(num) && num > 0) {
          result.discountAmount = num;
          result.extractedFields.push('Diskon / Voucher');
          additionalNotesList.push(`Diskon/Voucher: Rp ${num.toLocaleString('id-ID')}`);
        }
      }
    }

    // 17. DP / Uang Muka
    else if (key.includes('dp') || key.includes('uang muka') || key.includes('down payment')) {
      const cleanVal = stripEmojis(val).replace(/[^\d]/g, '');
      if (cleanVal) {
        const num = parseInt(cleanVal, 10);
        if (!isNaN(num) && num > 0) {
          result.dpAmount = num;
          result.extractedFields.push('DP / Uang Muka');
          additionalNotesList.push(`DP: Rp ${num.toLocaleString('id-ID')}`);
        }
      }
    }

    // 18. Metode Pembayaran DP
    else if (key.includes('metode pembayaran') || key.includes('cara bayar') || key.includes('pembayaran')) {
      const payRaw = stripEmojis(val).toUpperCase();
      if (payRaw.includes('QRIS')) {
        result.paymentMethod = 'QRIS';
        result.extractedFields.push('Metode Pembayaran QRIS');
      } else if (payRaw.includes('TUNAI') || payRaw.includes('CASH')) {
        result.paymentMethod = 'CASH';
        result.extractedFields.push('Metode Pembayaran Tunai');
      } else if (payRaw.includes('TRANSFER') || payRaw.includes('TF') || payRaw.includes('BCA') || payRaw.includes('MANDIRI') || payRaw.includes('BRI')) {
        result.paymentMethod = 'TRANSFER';
        result.extractedFields.push('Metode Pembayaran Transfer');
      }
    }

    // 19. Hobi, Minat, Pekerjaan, Agama, Instagram, dll
    else {
      const cleanVal = stripEmojis(val);
      if (cleanVal) {
        const formattedKey = cleanLine.slice(0, colonIdx).trim();
        additionalNotesList.push(`${formattedKey}: ${cleanVal}`);
      }
    }
  }

  // Gabungkan Alamat + RT/RW
  if (rawAddress && rawRtRw) {
    result.address = `${rawAddress}, RT/RW: ${rawRtRw}`;
  } else if (rawAddress) {
    result.address = rawAddress;
  } else if (rawRtRw) {
    result.address = `RT/RW: ${rawRtRw}`;
  }

  // --- FALLBACK CEPAT & PRESISI BILA ADA BIDANG UTAMA YANG BELUM TERDETEKSI ---
  // 1. Fallback Tanggal Lahir Pasien
  if (!result.birthDate) {
    const tglLahirRegex = /(?:tgl\s*lahir|tanggal\s*lahir|ttl)(?:\s*anak|\s*pasien)?\s*[:=-]?\s*([^\n\r]+)/i;
    const match = text.match(tglLahirRegex);
    if (match) {
      let rawVal = stripEmojis(match[1]).trim();
      if (rawVal.includes(',')) {
        const parts = rawVal.split(',');
        if (!result.birthPlace && parts[0].trim()) {
          result.birthPlace = parts[0].trim();
        }
        rawVal = parts.slice(1).join(',').trim();
      }
      const parsed = parseIndonesianDate(rawVal);
      if (parsed) {
        result.birthDate = parsed;
        if (!result.extractedFields.includes('Tgl Lahir Anak')) {
          result.extractedFields.push('Tgl Lahir Anak');
        }
      }
    }
  }

  // 2. Fallback Berat Badan (BB)
  if (!result.weightKg) {
    const bbRegex = /(?:bb(?:\s*&\s*tb)?(?:\s*anak)?|berat\s*badan(?:\s*anak)?)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)/i;
    const match = text.match(bbRegex);
    if (match) {
      result.weightKg = match[1].replace(',', '.');
      if (!result.extractedFields.includes('Berat Badan (BB)')) {
        result.extractedFields.push('Berat Badan (BB)');
      }
    }
  }

  // 3. Fallback Tanggal Sunat (Rencana Khitan & Booking)
  if (!result.bookingDate) {
    const tglSunatRegex = /(?:tanggal\s*sunat|tgl\s*sunat|tanggal\s*khitan|tgl\s*khitan|rencana\s*sunat|rencana\s*khitan|jadwal\s*sunat|jadwal\s*khitan)\s*[:=-]?\s*([^\n\r]+)/i;
    const match = text.match(tglSunatRegex);
    if (match) {
      const rawVal = stripEmojis(match[1]).trim();
      const parsed = parseIndonesianDate(rawVal);
      if (parsed) {
        result.bookingDate = parsed;
        if (!result.extractedFields.includes('Tanggal Sunat (Jadwal Booking)')) {
          result.extractedFields.push('Tanggal Sunat (Jadwal Booking)');
        }
      }
    }
  }

  // 4. Fallback Request Jam Tindakan
  if (!result.bookingTime) {
    const reqJamRegex = /(?:request\s*jam|jam\s*tindakan|jam\s*sunat|jam\s*khitan|request\s*waktu|waktu\s*tindakan|waktu\s*sunat)\s*[:=-]?\s*([^\n\r]+)/i;
    const match = text.match(reqJamRegex);
    if (match) {
      const rawVal = stripEmojis(match[1]).trim();
      const parsed = parseIndonesianTime(rawVal);
      if (parsed) {
        result.bookingTime = parsed;
        if (!result.extractedFields.includes('Request Jam Tindakan')) {
          result.extractedFields.push('Request Jam Tindakan');
        }
      }
    }
  }

  // Pastikan guardianName terisi
  if (!result.guardianName) {
    if (result.fatherName) {
      result.guardianName = result.fatherName;
      result.relationship = 'Ayah Kandung';
    } else if (result.motherName) {
      result.guardianName = result.motherName;
      result.relationship = 'Ibu Kandung';
    }
  }

  // Set catatan tambahan jika ada data booking / hobi / ortu
  if (additionalNotesList.length > 0) {
    result.notes = additionalNotesList.join(' • ');
  }

  return result;
}

