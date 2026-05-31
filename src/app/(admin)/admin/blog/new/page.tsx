import { BlogPostForm } from "@/components/admin/blog-post-form";

export const metadata = { title: "New blog post — Admin DEXTGO" };

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">New blog post</h1>
      <BlogPostForm />
    </div>
  );
}
