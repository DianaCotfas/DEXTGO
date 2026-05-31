import { notFound } from "next/navigation";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { BlogPostForm } from "@/components/admin/blog-post-form";

export const metadata = { title: "Edit blog post — Admin DEXTGO" };

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditBlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  if (!supabase) notFound();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
      <BlogPostForm initial={post} />
    </div>
  );
}
