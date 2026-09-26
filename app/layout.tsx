import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/src/shared/common/Navbar";
import Providers from "./providers";
import AuthBootstrapper from "./AuthBootstrapper";

export const metadata: Metadata = {
  title: "SkyReserve | Flight Reservation Portal",
  description: "Search, book, and manage flights with SkyReserve.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-medium antialiased"
      >
        <Providers>
          <AuthBootstrapper />
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
