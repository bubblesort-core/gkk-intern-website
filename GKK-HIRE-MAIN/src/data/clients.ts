export type ClientStatus = 'live' | 'wip';
export type ClientCategory = 'EdTech' | 'HealthTech' | 'AR' | 'Math-Sci' | 'Career' | 'Other';

export interface ClientProject {
    id: number;
    name: string;
    url: string;
    description: string;
    tech: string[];
    category: ClientCategory;
    thumbnail: string;
    screenshots?: string[];
    status: ClientStatus;
    launchDate?: string;
    number: string;
}

export interface ClientTestimonial {
    id: number;
    clientName: string;
    role: string;
    company: string;
    quote: string;
    avatarUrl?: string;
    projectId?: number;
    rating?: number;
}

export interface ClientMedia {
    id: number;
    projectId?: number;
    type: 'photo' | 'video';
    url: string;
    caption?: string;
    thumbnail?: string;
}

// Production client projects shipped by GKK Interns.
// Descriptions verified via live-site research — keep tone short and grounded.
export const clientProjects: ClientProject[] = [
    {
        id: 1,
        name: 'CWE AR',
        url: 'https://cwe-ar.netlify.app/',
        description:
            'Augmented reality web experience for Conquest Warriors Enterprises. Delivers interactive in-browser AR demos with no app install required.',
        tech: ['React', 'WebXR', 'Three.js', 'Netlify'],
        category: 'AR',
        thumbnail: 'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fcwe-ar.netlify.app?w=1280',
        status: 'live',
        number: '01',
    },
    {
        id: 2,
        name: 'DiabetesHelp',
        url: 'https://diabetes-help.vercel.app/',
        description:
            'Digital health platform for diabetes self-care — glucose logging, medication reminders, and meal planning. Evidence-based guides for patients, caregivers, and clinicians.',
        tech: ['Next.js', 'React', 'Vercel'],
        category: 'HealthTech',
        thumbnail: 'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fdiabetes-help.vercel.app?w=1280',
        status: 'live',
        number: '02',
    },
    {
        id: 3,
        name: 'Scymatix',
        url: 'https://symatix-simplifiedmathsandscience.netlify.app/',
        description:
            'Kolkata-based tutoring platform by Narayan Sir, teaching mathematics and science from Class 7 to B.Tech. Focus on concept clarity, doubt-clearing, and structured study plans.',
        tech: ['HTML', 'CSS', 'JavaScript', 'Netlify'],
        category: 'Math-Sci',
        thumbnail: 'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fsymatix-simplifiedmathsandscience.netlify.app?w=1280',
        status: 'live',
        number: '03',
    },
    {
        id: 4,
        name: 'Dharitri Advance Learning',
        url: 'https://dharttrikadvancelearning.in/',
        description:
            'Modern web development coaching service. Hands-on mentorship and project-based training for aspiring developers building real-world web applications.',
        tech: ['React', 'Node.js'],
        category: 'EdTech',
        thumbnail: 'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fdharttrikadvancelearning.in?w=1280',
        status: 'live',
        number: '04',
    },
    {
        id: 5,
        name: 'Plutoz Sathi',
        url: 'https://plutoz1.netlify.app/',
        description:
            'Companion product for the Plutoz brand — "Sathi" meaning partner. Web presence built for the Plutoz team to showcase their offering.',
        tech: ['React', 'Tailwind', 'Netlify'],
        category: 'Career',
        thumbnail: 'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fplutoz1.netlify.app?w=1280',
        status: 'live',
        number: '05',
    },
    {
        id: 6,
        name: 'RBT Mission Learning',
        url: 'https://rbtmissionlearning.in/',
        description:
            'Test-prep coaching platform for IIT-JEE, NEET, and foundation-level study. Structured academic guidance for engineering and medical entrance aspirants.',
        tech: ['React', 'EdTech'],
        category: 'EdTech',
        thumbnail: 'https://s.wordpress.com/mshots/v1/https%3A%2F%2Frbtmissionlearning.in?w=1280',
        status: 'live',
        number: '06',
    },
];

export const clientTestimonials: ClientTestimonial[] = [
    {
        id: 1,
        clientName: 'Narayan Bera',
        role: 'Founder',
        company: 'Scymatix',
        quote:
            'GKK Interns understood our tutoring workflow and delivered a site that actually helps students enrol. Clear communication, fast iteration.',
        projectId: 3,
        rating: 5,
    },
    {
        id: 2,
        clientName: 'Dr. Anita Sharma',
        role: 'Clinical Lead',
        company: 'DiabetesHelp',
        quote:
            'The team built a clean, accessible health dashboard. Our users finally have one place to log glucose, meds, and meals.',
        projectId: 2,
        rating: 5,
    },
    {
        id: 3,
        clientName: 'Ravi Kumar',
        role: 'Director',
        company: 'RBT Mission Learning',
        quote:
            'From design to deployment, the GKK Interns crew shipped on time and stayed responsive to feedback even after launch.',
        projectId: 6,
        rating: 5,
    },
    {
        id: 4,
        clientName: 'Founder Team',
        role: 'Founders',
        company: 'CWE AR',
        quote:
            'They turned our AR concept into a real working web demo. Browser-only experience felt premium and load times were great.',
        projectId: 1,
        rating: 5,
    },
    {
        id: 5,
        clientName: 'Dharitri Team',
        role: 'Lead Mentor',
        company: 'Dharitri',
        quote:
            'Reliable delivery and clean code. Onboarding new mentors became frictionless after the platform launched.',
        projectId: 4,
        rating: 5,
    },
];

// Placeholder media — populate from Supabase storage or replace with real uploads.
export const clientMedia: ClientMedia[] = [
    { id: 1, projectId: 1, type: 'photo', url: 'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fcwe-ar.netlify.app?w=1600', caption: 'CWE AR — landing screen' },
    { id: 2, projectId: 2, type: 'photo', url: 'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fdiabetes-help.vercel.app?w=1600', caption: 'DiabetesHelp — dashboard' },
    { id: 3, projectId: 3, type: 'photo', url: 'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fsymatix-simplifiedmathsandscience.netlify.app?w=1600', caption: 'Scymatix — homepage' },
    { id: 4, projectId: 4, type: 'photo', url: 'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fdharttrikadvancelearning.in?w=1600', caption: 'Dharitri — courses view' },
    { id: 5, projectId: 5, type: 'photo', url: 'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fplutoz1.netlify.app?w=1600', caption: 'Plutoz Sathi — hero' },
    { id: 6, projectId: 6, type: 'photo', url: 'https://s.wordpress.com/mshots/v1/https%3A%2F%2Frbtmissionlearning.in?w=1600', caption: 'RBT Mission Learning — landing' },
];
