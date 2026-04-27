"use client";
import { useState, useEffect } from "react";
// fallback quotes in case API is down
const FALLBACK_QUOTES = [
  { content: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { content: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { content: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { content: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { content: "Failure is the opportunity to begin again more intelligently.", author: "Henry Ford" }
];
export default function DailyQuote() {
  const [quote, setQuote] = useState("Loading inspiration...");
  const [author, setAuthor] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchQuote() {
      try {
        const response = await fetch("https://api.quotable.io/quotes/random?tags=motivational|inspirational");
        if (!response.ok) throw new Error("API Failed");
        const data = await response.json();
        setQuote(data[0].content);
        setAuthor(data[0].author);
      } catch (error) {
        // 2. If the internet or API fails, do this instead:
        const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
        const randomQuote = FALLBACK_QUOTES[randomIndex];
        
        setQuote(randomQuote.content);
        setAuthor(randomQuote.author);
      }
    }
    fetchQuote();
  }, []);
  
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
