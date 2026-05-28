export interface AlumniItem {
    id: number;
    name: string;
    role: string;
    image: string;
    video?: string;
    number: string;
}

export const alumniItems: AlumniItem[] = [
    {
        id: 1,
        name: 'Aaditi Srivastava',
        role: 'Intern',
        image: 'https://img.youtube.com/vi/0A9poFm0hNc/hqdefault.jpg',
        video: 'https://www.youtube.com/watch?v=0A9poFm0hNc',
        number: '01'
    },
    {
        id: 2,
        name: 'Manthan Agrawal',
        role: 'Intern',
        image: 'https://img.youtube.com/vi/pOSzxRlt6LI/hqdefault.jpg',
        video: 'https://www.youtube.com/watch?v=pOSzxRlt6LI',
        number: '02'
    },
    {
        id: 3,
        name: 'Manav Sharma',
        role: 'Intern',
        image: 'https://img.youtube.com/vi/L2ulpbIdFfs/hqdefault.jpg',
        video: 'https://www.youtube.com/watch?v=L2ulpbIdFfs',
        number: '03'
    },
    {
        id: 4,
        name: 'Open Spot',
        role: 'Backend Developer',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2000&auto=format&fit=crop',
        number: '04'
    },
    {
        id: 5,
        name: 'Open Spot',
        role: 'Mobile Developer',
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=2000&auto=format&fit=crop',
        number: '05'
    }
];