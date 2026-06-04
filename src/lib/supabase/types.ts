/**
 * Hand-written Supabase types for DEXTGO.
 * Mirrors supabase/migrations/0001_init.sql so client + server code is typed
 * end-to-end without needing the supabase-cli generator step.
 *
 * The shape (Tables / Views / Functions / Enums / CompositeTypes, every table
 * carrying a `Relationships` tuple) matches what `@supabase/postgrest-js`
 * expects for `GenericSchema`. Without it, every query collapses to `never`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type EmptyRel = [];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: EmptyRel;
      };
      countries: {
        Row: {
          slug: string;
          name: string;
          tagline: string | null;
          description: string | null;
          cover_url: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          name: string;
          tagline?: string | null;
          description?: string | null;
          cover_url?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          name?: string;
          tagline?: string | null;
          description?: string | null;
          cover_url?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: EmptyRel;
      };
      regions: {
        Row: {
          country_slug: string;
          slug: string;
          name: string;
          tagline: string | null;
          description: string | null;
          cover_url: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          country_slug: string;
          slug: string;
          name: string;
          tagline?: string | null;
          description?: string | null;
          cover_url?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          country_slug?: string;
          slug?: string;
          name?: string;
          tagline?: string | null;
          description?: string | null;
          cover_url?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: EmptyRel;
      };
      itineraries: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          description: string | null;
          sales_preview: string | null;
          preview_image_urls: string[];
          extras: Json | null;
          hero_image_url: string | null;
          hero_video_id: string | null;
          country_slug: string | null;
          region_slug: string | null;
          duration: string | null;
          price_cents: number;
          currency: string;
          status: "draft" | "published" | "archived";
          stripe_price_id: string | null;
          category: string | null;
          category_color: string | null;
          pdf_r2_key: string | null;
          pdf_generated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          description?: string | null;
          sales_preview?: string | null;
          preview_image_urls?: string[];
          extras?: Json | null;
          hero_image_url?: string | null;
          hero_video_id?: string | null;
          country_slug?: string | null;
          region_slug?: string | null;
          duration?: string | null;
          price_cents?: number;
          currency?: string;
          status?: "draft" | "published" | "archived";
          stripe_price_id?: string | null;
          category?: string | null;
          category_color?: string | null;
          pdf_r2_key?: string | null;
          pdf_generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          excerpt?: string | null;
          description?: string | null;
          sales_preview?: string | null;
          preview_image_urls?: string[];
          extras?: Json | null;
          hero_image_url?: string | null;
          hero_video_id?: string | null;
          country_slug?: string | null;
          region_slug?: string | null;
          duration?: string | null;
          price_cents?: number;
          currency?: string;
          status?: "draft" | "published" | "archived";
          stripe_price_id?: string | null;
          category?: string | null;
          category_color?: string | null;
          pdf_r2_key?: string | null;
          pdf_generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: EmptyRel;
      };
      itinerary_steps: {
        Row: {
          id: string;
          itinerary_id: string;
          position: number;
          kind: "step" | "pin" | "audio" | "tip";
          title: string;
          body: string | null;
          lat: number | null;
          lng: number | null;
          audio_url: string | null;
          audio_duration_seconds: number | null;
          image_urls: string[];
          day: number | null;
          day_title: string | null;
          official_url: string | null;
          google_maps_url: string | null;
          address: string | null;
          day_intro: string | null;
          info_data: string | null;
          description_long: string | null;
          description_kids: string | null;
          expert_tips: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          itinerary_id: string;
          position: number;
          kind: "step" | "pin" | "audio" | "tip";
          title: string;
          body?: string | null;
          lat?: number | null;
          lng?: number | null;
          audio_url?: string | null;
          audio_duration_seconds?: number | null;
          image_urls?: string[];
          day?: number | null;
          day_title?: string | null;
          official_url?: string | null;
          google_maps_url?: string | null;
          address?: string | null;
          day_intro?: string | null;
          info_data?: string | null;
          description_long?: string | null;
          description_kids?: string | null;
          expert_tips?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          itinerary_id?: string;
          position?: number;
          kind?: "step" | "pin" | "audio" | "tip";
          title?: string;
          body?: string | null;
          lat?: number | null;
          lng?: number | null;
          audio_url?: string | null;
          audio_duration_seconds?: number | null;
          image_urls?: string[];
          day?: number | null;
          day_title?: string | null;
          official_url?: string | null;
          google_maps_url?: string | null;
          address?: string | null;
          day_intro?: string | null;
          info_data?: string | null;
          description_long?: string | null;
          description_kids?: string | null;
          expert_tips?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: EmptyRel;
      };
      blog_posts: {
        Row: {
          slug: string;
          title: string;
          excerpt: string | null;
          cover_url: string | null;
          category: string | null;
          read_minutes: number | null;
          body: Json;
          seo_title: string | null;
          seo_description: string | null;
          published_at: string | null;
          status: "draft" | "published" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          title: string;
          excerpt?: string | null;
          cover_url?: string | null;
          category?: string | null;
          read_minutes?: number | null;
          body?: Json;
          seo_title?: string | null;
          seo_description?: string | null;
          published_at?: string | null;
          status?: "draft" | "published" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          excerpt?: string | null;
          cover_url?: string | null;
          category?: string | null;
          read_minutes?: number | null;
          body?: Json;
          seo_title?: string | null;
          seo_description?: string | null;
          published_at?: string | null;
          status?: "draft" | "published" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: EmptyRel;
      };
      gallery_items: {
        Row: {
          id: string;
          image_url: string;
          caption: string | null;
          location: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          caption?: string | null;
          location?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          image_url?: string;
          caption?: string | null;
          location?: string | null;
          position?: number;
          created_at?: string;
        };
        Relationships: EmptyRel;
      };
      hero_media: {
        Row: {
          page_slug: string;
          image_url: string | null;
          video_id: string | null;
          updated_at: string;
        };
        Insert: {
          page_slug: string;
          image_url?: string | null;
          video_id?: string | null;
          updated_at?: string;
        };
        Update: {
          page_slug?: string;
          image_url?: string | null;
          video_id?: string | null;
          updated_at?: string;
        };
        Relationships: EmptyRel;
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          itinerary_id: string | null;
          itinerary_slug: string | null;
          stripe_session_id: string | null;
          stripe_payment_intent_id: string | null;
          amount_cents: number;
          currency: string;
          status: "pending" | "paid" | "refunded" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          itinerary_id?: string | null;
          itinerary_slug?: string | null;
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount_cents: number;
          currency?: string;
          status?: "pending" | "paid" | "refunded" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          email?: string;
          itinerary_id?: string | null;
          itinerary_slug?: string | null;
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount_cents?: number;
          currency?: string;
          status?: "pending" | "paid" | "refunded" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: EmptyRel;
      };
      newsletter_subscribers: {
        Row: {
          email: string;
          consented_at: string;
          source: string | null;
          created_at: string;
        };
        Insert: {
          email: string;
          consented_at?: string;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          consented_at?: string;
          source?: string | null;
          created_at?: string;
        };
        Relationships: EmptyRel;
      };
      saved_trips: {
        Row: {
          user_id: string;
          itinerary_slug: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          itinerary_slug: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          itinerary_slug?: string;
          created_at?: string;
        };
        Relationships: EmptyRel;
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string | null;
          message: string;
          consent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          subject?: string | null;
          message: string;
          consent?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          subject?: string | null;
          message?: string;
          consent?: boolean;
          created_at?: string;
        };
        Relationships: EmptyRel;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
