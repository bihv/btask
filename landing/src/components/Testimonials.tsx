const testimonials = [
    {
        name: "Sarah Chen",
        role: "Product Manager at TechCorp",
        avatar: "SC",
        content: "Mello has transformed how our team manages projects. The Kanban boards are intuitive, and the fact that it's open source means we can customize it exactly how we need.",
        rating: 5,
    },
    {
        name: "Marcus Johnson",
        role: "Startup Founder",
        avatar: "MJ",
        content: "After trying countless project management tools, Mello stands out. It's free, feature-rich, and the self-hosting option gives us complete control over our data.",
        rating: 5,
    },
    {
        name: "Emily Rodriguez",
        role: "Engineering Lead",
        avatar: "ER",
        content: "The collaboration features are fantastic. Our distributed team relies on Mello daily. Comments, due dates, labels — everything just works seamlessly.",
        rating: 5,
    },
    {
        name: "David Kim",
        role: "Freelance Designer",
        avatar: "DK",
        content: "As a freelancer, I needed something simple yet powerful. Mello is perfect — I can manage multiple client projects without any subscription fees.",
        rating: 5,
    },
    {
        name: "Lisa Thompson",
        role: "CTO at InnovateTech",
        avatar: "LT",
        content: "We evaluated enterprise solutions but chose Mello for its simplicity and open-source nature. Our dev team can contribute back to the project too!",
        rating: 5,
    },
];

export default function Testimonials() {
    return (
        <section id="testimonials" className="section-padding bg-[var(--color-background)]">
            <div className="container-custom">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium text-sm mb-6">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Testimonials
                    </div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                        Loved by Teams{" "}
                        <span className="gradient-text">Worldwide</span>
                    </h2>
                    <p className="text-lg text-[var(--color-text-muted)]">
                        Join thousands of teams who have made Mello their go-to project management tool.
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className={`card cursor-pointer ${index === 0 ? "lg:col-span-2" : ""}`}
                        >
                            {/* Rating */}
                            <div className="flex gap-1 mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-[var(--color-text)] text-lg leading-relaxed mb-6">
                                &ldquo;{testimonial.content}&rdquo;
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-white font-bold">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <div className="font-semibold text-[var(--color-text)]">{testimonial.name}</div>
                                    <div className="text-sm text-[var(--color-text-muted)]">{testimonial.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
