import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Tag } from "lucide-react";
import { blogPosts as staticBlogPosts } from "@/data/blog-posts";
import type { BlogBlock, BlogPost } from "@/types";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { resolveR2Url } from "@/lib/r2";

// Re-fetch every 5 minutes so newly published blog posts appear without redeploy
export const revalidate = 300;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

type FullBlogPost = BlogPost & {
  body?: BlogBlock[];
  gallery?: string[];
  seoTitle?: string;
  seoDescription?: string;
};

async function loadBlogPost(slug: string): Promise<FullBlogPost | null> {
  // 1) Try Supabase first (CMS-managed posts created by Diana)
  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  if (supabase) {
    const { data } = await supabase
      .from("blog_posts")
      .select(
        "slug, title, excerpt, cover_url, category, read_minutes, body, seo_title, seo_description, published_at, status",
      )
      .ilike("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (data) {
      const fallback = staticBlogPosts.find((p) => p.slug === data.slug);
      // body may be JSON blocks or a plain string (treat string as single paragraph)
      let body: BlogBlock[] | undefined;
      if (Array.isArray(data.body)) {
        body = data.body as BlogBlock[];
      } else if (typeof data.body === "string" && data.body.trim()) {
        body = [{ type: "paragraph", text: data.body }];
      } else {
        body = fallback?.body;
      }
      return {
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt ?? fallback?.excerpt ?? "",
        image: data.cover_url ? resolveR2Url(data.cover_url) : fallback?.image ?? "",
        date: data.published_at ?? fallback?.date ?? new Date().toISOString(),
        readTime:
          data.read_minutes != null
            ? `${data.read_minutes} min read`
            : fallback?.readTime ?? "5 min read",
        category: data.category ?? fallback?.category ?? "Journal",
        body,
        seoTitle: data.seo_title ?? fallback?.seoTitle,
        seoDescription: data.seo_description ?? fallback?.seoDescription,
      };
    }
  }

  // 2) Fallback to static (legacy seeded posts)
  const fallback = staticBlogPosts.find((p) => p.slug === slug);
  return fallback ?? null;
}

export async function generateStaticParams() {
  // Pre-render only static seeded posts; CMS posts render on-demand
  return staticBlogPosts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadBlogPost(slug);
  if (!post) return {};

  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    openGraph: {
      title: post.title,
      description: post.seoDescription ?? post.excerpt,
      images: [post.image],
    },
  };
}

function BlogBody({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading": {
            const level = block.level ?? 2;
            if (level === 3) {
              return (
                <h3
                  key={i}
                  className="text-xl sm:text-2xl font-semibold text-foreground mt-6"
                >
                  {block.text}
                </h3>
              );
            }
            return (
              <h2
                key={i}
                className="text-2xl sm:text-3xl font-semibold text-foreground mt-10"
              >
                {block.text}
              </h2>
            );
          }
          case "paragraph":
            return (
              <p
                key={i}
                className="text-base sm:text-lg text-muted-foreground leading-relaxed"
              >
                {block.text}
              </p>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-2 border-[#1D1D1F]/40 pl-5 italic text-foreground/80 text-lg leading-relaxed"
              >
                {block.text}
              </blockquote>
            );
          case "list":
            return (
              <ul
                key={i}
                className="list-disc list-outside pl-5 space-y-2 text-base text-muted-foreground leading-relaxed marker:text-[#1D1D1F]/40"
              >
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case "image":
            return (
              <figure key={i} className="my-10">
                <div className="rounded-2xl overflow-hidden card-shadow bg-[#F5F5F7] flex items-center justify-center mx-auto max-h-[85vh]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={block.src}
                    alt={block.alt ?? ""}
                    loading="lazy"
                    className="block w-auto h-auto max-w-full max-h-[85vh] object-contain"
                  />
                </div>
                {block.caption && (
                  <figcaption className="mt-3 text-xs text-muted-foreground text-center italic">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await loadBlogPost(slug);
  if (!post) notFound();

  const otherPosts = staticBlogPosts.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <>
      <article>
        <div className="relative h-[50vh] sm:h-[60vh] overflow-hidden bg-[#1D1D1F]">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover opacity-70"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 section-padding pb-12 sm:pb-16">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 text-xs text-white/60 mb-4">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {post.category}
                </span>
                <span>&middot;</span>
                <span>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span>&middot;</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.readTime}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-tight">
                {post.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="section-padding py-12 sm:py-16">
          <div className="max-w-3xl mx-auto">
            <p className="text-lg sm:text-xl text-foreground/80 leading-relaxed font-light mb-10">
              {post.excerpt}
            </p>

            {post.body && post.body.length > 0 ? (
              <BlogBody blocks={post.body} />
            ) : (
              <p className="text-base text-muted-foreground leading-relaxed">
                Full article coming soon.
              </p>
            )}

            {post.gallery && post.gallery.length > 0 && (
              <div className="mt-14">
                <h3 className="text-lg font-semibold text-foreground mb-6">
                  From the journey
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {post.gallery.map((src, i) => (
                    <div
                      key={src}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden card-shadow bg-[#F5F5F7]"
                    >
                      <Image
                        src={src}
                        alt={`${post.title} — ${i + 2}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

      {otherPosts.length > 0 && (
        <section className="section-padding pb-20 sm:pb-24">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold text-foreground mb-8">
              More from The Travel Journal
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {otherPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group block overflow-hidden rounded-xl bg-white card-shadow hover:card-shadow-hover transition-shadow duration-500"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={related.image}
                      alt={related.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                      {related.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to The Travel Journal
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
