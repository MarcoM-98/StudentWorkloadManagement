"use client";
import { useState, useEffect } from "react";

export default function DailyQuote() {
  const [quote, setQuote] = useState("Loading inspiration...");
  const [author, setAuthor] = useState("");
  const [mounted, setMounted] = useState(false);


// Prevents Next.js hydration errors before the API loads
// so it renders an invisible box until the browser is fully booted up and then it loads the quote from the api
  if (!mounted) return <div className="h-20 mb-6"></div>; 

  return (
    <div className="w-full py-4 mb-6 border-b border-zinc-200 dark:border-zinc-800">
      <p className="text-zinc-600 dark:text-zinc-400 italic text-center font-serif tracking-wide text-lg">
        "{quote}"
      </p>
      <p className="text-zinc-500 dark:text-zinc-500 text-xs text-center mt-2 uppercase tracking-widest font-semibold">
        — {author}
      </p>
    </div>
  );
}
