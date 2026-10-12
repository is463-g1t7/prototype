/** Demo roster. Each pass QR encodes `pass` (see public/passes/<pass>.svg). */
export type Cleaner = {
  id: string;
  name: string;
  initials: string;
  pass: string;
  shift: "AM" | "PM";
  vendor: string;
};

export const CLEANERS: Cleaner[] = [
  { id: "c-0142", name: "Siti Rahmah", initials: "SR", pass: "SMU-CLN-0142", shift: "AM", vendor: "Campus FM · Zone A" },
  { id: "c-0217", name: "Ramesh Pillai", initials: "RP", pass: "SMU-CLN-0217", shift: "AM", vendor: "Campus FM · Zone B" },
  { id: "c-0388", name: "Tan Mei Ling", initials: "TM", pass: "SMU-CLN-0388", shift: "PM", vendor: "Campus FM · Zone A" },
  { id: "c-0451", name: "Ahmad Faizal", initials: "AF", pass: "SMU-CLN-0451", shift: "PM", vendor: "Campus FM · Zone C" },
];

export function cleanerById(id: string | null | undefined): Cleaner | undefined {
  return CLEANERS.find((c) => c.id === id);
}

export function cleanerByPass(code: string): Cleaner | undefined {
  const norm = code.trim().toUpperCase();
  return CLEANERS.find((c) => c.pass === norm);
}

export function passQrSrc(c: Cleaner): string {
  return `/passes/${c.pass}.svg`;
}
