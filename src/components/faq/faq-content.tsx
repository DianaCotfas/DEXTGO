"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqData } from "@/data/faq";

export function FAQContent() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQ = faqData
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.items.length > 0);

  return (
    <section className="section-padding section-gap">
      <div className="mx-auto max-w-3xl">
        <div className="relative mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-5 rounded-2xl bg-[#F5F5F7] border-0 text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
          />
        </div>

        {filteredFAQ.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No questions found matching &ldquo;{searchQuery}&rdquo;
          </p>
        ) : (
          <div className="space-y-12">
            {filteredFAQ.map((category) => (
              <div key={category.category}>
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  {category.category}
                </h2>
                <Accordion className="space-y-3">
                  {category.items.map((item, i) => (
                    <AccordionItem
                      key={i}
                      value={`${category.category}-${i}`}
                      className="bg-white rounded-xl card-shadow border-0 px-6 overflow-hidden"
                    >
                      <AccordionTrigger className="text-left text-sm sm:text-base font-medium py-5 hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
