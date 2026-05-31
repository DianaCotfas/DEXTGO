import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5 text-center">
      <h1 className="text-7xl sm:text-8xl font-bold text-[#F5F5F7]">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-foreground">
        Page Not Found
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center px-6 py-3 bg-[#1D1D1F] text-white text-sm font-semibold rounded-full hover:bg-[#1D1D1F]/90 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
