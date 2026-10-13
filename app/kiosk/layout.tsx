import type { ReactNode } from "react";
import { DM_Sans, DM_Serif_Display } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const dmSerif = DM_Serif_Display({
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-dm-serif",
  weight: "400",
});

export default function KioskLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`kiosk-root ${dmSans.variable} ${dmSerif.variable} flex min-h-screen flex-1 flex-col`}
    >
      {children}
    </div>
  );
}
