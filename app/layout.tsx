import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tendo - Gestión para Pymes",
  description: "Sistema de gestión integral para pequeñas y medianas empresas chilenas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Restaurar color theme antes de hidratación para evitar flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=localStorage.getItem('tendo-color-theme');if(c&&c!=='default')document.documentElement.setAttribute('data-color',c);}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
<ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <TooltipProvider>{children}</TooltipProvider>
</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
