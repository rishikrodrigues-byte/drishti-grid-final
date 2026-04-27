import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "DRISHTI-GRID 2.0",
  description: "Autonomous Road Health Digital Twin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-black overflow-x-hidden">
        {children}
        <Toaster theme="dark" position="top-right" richColors />
      </body>
    </html>
  );
}