import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAuthToken } from "@/lib/authToken";
import { db } from "@/lib/knex";
import HomeClient from "./components/home/HomeClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const token = cookies().get("simulador_auth")?.value;
  const payload = verifyAuthToken(token);

  if (!payload) redirect("/login");

  const u = await db("users")
    .select("nome", "email")
    .where({ id: payload.uid })
    .first();

  const comprador = String(u?.nome || u?.email || "")
    .trim()
    .toUpperCase();

  return <HomeClient initialComprador={comprador} />;
}
