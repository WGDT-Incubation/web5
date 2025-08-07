"use client";

import { Nunito } from "next/font/google";
import "./globals.css";
import { useState, useMemo, useEffect, Suspense } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { ReactQueryProvider } from "./components/ReactQueryProvider";
import { usePathname, useRouter } from "next/navigation";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [showSessionExpired, setShowSessionExpired] = useState(false);

  // ✅ Fix: memoize noLayoutRoutes so it's not recreated on every render
  const noLayoutRoutes = useMemo(() => ["/", "/signup", "/forgotPass"], []);

  const hideLayout = noLayoutRoutes.includes(pathname);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const loginTime = localStorage.getItem("loginTime");
    const isPublicRoute = noLayoutRoutes.includes(pathname);

    if (!token && !isPublicRoute) {
      router.push("/");
      return;
    }

    if (token && loginTime && !isPublicRoute) {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const sessionStart = parseInt(loginTime);

      if (now - sessionStart > oneHour) {
        setShowSessionExpired(true);
      }
    }
  }, [pathname, noLayoutRoutes, router]);

  return (
    <html lang="en" className={nunito.variable}>
      <body>
        <ReactQueryProvider>
          {!hideLayout ? (
            <div className="layout-container">
              <Navbar />
              <div className="content-container">
                <Sidebar />
                <Suspense fallback={<div>Loading...</div>}>
                  <main className="main-content1">{children}</main>
                </Suspense>
              </div>
            </div>
          ) : (
            <main className="login-page">{children}</main>
          )}

          {showSessionExpired && (
            <div className="session-expired-modal-overlay">
              <div className="session-expired-modal">
                <h3>Session Expired</h3>
                <p>Your session has expired. Please log in again.</p>
                <button
                  onClick={() => {
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("loginTime");
                    setShowSessionExpired(false);
                    router.push("/");
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
