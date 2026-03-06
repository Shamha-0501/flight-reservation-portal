import React from "react";
import { MenuKey } from "./SideNavbar";
import { AnimatePresence, motion } from "framer-motion";
import HomePanel from "./Panels/Home";
import InboxPanel from "./Panels/Inbox";
import ToursPanel from "./Panels/Tours";
import CustomerPanel from "./Panels/Customer";
import AnalyticsPanel from "./Panels/Analytics";
import DiscountPanel from "./Panels/Discount";
import ContentPanel from "./Panels/Content";
import MarketingPanel from "./Panels/Marketing";

export default function TenantPanels({
  currentMenu,
}: {
  currentMenu: MenuKey;
}) {
  return (
    <div className="flex-1 min-w-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMenu}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.18 }}
        >
          {currentMenu === "home" && (
            <HomePanel />
          )}
          
          {currentMenu === "inbox" && (
            <InboxPanel />
          )}
          
          {currentMenu === "tours" && (
            <ToursPanel />
          )}
          
          {currentMenu === "customers" && (
            <CustomerPanel />
          )}
          
          {currentMenu === "analytics" && (
            <AnalyticsPanel />
          )}
          
          {currentMenu === "discounts" && (
            <DiscountPanel />
          )}
          
          {currentMenu === "content" && (
            <ContentPanel />
          )}
          
          {currentMenu === "marketing" && (
            <MarketingPanel />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
