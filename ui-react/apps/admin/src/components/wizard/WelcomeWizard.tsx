import { useEffect, useRef, useState } from "react";
import { XMarkIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useDevicesStore } from "@/stores/devicesStore";
import { Device } from "@/types/device";
import WizardStep1Welcome from "./WizardStep1Welcome";
import WizardStep2Install from "./WizardStep2Install";
import WizardStep3Device from "./WizardStep3Device";
import WizardStep4Complete from "./WizardStep4Complete";

interface WelcomeWizardProps {
  open: boolean;
  onClose: () => void;
}

const TOTAL_STEPS = 4;

export default function WelcomeWizard({ open, onClose }: WelcomeWizardProps) {
  const [step, setStep] = useState(1);
  const [pendingDevice, setPendingDevice] = useState<Device | null>(null);
  const [accepting, setAccepting] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  const { accept } = useDevicesStore();

  // Reset to step 1 whenever the dialog opens so it always starts fresh
  useEffect(() => {
    if (open) {
      setStep(1);
      setPendingDevice(null);
      setAccepting(false);
    }
  }, [open]);

  const handleAccept = async () => {
    if (!pendingDevice) return;
    setAccepting(true);
    try {
      await accept(pendingDevice.uid);
      setStep(4);
    } catch {
      // Keep on step 3 — user can retry
    } finally {
      setAccepting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && step < 4) onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={step === 4 ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to ShellHub"
        className="relative bg-surface border border-border rounded-2xl w-full max-w-[560px] shadow-2xl shadow-black/40 flex flex-col max-h-[85vh] animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
          <span className="text-2xs font-mono font-bold uppercase tracking-label text-text-muted">
            Step {step} of {TOTAL_STEPS}
          </span>

          {/* Progress dots */}
          <div className="flex items-center gap-2" aria-hidden="true">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`rounded-full transition-all duration-300 ${
                  s < step
                    ? "w-2 h-2 bg-primary"
                    : s === step
                      ? "w-2.5 h-2.5 bg-primary shadow-[0_0_6px_rgba(102,122,204,0.5)]"
                      : "w-2 h-2 bg-border"
                }`}
              />
            ))}
          </div>

          {/* Close — hidden on step 4 */}
          {step < 4 ? (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-hover-medium transition-all"
              aria-label="Close wizard"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-7" aria-hidden="true" />
          )}
        </div>

        {/* Thin step progress bar */}
        <div className="mx-6 mt-4 mb-5 h-px bg-border shrink-0 overflow-hidden rounded-full">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          {step === 1 && <WizardStep1Welcome />}
          {step === 2 && (
            <WizardStep2Install onDeviceDetected={() => setStep(3)} />
          )}
          {step === 3 && (
            <WizardStep3Device
              device={pendingDevice}
              onDeviceLoaded={setPendingDevice}
            />
          )}
          {step === 4 && <WizardStep4Complete device={pendingDevice} />}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between">
          {/* Left slot: docs link on step 2 */}
          <div>
            {step === 2 && (
              <a
                href="https://docs.shellhub.io/user-guides/devices/adding"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                ? Docs
              </a>
            )}
          </div>

          {/* Right slot: Close (steps 1–3) + primary action */}
          <div className="flex items-center gap-3">
            {step < 4 && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-text-muted hover:text-text-secondary hover:bg-hover-medium transition-all"
              >
                Close
              </button>
            )}

            {step === 1 && (
              <PrimaryButton onClick={() => setStep(2)}>
                Next <ArrowRightIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
              </PrimaryButton>
            )}

            {step === 2 && (
              // Disabled — polling in WizardStep2Install auto-advances to step 3
              <PrimaryButton disabled>
                Next <ArrowRightIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
              </PrimaryButton>
            )}

            {step === 3 && (
              <PrimaryButton
                onClick={handleAccept}
                disabled={!pendingDevice || accepting}
                loading={accepting}
              >
                {accepting ? "Accepting…" : "Accept"}
              </PrimaryButton>
            )}

            {step === 4 && (
              <PrimaryButton onClick={onClose}>
                Finish <ArrowRightIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled = false,
  loading = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200
        bg-primary text-white hover:bg-primary/90 active:scale-[0.98]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100"
    >
      {children}
    </button>
  );
}
