"use client";
import React, { useEffect, useState } from "react";
import { Nunito } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { ReactQueryProvider } from "./components/ReactQueryProvider";
import { usePathname, useRouter } from "next/navigation";
import { SelectedDIDProvider } from "./Context/SelectedDIDContext";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
});
const noLayoutRoutes = ["/", "/signup", "/forgotPass"];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hideLayout = noLayoutRoutes.includes(pathname);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
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
  }, [pathname, router]);

  return (
    <html lang="en" className={nunito.variable}>
      <body>
        <SelectedDIDProvider>
          <ReactQueryProvider>
            {!hideLayout ? (
              <div className="layout-container">
                <Navbar />
                <div className="content-container">
                  <Sidebar />
                  <main className="main-content">{children}</main>
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
                      localStorage.removeItem("token");
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
        </SelectedDIDProvider>
      </body>
    </html>
  );
}