import { ResourceData, ResourceType } from '../../datatype';

// ⚠️ Dummy data: baad me API se laayenge
export const RESOURCE_TYPES: { key: ResourceType; label: string }[] = [
  { key: 'proposal', label: 'Sample Proposals' },
  { key: 'ebook', label: 'EBooks' },
  { key: 'video', label: 'Training Videos' },
  { key: 'article', label: 'Articles' },
  { key: 'course', label: 'Courses' },
];

export const RESOURCE_DATA: Record<ResourceType, ResourceData[]> = {
  proposal: [
    { id: 1, type: 'proposal', title: 'Clean Mobility Initiatives for Sustainable Communities', tone: 'green', icon: 'bi-tree', tags: ['Environment', 'Conservation'], fileSize: '2.3 MB', pages: 19, date: '2025-01-15' },
    { id: 2, type: 'proposal', title: 'Safe and Clean Water for Rural Communities', tone: 'blue', icon: 'bi-droplet', tags: ['Water & Sanitation', 'Water'], fileSize: '2.0 MB', pages: 20, date: '2024-12-28' },
    { id: 3, type: 'proposal', title: 'Food Security Programs for Vulnerable Populations', tone: 'purple', icon: 'bi-flower1', tags: ['Agriculture', 'Food Security'], fileSize: '2.7 MB', pages: 16, date: '2024-12-19' },
    { id: 4, type: 'proposal', title: 'Renewable Energy Projects for Community Resilience', tone: 'dark', icon: 'bi-lightning-charge', tags: ['Energy', 'Rural Development'], fileSize: '1.7 MB', pages: 21, date: '2024-12-10' },
  ],
  ebook: [
    { id: 5, type: 'ebook', title: 'The NGO Fundraising Handbook', tone: 'navy', icon: 'bi-people', tags: ['Community Development', 'Capacity Building'], fileSize: '2.3 MB', pages: 19, date: '2025-01-15' },
    { id: 6, type: 'ebook', title: 'Grant Writing Made Simple', tone: 'green', icon: 'bi-mortarboard', tags: ['Education', 'Inclusion'], fileSize: '3.0 MB', pages: 15, date: '2025-01-06' },
    { id: 7, type: 'ebook', title: 'Writing a Winning Logical Framework', tone: 'orange', icon: 'bi-people', tags: ['Community Development', 'Capacity Building'], fileSize: '2.0 MB', pages: 20, date: '2024-12-28' },
    { id: 8, type: 'ebook', title: 'Climate Funding Playbook for Nonprofits', tone: 'crimson', icon: 'bi-tree', tags: ['Environment', 'Conservation'], fileSize: '1.7 MB', pages: 21, date: '2024-12-10' },
  ],
  video: [
    { id: 9, type: 'video', title: 'Everything Feels Urgent: How Small NGO Leaders can Make Better Decisions', tone: 'blue', icon: 'bi-play', presenter: 'Cheryl Hooper', category: 'NGO Management', minutes: 52, date: '2026-10-20' },
    { id: 10, type: 'video', title: 'Donor Engagement and Relationship Building', tone: 'teal', icon: 'bi-play', presenter: 'Dr Christopher A. Johnson', category: 'Fundraising Planning and Strategies', minutes: 60, date: '2026-10-14' },
    { id: 11, type: 'video', title: '10 Proposal Mistakes That Cause Grant Rejections', tone: 'purple', icon: 'bi-play', presenter: "Claire O'Donnell", category: 'Proposal Writing', minutes: 50, date: '2026-10-05' },
    { id: 12, type: 'video', title: 'Storytelling for Greater Engagement and Donations', tone: 'teal', icon: 'bi-play', presenter: 'MSc. Daniel Gamboa', category: 'Fundraising Planning and Strategies', minutes: 47, date: '2026-10-01' },
  ],
  article: [
    { id: 13, type: 'article', title: 'Netherlands-Focused Grants: New Calls for Applications', tone: 'purple', icon: 'bi-geo-alt', category: 'Regional focus', excerpt: 'A curated look at donors funding projects in this region, including what they prioritise and how to apply.', readMinutes: 6, date: '2026-10-17' },
    { id: 14, type: 'article', title: 'Global Grants for Climate Change Mitigation & Adaptation', tone: 'orange', icon: 'bi-flower1', category: 'Thematic funds', excerpt: 'Explore active programmes for this theme, from small seed grants to multi-year funding.', readMinutes: 3, date: '2026-10-15', isFav: true },
    { id: 15, type: 'article', title: 'How to Write a Winning Budget Narrative', tone: 'green', icon: 'bi-file-earmark-text', category: 'Proposal writing', excerpt: 'A practical walkthrough with templates and examples to help you structure a stronger budget.', readMinutes: 3, date: '2026-10-06' },
    { id: 16, type: 'article', title: 'Startup & Business Opportunities for South Africa', tone: 'purple', icon: 'bi-geo-alt', category: 'Regional focus', excerpt: 'A curated look at donors funding projects in this region, including what they prioritise.', readMinutes: 7, date: '2026-10-10' },
  ],
  course: [
    { id: 17, type: 'course', title: 'Using Generative AI to Personalize Grant Applications for Global Foundation Requirements', tone: 'purple', icon: 'bi-cpu', category: 'AI & technology', excerpt: 'Discover how generative AI can help your NGO tailor grant applications to global foundations.', author: 'Gopal Kumar Jain', minutes: 60 },
    { id: 18, type: 'course', title: 'Zero Project History? Strategic Grant-Winning Secrets for Newly Registered Nonprofits', tone: 'blue', icon: 'bi-bullseye', category: 'Grant strategy', excerpt: 'Learn how a newly registered NGO can build donor trust and compete for grants of every size.', author: 'Gopal Kumar Jain', minutes: 14, quick: true },
    { id: 19, type: 'course', title: 'Building Corporate Partnerships for NGOs', tone: 'orange', icon: 'bi-people', category: 'Partnerships', excerpt: 'Gain the skills to build and sustain partnerships with more than 100 corporate organisations.', author: 'Gopal Kumar Jain', minutes: 60 },
    { id: 20, type: 'course', title: 'How to Write an Effective CSR Proposal', tone: 'teal', icon: 'bi-flower1', category: 'CSR & ESG', excerpt: 'A complete guide to crafting impactful project proposals tailored to CSR funders.', author: 'Gopal Kumar Jain', minutes: 60 },
  ],
};