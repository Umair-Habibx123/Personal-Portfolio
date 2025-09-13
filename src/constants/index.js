import {
  angular,
  MERN,
  flutter,
  android,
  html,
  css,
  javascript,
  react,
  tailwind,
  node,
  flutters,
  androids,
  firebase,
  dotnet,
  rubyrails,
  sql,
  AimsSoft,
  bagsociety,
  newsapp,
  aiapp,
  firestream,
  eziline,
  numl,
  collaborativeedge,
  typescript,
  angular2,
  PEP,
} from '../assets';

export const navLinks = [
  {
    id: 'about',
    title: 'About',
  },
  {
    id: 'projects',
    title: 'Projects',
  },
  {
    id: 'contact',
    title: 'Contact',
  },
];

const services = [
  {
    title: 'MERN Stack Developer',
    icon: MERN,
  },
  {
    title: 'Angular Developer',
    icon: angular,
  },
  {
    title: 'Flutter Developer',
    icon: flutter,
  },
  {
    title: 'Android developer',
    icon: android,
  },
];


const technologies = [
  {
    name: 'HTML 5',
    icon: html,
  },
  {
    name: 'CSS 3',
    icon: css,
  },
  {
    name: 'JavaScript',
    icon: javascript,
  },
  {
    name: 'TypeScript',
    icon: typescript,
  },
  {
    name: 'React JS',
    icon: react,
  },
   {
    name: 'Angular',
    icon: angular2,
  },
  {
    name: 'Tailwind CSS',
    icon: tailwind,
  },
  {
    name: 'Node JS',
    icon: node,
  },
  {
    name: 'flutter',
    icon: flutters,
  },
  {
    name: 'android',
    icon: androids,
  },
  {
    name: 'firebase',
    icon: firebase,
  },
  {
    name: 'Dotnet',
    icon: dotnet,
  },
  {
    name: 'Rails',
    icon: rubyrails,
  },
  {
    name: 'SQL',
    icon: sql,
  },
  // {
  //   name: 'git',
  //   icon: git,
  // },
];

const experiences = [
  {
    title: 'Angular Development Intern',
    company_name: 'AimsSoft Software House',
    icon: AimsSoft, // Add the appropriate icon variable for Eziline Software House
    iconBg: '#333333',
    date: 'January 2025 - May 2025',
  },
  {
    title: 'Flutter Development Intern',
    company_name: 'Eziline Software House',
    icon: eziline, // Add the appropriate icon variable for Eziline Software House
    iconBg: '#333333',
    date: 'July 2024 - October 2024',
  },
  {
    title: 'Web Development',
    company_name: 'Academic Experience',
    icon: numl, // Add the appropriate icon variable for academic experience
    iconBg: '#333333',
    date: 'Academic Experience', // If there's a specific timeline, you can add it here
  },
];



const projects = [
   {
    id: 'project-1',
    name: 'Ecommerce Website',
    description: 'A fully functional e-commerce application for showcasing and purchasing products online.',
    tags: [
      {
        name: 'react',
        color: 'blue-text-gradient',
      },
      {
        name: 'Firebase',
        color: 'green-text-gradient',
      },
      {
        name: 'tailwind css',
        color: 'pink-text-gradient',
      },
    ],
    image: bagsociety,
    repo: 'https://github.com/',
    demo: 'https://ec3store.vercel.app/',
  },
  {
    id: 'project-2',
    name: 'Collaborative Edge',
    description: 'MERN stack portal for student-teacher-industry collaboration with real-time updates & approval workflows.',
    tags: [
      {
        name: 'react',
        color: 'blue-text-gradient',
      },
      {
        name: 'tailwind',
        color: 'pink-text-gradient',
      },
    ],
    image: collaborativeedge,
    repo: 'https://github.com/',
    demo: 'https://collaborative-edge.vercel.app/',
  },
  // {
  //   id: 'project-3',
  //   name: 'News App',
  //   description: 'A news application that fetches and displays real-time news articles from various categories using the News API.',
  //   tags: [
  //     {
  //       name: 'Flutter',
  //       color: 'blue-text-gradient',
  //     },
  //     {
  //       name: 'Firebase',
  //       color: 'green-text-gradient',
  //     },
  //     {
  //       name: 'News API',
  //       color: 'pink-text-gradient',
  //     },
  //   ],
  //   image: newsapp,
  //   repo: 'https://github.com/',
  //   demo: 'https://github.com/Umair-Habibx123/news_app/raw/refs/heads/master/APK/news_app.apk',
  // },
  // {
  //   id: 'project-4',
  //   name: 'Gemini AI App',
  //   description: 'An innovative app that processes text and image commands, delivering AI-powered insights, recommendations, and actions based on user inputs.',
  //   tags: [
  //     {
  //       name: 'Flutter',
  //       color: 'blue-text-gradient',
  //     },
  //     {
  //       name: 'API',
  //       color: 'green-text-gradient',
  //     },
  //   ],
  //   image: aiapp,
  //   repo: 'https://github.com/',
  //   demo: 'https://github.com/Umair-Habibx123/gemini_ai_app/raw/refs/heads/master/APK/gemini_ai_app.apk',
  // },
  {
    id: 'project-5',
    name: 'FireStream Chat App',
    description: 'A real-time messaging app enabling users to connect and communicate instantly using Firebase backend services.',
    tags: [
      {
        name: 'Flutter',
        color: 'blue-text-gradient',
      },
      {
        name: 'Firebase',
        color: 'green-text-gradient',
      },
      {
        name: 'Firebase Auth',
        color: 'pink-text-gradient',
      },
    ],
    image: firestream,
    repo: 'https://github.com/',
    demo: 'https://github.com/Umair-Habibx123/FireStream/raw/refs/heads/master/APK/FireStream.apk',
  },
  {
    id: 'project-6',
    name: 'Pak-Education Portal',
    description: 'Platform for exploring Pakistani universities and programs, with an "Apply Through Us" option for easy student applications',
    tags: [
      {
        name: 'Angular',
        color: 'red-text-gradient',
      },
      {
        name: '.NET Core',
        color: 'purple-text-gradient',
      },
      {
        name: 'SQL Server',
        color: 'blue-text-gradient',
      },
      {
        name: 'Bootstrap',
        color: 'purple-text-gradient',
      },
    ],
    image: PEP,
    repo: 'https://github.com/',
    demo: 'https://pakistaneducationportal.com/',
  }
];

export { services, technologies, experiences, projects };
