import Link from "next/link";

export default function Hero() {
    return (
        <section className="min-h-screen gradient-bg flex items-center pt-24 pb-16">
            <div className="container-custom">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium text-sm mb-6">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                            100% Open Source & Free Forever
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                            Organize Your Work,{" "}
                            <span className="gradient-text">Boost Your Team</span>
                        </h1>

                        <p className="text-lg md:text-xl text-[var(--color-text-muted)] mb-8 max-w-xl">
                            A powerful, open-source task management tool inspired by Trello.
                            Collaborate with your team, manage projects with Kanban boards,
                            and get things done — all for free.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <Link href="/register" className="btn-primary text-lg px-8 py-4">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Start Free Now
                            </Link>
                            <a
                                href="https://github.com/mello-app/mello"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary text-lg px-8 py-4"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                                View on GitHub
                            </a>
                        </div>

                        {/* Social Proof */}
                        <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                                        >
                                            {String.fromCharCode(64 + i)}
                                        </div>
                                    ))}
                                </div>
                                <span>1,000+ users</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                                <span className="ml-1">4.9/5 rating</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Product Preview */}
                    <div className="relative animate-float">
                        <div className="glass rounded-2xl p-4 shadow-2xl">
                            {/* Mock Kanban Board */}
                            <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-xl p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <span className="text-white/80 text-sm font-medium">Project Board</span>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {/* To Do Column */}
                                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                                        <h3 className="text-white font-semibold text-sm mb-2">To Do</h3>
                                        <div className="space-y-2">
                                            <div className="bg-white rounded-lg p-2 shadow-sm">
                                                <div className="w-8 h-1.5 bg-red-400 rounded mb-2"></div>
                                                <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
                                                <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                                            </div>
                                            <div className="bg-white rounded-lg p-2 shadow-sm">
                                                <div className="w-8 h-1.5 bg-yellow-400 rounded mb-2"></div>
                                                <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
                                                <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* In Progress Column */}
                                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                                        <h3 className="text-white font-semibold text-sm mb-2">In Progress</h3>
                                        <div className="space-y-2">
                                            <div className="bg-white rounded-lg p-2 shadow-sm">
                                                <div className="w-8 h-1.5 bg-blue-400 rounded mb-2"></div>
                                                <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
                                                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Done Column */}
                                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                                        <h3 className="text-white font-semibold text-sm mb-2">Done</h3>
                                        <div className="space-y-2">
                                            <div className="bg-white rounded-lg p-2 shadow-sm">
                                                <div className="w-8 h-1.5 bg-green-400 rounded mb-2"></div>
                                                <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
                                                <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                                            </div>
                                            <div className="bg-white rounded-lg p-2 shadow-sm">
                                                <div className="w-8 h-1.5 bg-purple-400 rounded mb-2"></div>
                                                <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
                                                <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-[var(--color-cta)]/20 rounded-full blur-2xl"></div>
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[var(--color-primary)]/20 rounded-full blur-3xl"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
