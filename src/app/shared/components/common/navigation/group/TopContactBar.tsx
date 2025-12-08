"use client";

import Container from "../../../../ui/Container";
import { Phone, Mail } from "lucide-react";

const CONTACT_EMAIL = "hello@tourism.lk";
const CONTACT_PHONE = "+94 77 123 4567";

export default function TopContactBar() {
  // For the tel: link we strip spaces so it's clean for mobile dialers
  const mailHref = `mailto:${CONTACT_EMAIL}`;
  const telHref = `tel:${CONTACT_PHONE.replace(/[^\d+]/g, "")}`;

  return (
    <Container className="w-full bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-screen mx-auto flex items-center justify-between px-4 py-1">
        {/* Left: Email (big & bold) */}
        <a
          href={mailHref}
          className="no-underline hover:no-underline font-light hover:font-medium text-sm md:text-md text-black hover:text-emerald-600 dark:text-gray-50 flex items-center gap-1 hover:gap-2 px-1 hover:px-2 stroke-[1.5] hover:stroke-[2.5] transition-all duration-300"
        >
          <Mail className="w-3 h-3 md:w-4 md:h-4" />
          {CONTACT_EMAIL}
        </a>

        {/* Right: Call button */}
        <a
          href={telHref}
          className="group inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm md:text-base font-medium bg-gray-100 hover:bg-emerald-700 transition "
        >
          {/* Simple phone icon */}
          <Phone className="w-3 h-3 md:w-5 md:h-5 fill-emerald-600"/>
          {/* <span className="hidden md:block text-sm md:text-md group-hover:font-medium">Call us</span> */}
        </a>
      </div>
    </Container>
  );
}
