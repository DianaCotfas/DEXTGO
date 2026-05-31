"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { contactFormSchema, type ContactFormData } from "@/lib/validations";
import { submitContactForm } from "@/app/(marketing)/contact/actions";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      const result = await submitContactForm(data);
      if (result.success) {
        setStatus("success");
        reset();
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 5000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Name
          </label>
          <input
            {...register("name")}
            className="w-full h-12 px-4 rounded-xl bg-[#F5F5F7] border-0 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
            placeholder="Your name"
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email
          </label>
          <input
            {...register("email")}
            type="email"
            className="w-full h-12 px-4 rounded-xl bg-[#F5F5F7] border-0 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
            placeholder="your@email.com"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Subject
        </label>
        <input
          {...register("subject")}
          className="w-full h-12 px-4 rounded-xl bg-[#F5F5F7] border-0 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
          placeholder="How can we help?"
        />
        {errors.subject && (
          <p className="mt-1.5 text-xs text-destructive">
            {errors.subject.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Message
        </label>
        <textarea
          {...register("message")}
          rows={5}
          className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border-0 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow resize-none"
          placeholder="Tell us more..."
        />
        {errors.message && (
          <p className="mt-1.5 text-xs text-destructive">
            {errors.message.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 bg-[#1D1D1F] text-white text-sm font-semibold rounded-xl hover:bg-[#1D1D1F]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Sending...
          </span>
        ) : status === "success" ? (
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Message Sent!
          </span>
        ) : status === "error" ? (
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Failed to Send — Try Again
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Send Message
          </span>
        )}
      </button>
    </form>
  );
}
