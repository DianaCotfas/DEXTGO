import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HorizontalSlider } from "@/components/shared/horizontal-slider";
import type { BlogPost } from "@/types";

interface BlogSliderProps {
  posts: readonly BlogPost[];
}

export function BlogSlider({ posts }: BlogSliderProps) {
  return (
    <HorizontalSlider ariaLabel="Travel journal articles" gapPx={10}>
      {posts.map((post) => (
        <div
          key={post.slug}
          className="snap-start shrink-0 w-[82%] sm:w-[48%] md:w-[39%] lg:w-[31%]"
        >
          <Link
            href={`/blog/${post.slug}`}
            className="group block h-full overflow-hidden rounded-2xl bg-white card-shadow hover:card-shadow-hover transition-shadow duration-500"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.image}
                alt={post.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center max-w-full truncate px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold text-[#1D1D1F]">
                  {post.category}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span>&middot;</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="text-base font-semibold text-foreground leading-snug group-hover:text-foreground/80 transition-colors line-clamp-2">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>
              <span className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-foreground group-hover:gap-2.5 transition-all duration-300">
                Read More
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        </div>
      ))}
    </HorizontalSlider>
  );
}
