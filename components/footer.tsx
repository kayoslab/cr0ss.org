import Link from 'next/link';
import { CurrentYear } from '@/components/current-year';
import {
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
} from '@/components/social-icons';

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/cr0ss.mind/',
    Icon: InstagramIcon,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/cr0ss/',
    Icon: LinkedInIcon,
  },
  { label: 'GitHub', href: 'https://github.com/kayoslab', Icon: GitHubIcon },
];

export default function Footer() {
  return (
    <footer className='mt-auto border-t border-gray-200 bg-white'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-6 py-8 lg:px-8'>
        <p className='text-sm text-gray-500'>
          © <CurrentYear /> Simon Krüger
          <span aria-hidden='true' className='mx-2 text-gray-300'>
            ·
          </span>
          {/* Impressum must stay reachable from every page. */}
          <Link
            href='/page/imprint'
            className='transition-colors hover:text-gray-900'
          >
            Imprint
          </Link>
        </p>
        <ul className='flex items-center gap-5'>
          {socialLinks.map(({ label, href, Icon }) => (
            <li key={label}>
              <a
                href={href}
                aria-label={label}
                title={label}
                rel='me noopener'
                target='_blank'
                className='block text-gray-400 transition-colors hover:text-gray-900'
              >
                <Icon className='h-5 w-5' />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
