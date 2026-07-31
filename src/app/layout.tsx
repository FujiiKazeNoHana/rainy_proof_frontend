import type { Metadata } from "next";
import { ThemeSwitcher } from "@/shared/components/ThemeSwitcher";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { themeBootstrapScript } from "@/shared/theme/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rainy Proof",
  description: "按开发者划分的多功能前端门户",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" data-theme="blue" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <div className="pointer-events-none fixed right-4 top-4 z-50 md:right-6 md:top-5">
            <div className="pointer-events-auto">
              <ThemeSwitcher />
            </div>
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
