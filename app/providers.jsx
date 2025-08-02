import { Toaster } from "sonner";

export default function Providers({ children }) {
  return (
    <>
      <Toaster
        position="top-center"
        richColors
        expand={true}
        closeButton={true}
        duration={10000}
      />
      {children}
    </>
  );
}
