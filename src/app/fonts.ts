import { Fredoka, Inter, Plus_Jakarta_Sans } from "next/font/google";

export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-jakarta", display: "swap" });
/** Playful font, used only in the young learners sections. */
export const fredoka = Fredoka({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-fredoka", display: "swap" });

export const fontVariables = `${inter.variable} ${jakarta.variable} ${fredoka.variable}`;
