import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
 title: "Punjab Exam Academy | Punjab Competitive Exam Preparation",
 description: "Free Punjab GK, PSSSB, Patwari, Senior Assistant MCQs, mock tests, study notes and previous papers in Punjabi and English.",
 keywords:["Punjab GK","PSSSB","Punjab Patwari","Senior Assistant","Punjab exams","Punjabi MCQ"],
};
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="en"><body>{children}</body></html>;
}