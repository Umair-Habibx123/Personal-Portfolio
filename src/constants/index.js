import {
  frontend,
  backend,
  flutter,
  android,
  javascript,
  dotnet,
  html,
  css,
  react,
  csharp,
  redux,
  flutter2,
  android2,
  firebase,
  tailwind,
  sql,
  java,
  cpp,
  node,
  git,
  rubyrails,
  komikult,
  leaderboard,
  math,
  movie,
  nyeusi,
  eziline,
  numl
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
    title: 'Frontend Developer',
    icon: frontend,
  },
  {
    title: 'Backend Developer',
    icon: backend,
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
    name: 'android2',
    icon: android2,
  },
  {
    name: 'flutter2',
    icon: flutter2,
  },
  {
    name: 'firebase',
    icon: firebase,
  },
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
    name: 'React JS',
    icon: react,
  },
  {
    name: 'Redux Toolkit',
    icon: redux,
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
    name: 'Cpp',
    icon: cpp,
  },
  {
    name: 'Java',
    icon: java,
  },
  {
    name: 'SQL',
    icon: sql,
  },
  {
    name: 'C#',
    icon: csharp,
  },
  {
    name: 'Rails',
    icon: rubyrails,
  },
  {
    name: 'Dotnet',
    icon: dotnet,
  },
  {
    name: 'git',
    icon: git,
  },
];

const experiences = [
  {
    title: 'Flutter Development Intern',
    company_name: 'Eziline Software House',
    icon: eziline, // Add the appropriate icon variable for Eziline Software House
    iconBg: '#333333',
    date: 'July 2024 - October 2024',
  },
  {
    title: 'Android App & Web Development',
    company_name: 'Academic Experience',
    icon: numl, // Add the appropriate icon variable for academic experience
    iconBg: '#333333',
    date: 'Academic Experience', // If there's a specific timeline, you can add it here
  },
];



const projects = [
  {
    id: 'project-1',
    name: 'Personal Portfolio',
    description: 'A modern portfolio website showcasing skills, projects, and experiences with an interactive UI.',
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
    image: komikult,
    repo: 'https://github.com/shaqdeff/KomiKult',
    demo: 'https://umairhabib.vercel.app/',
  },
  {
    id: 'project-2',
    name: 'Bag Society (Ecommerce)',
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
    image: leaderboard,
    repo: 'https://github.com/shaqdeff/Leaderboard',
    demo: 'https://bagsociety.vercel.app/',
  },
  {
    id: 'project-3',
    name: 'News App',
    description: 'A news application that fetches and displays real-time news articles from various categories using the News API.',
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
        name: 'News API',
        color: 'pink-text-gradient',
      },
    ],
    image: math,
    repo: 'https://github.com/shaqdeff/Math-Magicians',
    demo: 'https://inspiring-medovik-37d3b3.netlify.app/',
  },
  {
    id: 'project-4',
    name: 'Gemini AI App',
    description: 'An innovative app that processes text and image commands, delivering AI-powered insights, recommendations, and actions based on user inputs.',
    tags: [
      {
        name: 'Flutter',
        color: 'blue-text-gradient',
      },
      {
        name: 'API',
        color: 'green-text-gradient',
      },
    ],
    image: movie,
    repo: 'https://github.com/shaqdeff/Movie-Metro',
    demo: 'https://movie-metro.netlify.app/',
  },
  {
    id: 'project-5',
    name: 'Real-Time Chat App',
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
    image: nyeusi,
    repo: 'https://github.com/shaqdeff/Nyeusi-Fest-Site',
    demo: 'https://shaqdeff.github.io/Nyeusi-Fest-Site/',
  },
];

export { services, technologies, experiences, projects };
