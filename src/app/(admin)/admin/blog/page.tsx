import Link from "next/link";
import { Plus } from "lucide-react";
import { blogPosts } from "@/data/blog-posts";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { syncStaticContentAction } from "../actions";

export const metadata = { title: "Blog — Admin DEXTGO" };

export default async function AdminBlogPage() {
  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  const { data: dbPosts } = supabase
    ? await supabase
        .from("blog_posts")
        .select("slug, title, category, status, updated_at")
        .order("updated_at", { ascending: false })
    : { data: null };
  const fallbackPosts = blogPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    category: post.category,
    status: "published",
    updated_at: post.date,
    source: "static" as const,
  }));
  const posts =
    (dbPosts ?? []).length > 0
      ? (dbPosts ?? []).map((post) => ({ ...post, source: "database" as const }))
      : fallbackPosts;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
          <p className="text-sm text-foreground/60">Posts published on dextgo.com/blog.</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5"
        >
          <Plus className="w-4 h-4" /> New post
        </Link>
      </header>

      {(dbPosts ?? []).length === 0 && fallbackPosts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Showing blog posts from local static content. Sync them to Supabase to edit
          in CMS.
          <form action={syncStaticContentAction} className="mt-2">
            <button
              type="submit"
              className="rounded-full bg-white border border-amber-300 px-4 py-1.5 text-xs font-semibold text-amber-900"
            >
              Sync now
            </button>
          </form>
        </div>
      )}

      <div className="rounded-2xl bg-white border border-black/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#FAFAFA] text-xs font-semibold uppercase tracking-wider text-foreground/60">
            <tr>
              <th className="text-left px-5 py-3">Title</th>
              <th className="text-left px-5 py-3">Category</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-right px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05]">
            {posts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-foreground/50">
                  No posts yet.
                </td>
              </tr>
            )}
            {posts.map((p) => (
              <tr key={p.slug}>
                <td className="px-5 py-3 font-medium">{p.title}</td>
                <td className="px-5 py-3 text-foreground/60">{p.category}</td>
                <td className="px-5 py-3">
                  <span className="mr-2">{p.status}</span>
                  {p.source === "static" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900">
                      static
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  {p.source === "database" ? (
                    <Link
                      href={`/admin/blog/${p.slug}`}
                      className="text-xs font-semibold text-foreground hover:underline"
                    >
                      Edit
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-foreground/50">
                      Sync to edit
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
