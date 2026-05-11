"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";
import { useConsent } from "./ConsentContext";

const CLARITY_PROJECT_ID = "wpnv2kiqwg";

/**
 * Initializes Microsoft Clarity on mount and pushes consent state to the
 * Clarity tag once the user makes a decision. Until consent === "granted",
 * Clarity will still load but will not write tracking cookies (per the
 * consent API contract).
 */
export default function ClarityProvider() {
  const { consent } = useConsent();

  // Boot the Clarity tag once per session. It's safe to call early — the
  // consent state below tells Clarity whether to actually persist cookies.
  useEffect(() => {
    Clarity.init(CLARITY_PROJECT_ID);
  }, []);

  // Propagate consent decision whenever it changes.
  useEffect(() => {
    if (consent === "granted") {
      Clarity.consentV2({
        ad_Storage: "denied",
        analytics_Storage: "granted",
      });
    } else if (consent === "denied") {
      Clarity.consentV2({
        ad_Storage: "denied",
        analytics_Storage: "denied",
      });
    }
    // "pending" → no consent call; Clarity defaults to no-cookie mode.
  }, [consent]);

  return null;
}
