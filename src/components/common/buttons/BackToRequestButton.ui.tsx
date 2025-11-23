"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function BackToRequestButton() {
  const pathname = usePathname() ?? "";
  
  // Determine the base route based on current pathname
  const isComptroller = pathname.startsWith("/comptroller");
  const isVP = pathname.startsWith("/vp");
  const isHR = pathname.startsWith("/hr");
  const isHead = pathname.startsWith("/head");
  const isExec = pathname.startsWith("/exec");
  
  let requestRoute = "/user/request";
  if (isComptroller) requestRoute = "/comptroller/request";
  else if (isVP) requestRoute = "/vp/request";
  else if (isHR) requestRoute = "/hr/request";
  else if (isHead) requestRoute = "/head/request";
  else if (isExec) requestRoute = "/exec/request";
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={requestRoute}
        className="group inline-flex items-center gap-2.5 rounded-xl border-2 border-[#7A0010]/20 bg-gradient-to-r from-white to-[#7A0010]/5 px-4 py-2.5 text-sm font-semibold text-[#7A0010] shadow-md transition-all duration-200 hover:border-[#7A0010]/40 hover:from-[#7A0010]/10 hover:to-[#7A0010]/15 hover:shadow-lg"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={2.5} />
        <span>Back to Request</span>
      </Link>
    </motion.div>
  );
}
