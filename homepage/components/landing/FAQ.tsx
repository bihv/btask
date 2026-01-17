"use client";

import { useState } from "react";

const faqs = [
    {
        question: "Is Mello really free?",
        answer: "Yes, Mello is completely free and open source under the MIT license. There are no hidden costs, premium tiers, or feature restrictions. You get the full application with all features at no cost.",
    },
    {
        question: "Can I self-host Mello?",
        answer: "Absolutely! Mello is designed to be self-hosted. We provide Docker images and comprehensive documentation to help you deploy Mello on your own infrastructure. This gives you complete control over your data and privacy.",
    },
    {
        question: "How does Mello compare to Trello?",
        answer: "Mello offers similar core functionality to Trello — Kanban boards, cards, lists, labels, due dates, and team collaboration. The key differences are that Mello is open source, free, and can be self-hosted. Plus, you can customize it to fit your exact needs.",
    },
    {
        question: "Is my data secure?",
        answer: "Security is a top priority. When self-hosted, you have complete control over your data. Our cloud version uses industry-standard encryption and security practices. All data is encrypted in transit and at rest.",
    },
    {
        question: "Can I import data from other tools?",
        answer: "Yes, we provide import tools for popular project management platforms including Trello. You can migrate your boards, lists, and cards with just a few clicks.",
    },
    {
        question: "How can I contribute to the project?",
        answer: "We welcome contributions! Check out our GitHub repository and the CONTRIBUTING.md guide. You can contribute code, documentation, translations, or help answer questions in our community.",
    },
    {
        question: "Is there a mobile app?",
        answer: "Mello is fully responsive and works great on mobile browsers. Native iOS and Android apps are on our roadmap and being actively developed by our community contributors.",
    },
    {
        question: "Do you offer support?",
        answer: "We have an active community on GitHub Discussions and Discord where you can get help from both maintainers and other users. For organizations needing dedicated support, we offer professional support packages.",
    },
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faq" className="section-padding bg-white">
            <div className="container-custom">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium text-sm mb-6">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        FAQ
                    </div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                        Frequently Asked{" "}
                        <span className="gradient-text">Questions</span>
                    </h2>
                    <p className="text-lg text-[var(--color-text-muted)]">
                        Got questions? We&apos;ve got answers. If you can&apos;t find what you&apos;re looking for,
                        feel free to reach out to our community.
                    </p>
                </div>

                {/* FAQ Accordion */}
                <div className="max-w-3xl mx-auto">
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="border border-[var(--color-border)] rounded-xl overflow-hidden"
                            >
                                <button
                                    className="w-full flex items-center justify-between p-6 text-left cursor-pointer hover:bg-[var(--color-background)] transition-colors"
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                >
                                    <span className="font-semibold text-lg text-[var(--color-text)] pr-4">
                                        {faq.question}
                                    </span>
                                    <svg
                                        className={`w-5 h-5 text-[var(--color-primary)] flex-shrink-0 transition-transform duration-200 ${openIndex === index ? "rotate-180" : ""
                                            }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div
                                    className={`transition-all duration-200 ease-out ${openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                        } overflow-hidden`}
                                >
                                    <p className="px-6 pb-6 text-[var(--color-text-muted)] leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
