import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { getStats } from "@/api/stats";
import { hasSeenWelcome, markWelcomeSeen } from "@/utils/welcomeState";
import WelcomeWizard from "./WelcomeWizard";

/**
 * Mounts the WelcomeWizard automatically when:
 *   - The current tenant has never seen the wizard
 *   - The namespace has zero devices of any status
 *
 * Rendered inside AppLayout so it works regardless of which page the user
 * lands on. The tenant is marked as "seen" when the user closes the wizard,
 * not when it opens — so closing early doesn't permanently suppress it until
 * the user consciously dismisses it.
 */
export default function WelcomeWizardTrigger() {
  const tenant = useAuthStore((s) => s.tenant);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    if (hasSeenWelcome(tenant)) return;

    let cancelled = false;

    getStats()
      .then((stats) => {
        if (cancelled) return;

        const hasDevices =
          stats.registered_devices > 0 ||
          stats.pending_devices > 0 ||
          stats.rejected_devices > 0;

        if (!hasDevices) {
          setShow(true);
        }
      })
      .catch(() => {
        // Stats unavailable — don't show wizard, let the user access the UI
      });

    return () => {
      cancelled = true;
    };
  }, [tenant]);

  const handleClose = () => {
    if (tenant) markWelcomeSeen(tenant);
    setShow(false);
  };

  return <WelcomeWizard open={show} onClose={handleClose} />;
}
