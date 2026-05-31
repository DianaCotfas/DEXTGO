import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { BlogSlider } from "@/components/blog/blog-slider";
import { loadBlogSliderPosts, loadHeroMediaByPageSlug } from "@/lib/marketing-content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "The Travel Journal",
  description:
    "Stories of discovery and expert perspectives on modern exploration. Read the DEXTGO travel blog.",
};

export default async function BlogPage() {
  const [heroMedia, posts] = await Promise.all([
    loadHeroMediaByPageSlug("blog"),
    loadBlogSliderPosts(),
  ]);
  return (
    <>
      <PageHero
        title="The Travel Journal"
        subtitle="Stories of discovery and expert perspectives on modern exploration."
        backgroundImage={heroMedia.image}
        backgroundVideo={heroMedia.video}
        backgroundVideoHls={heroMedia.videoHls}
        backgroundVideoPoster={heroMedia.videoPoster ?? heroMedia.image}
      />

      <section className="section-padding section-gap">
        <div className="mx-auto max-w-[1400px]">
          <BlogSlider posts={posts} />
        </div>
      </section>
    </>
  );
}
