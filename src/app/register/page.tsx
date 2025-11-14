// Registration page is disabled - using Microsoft OAuth login only
import { redirect } from "next/navigation";

export default function RegisterPage() {
  // Redirect to login since registration is now done via Microsoft OAuth
  redirect("/login");
}
