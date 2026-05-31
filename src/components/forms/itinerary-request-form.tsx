"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Users,
  Heart,
  Send,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import {
  itineraryRequestSchema,
  type ItineraryRequestData,
} from "@/lib/validations";
import { submitItineraryRequest } from "@/app/(marketing)/personalized-itineraries/actions";
import { countries } from "@/data/countries";

const steps = [
  { id: 1, label: "Trip Details", icon: MapPin },
  { id: 2, label: "Preferences", icon: Heart },
  { id: 3, label: "Your Info", icon: Users },
];

const tripTypes = [
  "Solo Adventure",
  "Family Trip",
  "Couple Trip",
  "Group Travel",
];

const budgetRanges = [
  "Under €500",
  "€500 — €1,000",
  "€1,000 — €2,500",
  "€2,500 — €5,000",
  "€5,000+",
];

export function ItineraryRequestForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [deliveryStatus, setDeliveryStatus] = useState<{
    savedToCms: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ItineraryRequestData>({
    resolver: zodResolver(itineraryRequestSchema),
  });


  const nextStep = async () => {
    let fieldsToValidate: (keyof ItineraryRequestData)[] = [];
    if (currentStep === 1) fieldsToValidate = ["destination", "tripType", "startDate", "endDate"];
    if (currentStep === 2) fieldsToValidate = ["groupSize", "budget"];

    const valid = await trigger(fieldsToValidate);
    if (valid) setCurrentStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const onSubmit = async (data: ItineraryRequestData) => {
    if (!acceptPrivacy || !acceptTerms) return;
    try {
      setErrorMessage(null);
      const result = await submitItineraryRequest(data);
      if (result.success) {
        setDeliveryStatus({ savedToCms: !!result.savedToCms });
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(result.error ?? "Failed to send request");
        setTimeout(() => setStatus("idle"), 5000);
      }
    } catch {
      setStatus("error");
      setErrorMessage("Failed to send request");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-12 text-center"
      >
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Request received!
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Thank you! Our team will review your request and send you a personalised
          payment link within <strong>1 to 5 days</strong>. No payment is needed right now — we will
          contact you first.
        </p>
      </motion.div>
    );
  }

  const inputClass =
    "w-full h-12 px-4 rounded-xl bg-[#F5F5F7] border-0 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow";
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  currentStep >= step.id
                    ? "bg-[#1D1D1F] text-white"
                    : "bg-[#F5F5F7] text-muted-foreground"
                }`}
              >
                {step.id}
              </div>
              <span className="hidden sm:block mt-2 text-[10px] font-medium text-muted-foreground">
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-12 sm:w-20 lg:w-28 h-px mx-2 sm:mx-3 mb-5 sm:mb-0 transition-colors ${
                  currentStep > step.id ? "bg-[#1D1D1F]" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {status === "error" && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {errorMessage ?? "Failed to send request. Please try again."}
          </div>
        )}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Destination
                </label>
                <select {...register("destination")} className={selectClass} defaultValue="">
                  <option value="" disabled>Select a destination</option>
                  {countries.map((c) => (
                    <option key={c.slug} value={c.name}>{c.name}</option>
                  ))}
                  <option value="other">Other (specify below)</option>
                </select>
                {errors.destination && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.destination.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Type of Trip
                </label>
                <select {...register("tripType")} className={selectClass} defaultValue="">
                  <option value="" disabled>Select trip type</option>
                  {tripTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.tripType && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.tripType.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Start Date
                  </label>
                  <input {...register("startDate")} type="date" className={inputClass} />
                  {errors.startDate && (
                    <p className="mt-1.5 text-xs text-destructive">{errors.startDate.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    End Date
                  </label>
                  <input {...register("endDate")} type="date" className={inputClass} />
                  {errors.endDate && (
                    <p className="mt-1.5 text-xs text-destructive">{errors.endDate.message}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Group Size
                </label>
                <input
                  {...register("groupSize")}
                  type="number"
                  min="1"
                  className={inputClass}
                  placeholder="Number of travelers"
                />
                {errors.groupSize && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.groupSize.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Budget Range
                </label>
                <select {...register("budget")} className={selectClass} defaultValue="">
                  <option value="" disabled>Select budget range</option>
                  {budgetRanges.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {errors.budget && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.budget.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Interests & Activities
                  <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                </label>
                <textarea
                  {...register("interests")}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border-0 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow resize-none"
                  placeholder="E.g., food tours, hiking, museums, family-friendly activities..."
                />
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Your Name
                </label>
                <input {...register("name")} className={inputClass} placeholder="Full name" />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className={inputClass}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Special Requests
                  <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                </label>
                <textarea
                  {...register("specialRequests")}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border-0 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow resize-none"
                  placeholder="Dietary restrictions, accessibility needs, must-see locations..."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {currentStep === 3 && (
          <div className="mt-5 space-y-3 rounded-xl border border-black/[0.07] bg-[#FAFAFA] p-4">
            <p className="text-xs font-semibold text-foreground/70 uppercase tracking-[0.14em]">
              Legal agreements
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
              />
              <span className="text-xs text-foreground/70 leading-relaxed">
                I accept the{" "}
                <a
                  href={process.env.NEXT_PUBLIC_IUBENDA_TERMS_URL ?? "https://www.iubenda.com/terms-and-conditions/"}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-foreground hover:text-foreground/80"
                >
                  Terms and Conditions
                </a>
                {" "}and the{" "}
                <a
                  href={process.env.NEXT_PUBLIC_IUBENDA_PRIVACY_URL ?? "https://www.iubenda.com/privacy-policy/"}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-foreground hover:text-foreground/80"
                >
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
              />
              <span className="text-xs text-foreground/70 leading-relaxed">
                I expressly agree that the digital content will be provided immediately after
                purchase and that I lose my 14-day right of withdrawal once I access or download
                the content.
              </span>
            </label>
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1D1D1F] text-white text-sm font-semibold rounded-xl hover:bg-[#1D1D1F]/90 transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-right">
              <p className="mb-2 text-[11px] text-foreground/55">
                No payment needed now. We will review and send you a payment link within 1 to 5 days.
              </p>
              <button
                type="submit"
                disabled={isSubmitting || !acceptPrivacy || !acceptTerms}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1D1D1F] text-white text-sm font-semibold rounded-xl hover:bg-[#1D1D1F]/90 transition-colors disabled:opacity-60"
              >
                {isSubmitting ? (
                  "Submitting…"
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Request
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
