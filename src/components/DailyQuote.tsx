"use client";
import { useState, useEffect } from "react";

// fallback quotes in case API is down
const FALLBACK_QUOTES = [
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { quote: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Failure is the opportunity to begin again more intelligently.", author: "Henry Ford" }
];

export default function DailyQuote() {
  const [quote, setQuote] = useState("Loading inspiration...");
  const [author, setAuthor] = useState("");
  const [mounted, setMounted] = useState(false);

  //  Wrap the fetching logic in a reusable function
  const fetchNewQuote = async () => {
    let newQuote = "";
    let newAuthor = "";

    try {
      const response = await fetch("https://quoteslate.vercel.app/api/quotes/random?tags=motivation,life,inspiration");
      if (!response.ok) throw new Error("API Failed");
      const data = await response.json();
      newQuote = data.quote;
      newAuthor = data.author;
    } catch (error) {
      // If the internet or API fails, do this instead:
      const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
      newQuote = FALLBACK_QUOTES[randomIndex].quote;
      newAuthor = FALLBACK_QUOTES[randomIndex].author;
    }

    setQuote(newQuote);
    setAuthor(newAuthor);

    // Save the new quote to memory with today's date stamp
    const today = new Date().toDateString(); 
    localStorage.setItem("enchiladas_quote_date", today);
    localStorage.setItem("enchiladas_daily_quote", JSON.stringify({ quote: newQuote, author: newAuthor }));
  };

  useEffect(() => {
    setMounted(true);

    //  Check the browser's memory when the component loads
    const storedDate = localStorage.getItem("enchiladas_quote_date");
    const storedQuoteStr = localStorage.getItem("enchiladas_daily_quote");
    const today = new Date().toDateString();

    if (storedDate === today && storedQuoteStr) {
      // It's still the same day, parse the saved quote.
      try {
        const storedQuote = JSON.parse(storedQuoteStr);
        setQuote(storedQuote.quote);
        setAuthor(storedQuote.author);
      } catch (e) {
        // Fallback just in case localStorage data gets corrupted
        fetchNewQuote();
      }
    } else {
      // It's a brand new day, new quote
      fetchNewQuote();
    }
  }, []);
  
// Prevents Next.js hydration errors before the API loads
// so it renders an invisible box until the browser is fully booted up and then it loads the quote from the api
  if (!mounted) return <div className="h-20 mb-6"></div>; 

  return (
    <div className="relative w-full py-4 mb-6 border-b border-zinc-200 dark:border-zinc-800 group">
      <p className="text-zinc-600 dark:text-zinc-400 italic text-center font-serif tracking-wide text-lg px-8">
        "{quote}"
      </p>
      <div className="flex justify-center items-center mt-2 gap-2 relative">
        <p className="text-zinc-500 dark:text-zinc-500 text-xs text-center uppercase tracking-widest font-semibold">
          — {author}
        </p>
        
        {/* Refresh Button */}
        <button
          onClick={fetchNewQuote}
          className="absolute -right-4 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-blue-500 transition-opacity outline-none p-1"
          title="Get a new quote"
        >
          ↻
        </button>
      </div>
    </div>
  );
}