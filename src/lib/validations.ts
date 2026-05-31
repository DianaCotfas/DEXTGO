import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type NewsletterFormData = z.infer<typeof newsletterSchema>;

export const itineraryRequestSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  destination: z.string().min(1, "Please select a destination"),
  tripType: z.string().min(1, "Please select a trip type"),
  startDate: z.string().min(1, "Please select a start date"),
  endDate: z.string().min(1, "Please select an end date"),
  groupSize: z.string().min(1, "Please enter group size"),
  budget: z.string().min(1, "Please select a budget range"),
  interests: z.string().optional(),
  specialRequests: z.string().optional(),
});

export type ItineraryRequestData = z.infer<typeof itineraryRequestSchema>;
