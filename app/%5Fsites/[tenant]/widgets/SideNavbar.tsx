"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";
import { FaHouseChimney, FaImage, FaInbox, FaUser } from "react-icons/fa6";
import { BiSolidPlaneAlt } from "react-icons/bi";
import { MdBarChart } from "react-icons/md";
import { RiDiscountPercentFill, RiMegaphoneFill } from "react-icons/ri";

const SIDEBAR_EXPANDED = 250;
const SIDEBAR_COLLAPSED = 60;

export type MenuKey =
  | "home"
  | "inbox"
  | "tours"
  | "customers"
  | "analytics"
  | "discounts"
  | "content"
  | "marketing";

type Props = {
  currentMenu: MenuKey;
  onChangeMenu: (menu: MenuKey) => void;
};

export default function SideNavbar({ currentMenu, onChangeMenu }: Props) {
  const [open, setOpen] = useState(true);
  
  useEffect(() => {
    const keyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, []);

  return (
    <motion.aside
      animate={{ width: open ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="w-[250px] h-screen bg-bg border border-border flex flex-col overflow-hidden"
      aria-label="Side navigation"
    >
      {/* Header */}
      <div className="h-12 px-3 flex items-center justify-between border-b border-border text-fg">
        <AnimatePresence initial={false}>
          {open && (
            <motion.strong
              key="title"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="text-sm"
            >
              Menu
            </motion.strong>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-md hover:bg-muted"
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="p-2">
        <ul className="space-y-1 text-icon">
          <li>
            <button
              type="button"
              onClick={() => onChangeMenu('home')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted ${currentMenu === 'home' ? 'bg-muted' : ''}`}
            >
              <FaHouseChimney size={18} className="shrink-0" />
              <AnimatePresence initial={false}>
                {open && (
                  <motion.span
                    key="home-label"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="text-md font-semibold whitespace-nowrap"
                  >
                    Home
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </li>

          <li>
            <button
              type="button"
              onClick={() => onChangeMenu('inbox')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted ${currentMenu === 'inbox' ? 'bg-muted' : ''}`}
            >
              <FaInbox size={18} className="shrink-0" />
              <AnimatePresence initial={false}>
                {open && (
                    <motion.span
                      key="inbox-lable"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="text-md font-semibold whitespace-nowrap"
                    >
                        Inbox
                    </motion.span>
                )}
              </AnimatePresence>
            </button>
          </li>

          <li>
            <button
              type="button"
              onClick={() => onChangeMenu('tours')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted ${currentMenu === 'tours' ? 'bg-muted' : ''}`}
            >
              <BiSolidPlaneAlt size={18} className="shrink-0" />
              <AnimatePresence initial={false}>
                {open && (
                    <motion.span
                      key="inbox-lable"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="text-md font-semibold whitespace-nowrap"
                    >
                        Tours
                    </motion.span>
                )}
              </AnimatePresence>
            </button>
          </li>

          <li>
            <button
              type="button"
              onClick={() => onChangeMenu('customers')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted ${currentMenu === 'customers' ? 'bg-muted' : ''}`}
            >
              <FaUser size={18} className="shrink-0" />
              <AnimatePresence initial={false}>
                {open && (
                    <motion.span
                      key="inbox-lable"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="text-md font-semibold whitespace-nowrap"
                    >
                        Customers
                    </motion.span>
                )}
              </AnimatePresence>
            </button>
          </li>

          <li>
            <button
              type="button"
              onClick={() => onChangeMenu('analytics')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted ${currentMenu === 'analytics' ? 'bg-muted' : ''}`}
            >
              <MdBarChart size={18} className="shrink-0" />
              <AnimatePresence initial={false}>
                {open && (
                    <motion.span
                      key="inbox-lable"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="text-md font-semibold whitespace-nowrap"
                    >
                        Analytics
                    </motion.span>
                )}
              </AnimatePresence>
            </button>
          </li>

          <li>
            <button
              type="button"
              onClick={() => onChangeMenu('discounts')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted ${currentMenu === 'discounts' ? 'bg-muted' : ''}`}
            >
              <RiDiscountPercentFill size={18} className="shrink-0" />
              <AnimatePresence initial={false}>
                {open && (
                    <motion.span
                      key="inbox-lable"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="text-md font-semibold whitespace-nowrap"
                    >
                        Discounts
                    </motion.span>
                )}
              </AnimatePresence>
            </button>
          </li>

          <li>
            <button
              type="button"
              onClick={() => onChangeMenu('content')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted ${currentMenu === 'content' ? 'bg-muted' : ''}`}
            >
              <FaImage size={18} className="shrink-0" />
              <AnimatePresence initial={false}>
                {open && (
                    <motion.span
                      key="inbox-lable"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="text-md font-semibold whitespace-nowrap"
                    >
                        Content
                    </motion.span>
                )}
              </AnimatePresence>
            </button>
          </li>

          <li>
            <button
              type="button"
              onClick={() => onChangeMenu('marketing')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted ${currentMenu === 'marketing' ? 'bg-muted' : ''}`}
            >
              <RiMegaphoneFill size={18} className="shrink-0" />
              <AnimatePresence initial={false}>
                {open && (
                    <motion.span
                      key="inbox-lable"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="text-md font-semibold whitespace-nowrap"
                    >
                        Marketing
                    </motion.span>
                )}
              </AnimatePresence>
            </button>
          </li>
        </ul>
      </nav>
    </motion.aside>
  );
}
