'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bars3Icon } from '@heroicons/react/24/outline';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SearchBox } from '@/components/navigation/search-box';
import type { NavLink } from '@/components/navigation';

/** Off-canvas menu for narrow viewports, on the Radix sheet the dashboard already ships. */
export function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className='-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 lg:hidden'
        aria-label='Open main menu'
      >
        <Bars3Icon className='h-6 w-6' aria-hidden='true' />
      </SheetTrigger>
      <SheetContent side='right' className='w-full bg-white px-6 py-6 sm:max-w-sm'>
        <SheetTitle className='sr-only'>Menu</SheetTitle>
        <Link href='/' className='-m-1.5 p-1.5 font-semibold' onClick={() => setOpen(false)}>
          cr0ss.org
        </Link>
        <div className='mt-6'>
          <SearchBox
            variant='inline'
            inputId='search-input-mobile'
            onNavigate={() => setOpen(false)}
          />
        </div>
        <nav className='mt-4 space-y-2' aria-label='Mobile'>
          {links.map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className='-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50'
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
