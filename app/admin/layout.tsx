import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { verifyAuthToken } from "@/lib/authToken";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get("simulador_auth")?.value;
  const payload = verifyAuthToken(token);

  if (!payload) {
    redirect("/login?from=/admin/users");
  }

  if (payload.role !== "OWNER") {
    notFound(); 
  }

  return <>{children}</>;
}
