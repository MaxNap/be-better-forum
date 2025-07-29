import { Toaster } from "sonner";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Toaster
          position="top-center"
          richColors
          expand={true}
          closeButton={true}
          duration={3000}
        />
        {children}
      </body>
    </html>
  );
}
