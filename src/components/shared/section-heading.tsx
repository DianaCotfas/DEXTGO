interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className = "",
}: SectionHeadingProps) {
  return (
    <div
      className={`${align === "center" ? "text-center" : "text-left"} ${className}`}
    >
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-4">
          {eyebrow}
        </p>
      )}
      <h2 className="text-[22px] sm:text-[26px] lg:text-[32px] font-medium tracking-[-0.015em] text-balance">
        {title}
      </h2>
      <div
        className={`mt-4 h-[1px] w-10 bg-[#1D1D1F]/25 ${
          align === "center" ? "mx-auto" : ""
        }`}
      />
      {subtitle && (
        <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed font-light">
          {subtitle}
        </p>
      )}
    </div>
  );
}
