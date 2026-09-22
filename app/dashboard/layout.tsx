import Link from 'next/link';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { MobileMarketingNav } from '@/components/dashboard/mobile-marketing-nav';
import { Separator } from '@/components/ui/separator';

const marketingLinks = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/page/contact', label: 'Contact' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className='bg-background sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 h-4' />
          <Link href='/' className='text-sm font-semibold text-gray-900'>
            cr0ss.org
          </Link>
          <nav className='ml-6 hidden items-center gap-6 lg:flex'>
            {marketingLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className='text-sm font-medium text-gray-600 transition-colors hover:text-gray-900'
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className='ml-auto flex items-center gap-2'>
            <MobileMarketingNav links={marketingLinks} />
          </div>
        </header>
        <div className='flex flex-1 flex-col gap-4 p-4'>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
