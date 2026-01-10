import {
  AtomIcon,
  BrainCircuitIcon,
  CameraIcon,
  CloudCogIcon,
  CodeXmlIcon,
  DatabaseIcon,
  FacebookIcon,
  FigmaIcon,
  FileCogIcon,
  FileJsonIcon,
  Gamepad2Icon,
  LayoutPanelTopIcon,
  LinkIcon,
  LockKeyholeIcon,
  NetworkIcon,
  NotebookPenIcon,
  PenToolIcon,
  ServerIcon,
  SmartphoneIcon,
  UsersIcon,
  VideoIcon
} from 'lucide-react'

import { Card } from '@/components/ui/card'

import CourseDatatable, { type Item } from '@/components/shadcn-studio/blocks/datatable-course'

const courseData: Item[] = [
  {
    id: '1',
    course: 'UI/UX design',
    courseIcon: <FigmaIcon />,
    tutor: 'John cartal',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png',
    tutorFallback: 'JC',
    time: '19h 17m',
    stats: { users: 14, textMaterial: 23, videos: 26 },
    totalModules: 100,
    completedModules: 50
  },
  {
    id: '2',
    course: 'Web development',
    courseIcon: <CodeXmlIcon />,
    tutor: 'Sara Mitchell',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-2.png',
    tutorFallback: 'SM',
    time: '20h 5m',
    stats: { users: 15, textMaterial: 24, videos: 27 },
    totalModules: 50,
    completedModules: 11
  },
  {
    id: '3',
    course: 'Product management',
    courseIcon: <LayoutPanelTopIcon />,
    tutor: 'Alex Johnson',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png',
    tutorFallback: 'AJ',
    time: '21h 38m',
    stats: { users: 16, textMaterial: 25, videos: 28 },
    totalModules: 10,
    completedModules: 1
  },
  {
    id: '4',
    course: 'Graphic design',
    courseIcon: <PenToolIcon />,
    tutor: 'Emily Chen',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-4.png',
    tutorFallback: 'EC',
    time: '22h 12m',
    stats: { users: 17, textMaterial: 26, videos: 29 },
    totalModules: 50,
    completedModules: 26
  },
  {
    id: '5',
    course: 'Data analysis',
    courseIcon: <BrainCircuitIcon />,
    tutor: 'Mark Robinson',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png',
    tutorFallback: 'MR',
    time: '23h 45m',
    stats: { users: 18, textMaterial: 27, videos: 30 },
    totalModules: 100,
    completedModules: 76
  },
  {
    id: '6',
    course: 'Science of critical thinking',
    courseIcon: <AtomIcon />,
    tutor: 'Sophia Lee',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-6.png',
    tutorFallback: 'SL',
    time: '24h 30m',
    stats: { users: 19, textMaterial: 28, videos: 31 },
    totalModules: 50,
    completedModules: 16
  },
  {
    id: '7',
    course: 'Frontend Development',
    courseIcon: <CodeXmlIcon />,
    tutor: 'David Kim',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-7.png',
    tutorFallback: 'DK',
    time: '18h 22m',
    stats: { users: 22, textMaterial: 30, videos: 25 },
    totalModules: 30,
    completedModules: 12
  },
  {
    id: '8',
    course: 'Mobile App Design',
    courseIcon: <SmartphoneIcon />,
    tutor: 'Jessica Wong',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-8.png',
    tutorFallback: 'JW',
    time: '16h 45m',
    stats: { users: 20, textMaterial: 18, videos: 22 },
    totalModules: 75,
    completedModules: 30
  },
  {
    id: '9',
    course: 'Digital Marketing',
    courseIcon: <UsersIcon />,
    tutor: 'Michael Brown',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-9.png',
    tutorFallback: 'MB',
    time: '25h 15m',
    stats: { users: 35, textMaterial: 40, videos: 45 },
    totalModules: 100,
    completedModules: 40
  },
  {
    id: '10',
    course: 'Machine Learning',
    courseIcon: <BrainCircuitIcon />,
    tutor: 'Dr. Sarah Williams',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-10.png',
    tutorFallback: 'SW',
    time: '35h 20m',
    stats: { users: 12, textMaterial: 55, videos: 40 },
    totalModules: 15,
    completedModules: 4
  },
  {
    id: '11',
    course: 'Photography Basics',
    courseIcon: <CameraIcon />,
    tutor: 'Anna Davis',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-11.png',
    tutorFallback: 'AD',
    time: '12h 30m',
    stats: { users: 28, textMaterial: 15, videos: 35 },
    totalModules: 50,
    completedModules: 28
  },
  {
    id: '12',
    course: 'Backend Development',
    courseIcon: <CodeXmlIcon />,
    tutor: 'Robert Taylor',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-12.png',
    tutorFallback: 'RT',
    time: '28h 40m',
    stats: { users: 18, textMaterial: 45, videos: 30 },
    totalModules: 75,
    completedModules: 30
  },
  {
    id: '13',
    course: 'Cloud Computing',
    courseIcon: <CloudCogIcon />,
    tutor: 'Lisa Anderson',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-13.png',
    tutorFallback: 'LA',
    time: '32h 15m',
    stats: { users: 15, textMaterial: 50, videos: 25 },
    totalModules: 20,
    completedModules: 8
  },
  {
    id: '14',
    course: 'Cybersecurity Fundamentals',
    courseIcon: <LockKeyholeIcon />,
    tutor: 'James Wilson',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-14.png',
    tutorFallback: 'JW',
    time: '40h 0m',
    stats: { users: 10, textMaterial: 60, videos: 20 },
    totalModules: 100,
    completedModules: 35
  },
  {
    id: '15',
    course: 'DevOps Practices',
    courseIcon: <ServerIcon />,
    tutor: 'Maria Garcia',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-15.png',
    tutorFallback: 'MG',
    time: '30h 25m',
    stats: { users: 13, textMaterial: 35, videos: 28 },
    totalModules: 50,
    completedModules: 45
  },
  {
    id: '16',
    course: 'Database Design',
    courseIcon: <DatabaseIcon />,
    tutor: 'Kevin Martinez',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-16.png',
    tutorFallback: 'KM',
    time: '26h 50m',
    stats: { users: 16, textMaterial: 42, videos: 18 },
    totalModules: 75,
    completedModules: 55
  },
  {
    id: '17',
    course: 'API Development',
    courseIcon: <FileJsonIcon />,
    tutor: 'Rachel Thompson',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-17.png',
    tutorFallback: 'RT',
    time: '22h 35m',
    stats: { users: 19, textMaterial: 30, videos: 24 },
    totalModules: 50,
    completedModules: 32
  },
  {
    id: '18',
    course: 'Software Testing',
    courseIcon: <FileCogIcon />,
    tutor: 'Daniel Lee',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-18.png',
    tutorFallback: 'DL',
    time: '20h 10m',
    stats: { users: 21, textMaterial: 25, videos: 30 },
    totalModules: 30,
    completedModules: 19
  },
  {
    id: '19',
    course: 'Agile Methodology',
    courseIcon: <NetworkIcon />,
    tutor: 'Jennifer White',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-19.png',
    tutorFallback: 'JW',
    time: '15h 45m',
    stats: { users: 25, textMaterial: 20, videos: 15 },
    totalModules: 40,
    completedModules: 28
  },
  {
    id: '20',
    course: 'Blockchain Technology',
    courseIcon: <LinkIcon />,
    tutor: 'Christopher Moore',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-20.png',
    tutorFallback: 'CM',
    time: '38h 20m',
    stats: { users: 8, textMaterial: 65, videos: 12 },
    totalModules: 100,
    completedModules: 50
  },
  {
    id: '21',
    course: 'Game Development',
    courseIcon: <Gamepad2Icon />,
    tutor: 'Amanda Johnson',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-21.png',
    tutorFallback: 'AJ',
    time: '45h 30m',
    stats: { users: 30, textMaterial: 40, videos: 55 },
    totalModules: 75,
    completedModules: 35
  },
  {
    id: '22',
    course: 'AI Ethics',
    courseIcon: <BrainCircuitIcon />,
    tutor: 'Dr. Brian Clark',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-22.png',
    tutorFallback: 'BC',
    time: '18h 15m',
    stats: { users: 14, textMaterial: 28, videos: 20 },
    totalModules: 40,
    completedModules: 30
  },
  {
    id: '23',
    course: 'Video Editing',
    courseIcon: <VideoIcon />,
    tutor: 'Nicole Rodriguez',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-23.png',
    tutorFallback: 'NR',
    time: '24h 45m',
    stats: { users: 32, textMaterial: 15, videos: 45 },
    totalModules: 10,
    completedModules: 2
  },
  {
    id: '24',
    course: 'Content Writing',
    courseIcon: <NotebookPenIcon />,
    tutor: 'Steven Harris',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-24.png',
    tutorFallback: 'SH',
    time: '16h 20m',
    stats: { users: 40, textMaterial: 35, videos: 10 },
    totalModules: 40,
    completedModules: 34
  },
  {
    id: '25',
    course: 'Social Media Strategy',
    courseIcon: <FacebookIcon />,
    tutor: 'Michelle Turner',
    tutorImage: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-25.png',
    tutorFallback: 'MT',
    time: '14h 55m',
    stats: { users: 45, textMaterial: 22, videos: 18 },
    totalModules: 40,
    completedModules: 28
  }
]

const DataTablePreview = () => {
  return (
    <div className='py-8 sm:py-16 lg:py-24'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <Card className='mx-auto w-full max-w-275 py-0'>
          <CourseDatatable data={courseData} />
        </Card>
      </div>
    </div>
  )
}

export default DataTablePreview
