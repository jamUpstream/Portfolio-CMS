import {
  AtSign,
  Award,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Brush,
  Camera,
  Code2,
  Codepen,
  Dribbble,
  ExternalLink,
  Facebook,
  Figma,
  FileText,
  Github,
  GraduationCap,
  Globe,
  Hash,
  Instagram,
  Layers,
  Link as LinkIcon,
  Link2,
  Linkedin,
  Mail,
  MessageCircle,
  MessageSquare,
  Monitor,
  Music,
  Music2,
  PenTool,
  Phone,
  Rss,
  Send,
  Settings,
  ShoppingBag,
  Slack,
  Sparkles,
  Twitch,
  Twitter,
  User,
  Users,
  Video,
  Youtube
} from 'lucide-react';

const icons = {
  at: AtSign,
  atsign: AtSign,
  award: Award,
  badge: BadgeCheck,
  behance: Brush,
  book: BookOpen,
  briefcase: BriefcaseBusiness,
  camera: Camera,
  code: Code2,
  codepen: Codepen,
  dev: Code2,
  dribbble: Dribbble,
  email: Mail,
  external: ExternalLink,
  facebook: Facebook,
  fb: Facebook,
  figma: Figma,
  file: FileText,
  globe: Globe,
  github: Github,
  gitlab: Code2,
  graduation: GraduationCap,
  hash: Hash,
  instagram: Instagram,
  insta: Instagram,
  layers: Layers,
  link: LinkIcon,
  link2: Link2,
  linkedin: Linkedin,
  linkedin2: Linkedin,
  mail: Mail,
  medium: BookOpen,
  messenger: MessageCircle,
  monitor: Monitor,
  music: Music,
  music2: Music2,
  phone: Phone,
  portfolio: BriefcaseBusiness,
  producthunt: ShoppingBag,
  rss: Rss,
  send: Send,
  design: PenTool,
  settings: Settings,
  shop: ShoppingBag,
  slack: Slack,
  sparkles: Sparkles,
  threads: AtSign,
  tiktok: Music2,
  twitch: Twitch,
  twitter: Twitter,
  user: User,
  users: Users,
  video: Video,
  website: Globe,
  x: Twitter,
  youtube: Youtube
};

function BrandIcon({ className = 'h-5 w-5', children }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

function TikTok({ className = 'h-5 w-5' }) {
  return (
    <BrandIcon className={className}>
      <path
        d="M15.5 3c.3 2.3 1.6 3.9 4 4.2v3.1c-1.5 0-2.8-.4-4-1.2v5.7c0 3.5-2.2 5.7-5.4 5.7-3 0-5.1-2-5.1-4.8 0-3.2 2.5-5.2 6.1-4.9v3.2c-1.8-.3-2.8.4-2.8 1.6 0 1 .8 1.7 1.9 1.7 1.3 0 2.1-.8 2.1-2.4V3h3.2Z"
        fill="currentColor"
      />
    </BrandIcon>
  );
}

function XIcon({ className = 'h-5 w-5' }) {
  return (
    <BrandIcon className={className}>
      <path d="M4 4h4.2l4.5 6 5.1-6H20l-6.3 7.4L20.4 20h-4.2l-5-6.5L5.7 20H3.5l6.7-7.9L4 4Zm3.3 1.8 9.8 12.4h1L8.3 5.8h-1Z" fill="currentColor" />
    </BrandIcon>
  );
}

function Discord({ className = 'h-5 w-5' }) {
  return (
    <BrandIcon className={className}>
      <path d="M8.3 6.5c2.5-.7 4.9-.7 7.4 0l.4.1c1.6 2.3 2.4 4.9 2.2 7.7-2 1.5-3.9 2.4-5.8 2.7l-.7-1.1c.8-.2 1.5-.5 2.2-1-1.6.7-3.4.7-5 0 .7.4 1.4.8 2.2 1L10.5 17c-1.9-.3-3.8-1.2-5.8-2.7-.2-2.8.6-5.4 2.2-7.7l.4-.1Zm1.1 5.9c.7 0 1.2-.6 1.2-1.3s-.5-1.3-1.2-1.3-1.2.6-1.2 1.3.5 1.3 1.2 1.3Zm5.2 0c.7 0 1.2-.6 1.2-1.3s-.5-1.3-1.2-1.3-1.2.6-1.2 1.3.5 1.3 1.2 1.3Z" fill="currentColor" />
    </BrandIcon>
  );
}

function Reddit({ className = 'h-5 w-5' }) {
  return (
    <BrandIcon className={className}>
      <path d="M16.2 4.6a1.4 1.4 0 1 1 .5 1.1l-2.8-.6-.8 3.1c1.5.1 2.9.5 3.9 1.2a2 2 0 1 1 1.2 3.5v.3c0 2.8-2.8 5-6.2 5s-6.2-2.2-6.2-5v-.3A2 2 0 1 1 7 9.4c1-.7 2.5-1.2 4.1-1.2l1.1-4.8 4 .8Zm-6.6 7.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Zm4.8 0a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Zm-4.8 3.5c.7.6 1.5.9 2.4.9s1.7-.3 2.4-.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </BrandIcon>
  );
}

icons.tiktok = TikTok;
icons.x = XIcon;
icons.discord = Discord;
icons.reddit = Reddit;

export default function Icon({ name = 'sparkles', className = 'h-5 w-5' }) {
  const key = String(name).toLowerCase().trim().replace(/[\s_-]+/g, '');
  const Component = icons[key] ?? icons[String(name).toLowerCase().trim()] ?? Sparkles;
  return <Component className={className} aria-hidden="true" />;
}
