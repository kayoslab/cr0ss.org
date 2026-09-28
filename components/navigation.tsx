import Link from 'next/link';
import { SearchBox } from '@/components/navigation/search-box';
import { MobileMenu } from '@/components/navigation/mobile-menu';

export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/page/contact', label: 'Contact' },
];

/**
 * Site header. A server component: only the search box and the mobile menu
 * are client islands, so the header contributes almost nothing to the
 * client bundle of every public page.
 */
export default function Navigation() {
  return (
    <header className='bg-white'>
      <nav
        className='mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8'
        aria-label='Global'
      >
        <div className='flex lg:flex-1'>
          <Link href='/' className='-m-1.5 p-1.5'>
            cr0ss.org
          </Link>
        </div>
        <div className='flex lg:hidden'>
          <MobileMenu links={NAV_LINKS} />
        </div>
        <div className='hidden items-center lg:flex lg:gap-x-12'>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className='text-sm font-semibold leading-6 text-gray-900'
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className='hidden lg:flex lg:flex-1 lg:justify-end'>
          <SearchBox variant='collapsible' inputId='search-input-desktop' />
        </div>
      </nav>
    </header>
  );
}
