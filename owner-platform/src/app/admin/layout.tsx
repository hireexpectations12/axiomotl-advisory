import type { ReactNode } from "react";
import "grapesjs/dist/css/grapes.min.css";
import "./admin.css";
export const metadata = {
  title: "Axiomotl · Owner workspace",
  robots: { index: false, follow: false },
};
export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
