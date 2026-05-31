import { blogPosts } from "@/data/blog-posts";
import { SectionHeading } from "@/components/shared/section-heading";
import { BlogSlider } from "@/components/blog/blog-slider";
import type { BlogPost } from "@/types";

export function TravelJournal({ posts = blogPosts }: { posts?: readonly BlogPost[] }) {
  return (
    <section className="section-padding section-gap">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeading
          title="The Travel Journal"
          subtitle="Stories of discovery and expert perspectives"
        />

        <div className="mt-6">
          <BlogSlider posts={posts} />
        </div>
      </div>
    </section>
  );
}
