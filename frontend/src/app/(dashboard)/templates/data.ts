import {
    BankOutlined,
    FormatPainterOutlined,
    ReadOutlined,
    CodeOutlined,
    ShopOutlined,
    ProjectOutlined,
    GlobalOutlined,
} from '@ant-design/icons';

export const CATEGORIES = [
    { name: 'Business', icon: BankOutlined, color: '#4bce97' },
    { name: 'Design', icon: FormatPainterOutlined, color: '#e2b203' },
    { name: 'Education', icon: ReadOutlined, color: '#faa53d' },
    { name: 'Engineering', icon: CodeOutlined, color: '#f87462' },
    { name: 'Marketing', icon: ShopOutlined, color: '#9f8fef' },
    { name: 'Project management', icon: ProjectOutlined, color: '#579dff' },
    { name: 'Remote work', icon: GlobalOutlined, color: '#60c6d2' },
];

export interface TemplateList {
    id: string;
    title: string;
    color: string;
    cards: { id: string; title: string; description?: string; cover_url?: string; due_date?: string }[];
}

export interface Template {
    id: string;
    title: string;
    author: string;
    description: string;
    fullDescription?: string;
    category: string;
    coverColor?: string;
    coverUrl?: string;
    tags?: string[];
    copies?: number;
    views?: number;
    lists?: TemplateList[];
}

export const FEATURED_TEMPLATES: Template[] = [
    {
        id: '1',
        title: 'New Hire Onboarding',
        author: 'People Team',
        description: 'Get your new employees up and running with this onboarding board.',
        fullDescription: `A comprehensive onboarding template to help new hires get started quickly.

This template includes:
1. Pre-boarding checklist for HR
2. First day orientation tasks
3. Week 1 goals and meetings
4. 30-60-90 day milestones
5. Resources and documentation links

Use this board to ensure a consistent and welcoming experience for all new team members.`,
        category: 'HR & Operations',
        coverColor: '#7bc86c',
        copies: 15200,
        views: 89000,
        lists: [
            { id: 'l1', title: 'Pre-boarding', color: '#7bc86c', cards: [{ id: 'c1', title: 'Send welcome email', due_date: '2026-01-25T12:00:00Z' }, { id: 'c2', title: 'Prepare workstation', due_date: '2026-01-26T09:00:00Z' }] },
            { id: 'l2', title: 'Day 1', color: '#f5dd29', cards: [{ id: 'c3', title: 'Office tour', due_date: '2026-01-27T10:00:00Z' }, { id: 'c4', title: 'Meet the team', due_date: '2026-01-27T14:00:00Z' }] },
            { id: 'l3', title: 'Week 1', color: '#579dff', cards: [{ id: 'c5', title: 'Complete training', due_date: '2026-02-01T17:00:00Z' }] },
        ],
    },
    {
        id: '2',
        title: 'The List',
        author: 'Trello Engineering Team',
        description: 'Use this template to organize your to-do lists and keep track of your tasks.',
        fullDescription: `A simple yet powerful template for managing your daily tasks.

Key features:
1. Easy drag-and-drop task management
2. Priority labels for urgent items
3. Due date tracking
4. Progress visualization

Perfect for personal productivity or small team task tracking.`,
        category: 'Productivity',
        coverColor: '#26344d',
        copies: 45000,
        views: 230000,
        lists: [
            { id: 'l1', title: 'To Do', color: '#f87462', cards: [{ id: 'c1', title: 'Task 1' }, { id: 'c2', title: 'Task 2' }] },
            { id: 'l2', title: 'Doing', color: '#faa53d', cards: [{ id: 'c3', title: 'Task 3' }] },
            { id: 'l3', title: 'Done', color: '#4bce97', cards: [{ id: 'c4', title: 'Completed task' }] },
        ],
    },
    {
        id: '3',
        title: 'Better Work Habits Challenge',
        author: 'Trello Team',
        description: 'Track, reflect, and celebrate new effective habits that you want to build at work.',
        fullDescription: `Build better work habits with this 30-day challenge template.

How it works:
1. Pick a category (e.g., productivity, health, learning)
2. Create a board using this template
3. Track your daily progress
4. Reflect on what works and what doesn't
5. Celebrate your wins!

Join thousands of professionals who have transformed their work habits.`,
        category: 'Productivity',
        coverUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=600&q=80',
        coverColor: '#cd8de5',
        copies: 8900,
        views: 56000,
        lists: [
            { id: 'l1', title: 'Habits to Build', color: '#9f8fef', cards: [{ id: 'c1', title: 'Morning routine' }, { id: 'c2', title: 'Deep work blocks' }] },
            { id: 'l2', title: 'In Progress', color: '#579dff', cards: [{ id: 'c3', title: 'Daily standup' }] },
            { id: 'l3', title: 'Mastered', color: '#4bce97', cards: [{ id: 'c4', title: 'Inbox zero' }] },
        ],
    },
];

export const BUSINESS_TEMPLATES: Template[] = [
    {
        id: 'b1',
        title: 'Client Workflow Management',
        author: 'Rachel S in Sales',
        description: 'Use this board to visually manage your client workflows.',
        fullDescription: `Streamline your client management process with this visual workflow board.

Features:
1. Client intake pipeline
2. Project status tracking
3. Communication logs
4. Deliverable checklists

Ideal for agencies, consultants, and freelancers managing multiple clients.`,
        category: 'Sales',
        coverColor: '#f5dd29',
        copies: 12300,
        views: 67000,
        lists: [
            { id: 'l1', title: 'Prospects', color: '#f5dd29', cards: [{ id: 'c1', title: 'New lead' }] },
            { id: 'l2', title: 'In Discussion', color: '#faa53d', cards: [{ id: 'c2', title: 'Proposal sent' }] },
            { id: 'l3', title: 'Active Clients', color: '#4bce97', cards: [{ id: 'c3', title: 'Acme Corp' }] },
        ],
    },
    {
        id: 'b2',
        title: 'Lean Canvas',
        author: 'Business Team',
        description: 'A 1-page business plan template that helps you deconstruct your idea into its key assumptions.',
        fullDescription: `The Lean Canvas is a 1-page business plan template that helps entrepreneurs deconstruct their idea into key assumptions.

Sections included:
1. Problem
2. Solution
3. Key Metrics
4. Unique Value Proposition
5. Unfair Advantage
6. Channels
7. Customer Segments
8. Cost Structure
9. Revenue Streams

Start validating your business idea today!`,
        category: 'Business',
        coverUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
        copies: 28000,
        views: 145000,
        lists: [
            { id: 'l1', title: 'Problem', color: '#f87462', cards: [{ id: 'c1', title: 'Define pain points' }] },
            { id: 'l2', title: 'Solution', color: '#4bce97', cards: [{ id: 'c2', title: 'Proposed solution' }] },
            { id: 'l3', title: 'Metrics', color: '#579dff', cards: [{ id: 'c3', title: 'Key KPIs' }] },
        ],
    },
    {
        id: 'b3',
        title: 'Nonprofit Project Management',
        author: 'Nonprofit Team',
        description: "Plan, organize, and manage your team's work with this project management board.",
        fullDescription: `A project management template designed specifically for nonprofit organizations.

Includes:
1. Grant tracking
2. Volunteer coordination
3. Event planning
4. Donor management
5. Impact measurement

Built by nonprofits, for nonprofits.`,
        category: 'Project Management',
        coverUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
        copies: 5600,
        views: 34000,
        lists: [
            { id: 'l1', title: 'Planning', color: '#579dff', cards: [{ id: 'c1', title: 'Define goals' }] },
            { id: 'l2', title: 'In Progress', color: '#faa53d', cards: [{ id: 'c2', title: 'Fundraising campaign' }] },
            { id: 'l3', title: 'Completed', color: '#4bce97', cards: [{ id: 'c3', title: 'Q1 report' }] },
        ],
    },
];

export const DESIGN_TEMPLATES: Template[] = [
    {
        id: 'd1',
        title: 'Design Project Template',
        author: 'Design Team',
        description: 'An easy-to-use template for tracking your design projects from start to finish.',
        fullDescription: `Manage your design projects with this comprehensive template.

Workflow stages:
1. Brief & Research
2. Ideation & Sketches
3. Design & Iteration
4. Review & Feedback
5. Final Delivery

Perfect for UX/UI designers, graphic designers, and creative teams.`,
        category: 'Design',
        coverUrl: 'https://images.unsplash.com/photo-1506784881475-0e408bbca849?auto=format&fit=crop&w=600&q=80',
        copies: 19000,
        views: 98000,
        lists: [
            { id: 'l1', title: 'Brief', color: '#9f8fef', cards: [{ id: 'c1', title: 'Project requirements' }] },
            { id: 'l2', title: 'In Design', color: '#579dff', cards: [{ id: 'c2', title: 'Wireframes' }] },
            { id: 'l3', title: 'Review', color: '#faa53d', cards: [{ id: 'c3', title: 'Stakeholder feedback' }] },
        ],
    },
    {
        id: 'd2',
        title: 'Design System Checklist',
        author: 'Product Design',
        description: 'A checklist for building a robust design system.',
        fullDescription: `Build a comprehensive design system with this checklist template.

Components covered:
1. Typography
2. Colors & Themes
3. Spacing & Layout
4. Icons & Illustrations
5. Components Library
6. Documentation

Essential for teams scaling their design operations.`,
        category: 'Design',
        coverUrl: 'https://images.unsplash.com/photo-1586717791821-3f44a5638d48?auto=format&fit=crop&w=600&q=80',
        copies: 7800,
        views: 42000,
        lists: [
            { id: 'l1', title: 'Foundation', color: '#e2b203', cards: [{ id: 'c1', title: 'Color palette' }, { id: 'c2', title: 'Typography scale' }] },
            { id: 'l2', title: 'Components', color: '#579dff', cards: [{ id: 'c3', title: 'Buttons' }] },
            { id: 'l3', title: 'Documentation', color: '#4bce97', cards: [{ id: 'c4', title: 'Usage guidelines' }] },
        ],
    },
    {
        id: 'd3',
        title: 'Freelance Branding Project',
        author: 'Freelancers',
        description: 'Manage your freelance branding projects with this template.',
        fullDescription: `A complete branding project template for freelance designers.

Phases:
1. Discovery & Research
2. Strategy & Positioning
3. Visual Identity Design
4. Brand Assets Creation
5. Client Handoff

Deliver professional branding projects on time and on budget.`,
        category: 'Design',
        coverColor: '#ff9f1a',
        copies: 4200,
        views: 21000,
        lists: [
            { id: 'l1', title: 'Discovery', color: '#ff9f1a', cards: [{ id: 'c1', title: 'Client interview' }] },
            { id: 'l2', title: 'Design', color: '#9f8fef', cards: [{ id: 'c2', title: 'Logo concepts' }] },
            { id: 'l3', title: 'Delivery', color: '#4bce97', cards: [{ id: 'c3', title: 'Brand guidelines' }] },
        ],
    },
];

// Combine all templates for easy lookup
export const ALL_TEMPLATES: Template[] = [
    ...FEATURED_TEMPLATES,
    ...BUSINESS_TEMPLATES,
    ...DESIGN_TEMPLATES,
];

// Helper function to find a template by ID
export function getTemplateById(id: string): Template | undefined {
    return ALL_TEMPLATES.find((t) => t.id === id);
}

// Helper function to get related templates (same category, excluding current)
export function getRelatedTemplates(template: Template, limit: number = 3): Template[] {
    return ALL_TEMPLATES
        .filter((t) => t.category === template.category && t.id !== template.id)
        .slice(0, limit);
}

// If not enough from same category, fill with random templates
export function getRelatedOrRandomTemplates(template: Template, limit: number = 3): Template[] {
    const related = getRelatedTemplates(template, limit);
    if (related.length >= limit) return related;

    const remaining = ALL_TEMPLATES
        .filter((t) => t.id !== template.id && !related.includes(t))
        .slice(0, limit - related.length);

    return [...related, ...remaining];
}
