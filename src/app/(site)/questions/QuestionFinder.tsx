"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { CONTACT } from "@/lib/site";
import { cn } from "@/lib/utils";

const TOPICS = ["Sab", "Customer", "Shop owner", "Google aur bharosa"] as const;
type Topic = (typeof TOPICS)[number];

const QUESTIONS: { topic: Exclude<Topic, "Sab">; q: string; a: string }[] = [
  { topic: "Customer", q: "Kya customer ko app download karna padega?", a: "Nahi. Phone camera se QR scan karte hi review page khul jata hai." },
  { topic: "Customer", q: "Kya customer ko login karna padta hai?", a: "Semsorted par nahi. Review post karne ke liye customer apne Google account ka use karta hai." },
  { topic: "Customer", q: "Kya customer apna review badal sakta hai?", a: "Haan. Draft sirf shuruaat hai. Customer use edit kar sakta hai ya apne words me poora likh sakta hai." },
  { topic: "Customer", q: "Kya naam ya phone number maanga jata hai?", a: "Nahi. Review page par customer se naam, phone number ya email nahi maanga jata." },
  { topic: "Customer", q: "Kaunsi languages milti hain?", a: "English, Hindi aur Hinglish. Shop ke hisaab se language set hoti hai." },
  { topic: "Shop owner", q: "QR kaun banata hai?", a: "Semsorted admin panel se aapki shop ke liye QR banata hai. Website se koi bhi QR nahi bana sakta." },
  { topic: "Shop owner", q: "Kya chips meri shop ke hisaab se honge?", a: "Haan. Shop type ke hisaab se chips ready aate hain, aur unhe aapki shop ke liye badla ja sakta hai." },
  { topic: "Shop owner", q: "Chips badalne par naya QR lagana padega?", a: "Nahi. Chips badalne par bhi aapka wahi QR chalta rehta hai." },
  { topic: "Shop owner", q: "QR kahan lagana chahiye?", a: "Counter, bill desk ya table par, jahan customer aaram se phone nikalkar scan kar sake." },
  { topic: "Shop owner", q: "Kya meri shop type list me hogi?", a: "Chai stall se clinic tak 100 se zyada business types ready hain. Alag type ho to uske liye general chips se shuru kar sakte hain." },
  { topic: "Google aur bharosa", q: "Review kaun post karta hai?", a: "Customer khud apne Google account se post karta hai. Semsorted Google par kuch post nahi karta." },
  { topic: "Google aur bharosa", q: "Agar customer khush nahi hai to?", a: "Usse bhi same page aur same Google button milta hai. Low rating ka draft tareef nahi karta." },
  { topic: "Google aur bharosa", q: "Kya Semsorted kisi review ko hide kar sakta hai?", a: "Nahi. Review Google par customer ke account se jata hai, aur Semsorted use hide ya delete nahi kar sakta." },
  { topic: "Google aur bharosa", q: "Kya reviews ki guarantee hai?", a: "Nahi. Review dena customer ki apni marzi hai. Hum bas uska raasta aasan karte hain." },
  { topic: "Google aur bharosa", q: "Kya review ke badle discount de sakte hain?", a: "Nahi. Review ke badle reward dena Google ki policy ke khilaaf hai, aur Semsorted isme saath nahi deta." },
  { topic: "Google aur bharosa", q: "Kya Semsorted Google ka part hai?", a: "Nahi. Semsorted ek independent service hai aur Google se affiliated nahi hai." },
];

export function QuestionFinder() {
  const [topic, setTopic] = useState<Topic>("Sab");
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const results = QUESTIONS.filter((item) => (topic === "Sab" || item.topic === topic) && (!needle || `${item.q} ${item.a}`.toLowerCase().includes(needle)));

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Apna sawaal dhoondho</span>
        <Search aria-hidden className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-moss" />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Apna sawaal dhoondho, jaise QR ya rating" className="h-16 w-full rounded-full border border-line bg-white pl-14 pr-6 text-lg outline-none focus:border-g-blue focus:ring-2 focus:ring-g-blue/20" />
      </label>

      <div role="group" aria-label="Sawaal ka topic" className="mt-5 flex flex-wrap gap-2">
        {TOPICS.map((name) => (
          <button key={name} type="button" aria-pressed={topic === name} onClick={() => setTopic(name)} className={cn("min-h-11 rounded-full px-5 font-medium transition-colors", topic === name ? "bg-g-blue text-white" : "bg-mist text-moss hover:text-ink")}>
            {name}
          </button>
        ))}
      </div>

      <div className="mt-8" aria-live="polite">
        {results.map((item) => (
          <details key={item.q} className="group border-t border-line last:border-b">
            <summary className="flex min-h-[4.5rem] cursor-pointer list-none items-center justify-between gap-4 py-4 text-xl font-medium [&::-webkit-details-marker]:hidden">
              {item.q}
              <Plus aria-hidden className="size-6 shrink-0 text-moss transition-transform group-open:rotate-45" />
            </summary>
            <p className="max-w-[62ch] pb-6 text-lg leading-relaxed text-moss">{item.a}</p>
          </details>
        ))}
        {results.length === 0 && (
          <div className="rounded-2xl bg-mist p-8">
            <p className="text-xl font-medium">Is sawaal ka jawab yahan nahi mila.</p>
            <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center font-semibold text-whatsapp underline underline-offset-4">WhatsApp par poochho</a>
          </div>
        )}
      </div>
    </div>
  );
}
