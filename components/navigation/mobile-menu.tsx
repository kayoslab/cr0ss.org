'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { SearchBox } from '@/components/navigation/search-box';
import type { NavLink } from '@/components/navigation';

/**
 * Off-canvas menu for narrow viewports on a native modal <dialog>: the
 * browser provides the focus trap, Escape to close, inert background and
 * top layer. It ships on every public page, so it stays off the Radix
 * sheet (dialog, portal, focus scope, presence) the dashboard uses.
 */
export function MobileMenu({ links }: { links: NavLink[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type='button'
        className='-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 lg:hidden'
        aria-label='Open main menu'
        aria-haspopup='dialog'
        onClick={() => dialogRef.current?.showModal()}
      >
        <Bars3Icon className='h-6 w-6' aria-hidden='true' />
      </button>
      <dialog
        ref={dialogRef}
        aria-label='Menu'
        className='my-0 mr-0 ml-auto h-dvh max-h-none w-full max-w-none bg-white p-0 shadow-lg backdrop:bg-black/50 sm:max-w-sm'
        // A click on the dialog element itself landed on the backdrop; the
        // panel's content fills it, so clicks inside never target it.
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className='relative h-full px-6 py-6'>
          <Link href='/' className='-m-1.5 p-1.5 font-semibold' onClick={close}>
            cr0ss.org
          </Link>
          <button
            type='button'
            className='absolute top-4 right-4 rounded-xs p-1 text-gray-500 hover:text-gray-900'
            aria-label='Close menu'
            onClick={close}
          >
            <XMarkIcon className='h-5 w-5' aria-hidden='true' />
          </button>
          <div className='mt-6'>
            <SearchBox
              variant='inline'
              inputId='search-input-mobile'
              onNavigate={close}
            />
          </div>
          <nav className='mt-4 space-y-2' aria-label='Mobile'>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className='-mx-3 block rounded-lg px-3 py-2 text-base leading-7 font-semibold text-gray-900 hover:bg-gray-50'
                onClick={close}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </dialog>
    </>
  );
}
