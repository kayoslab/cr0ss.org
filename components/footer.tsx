import Link from 'next/link';
import { CurrentYear } from '@/components/current-year';

export default function Footer() {
  return (
    <footer className='mt-auto border-t border-gray-200 bg-white'>
      <div className='mx-auto max-w-7xl px-6 py-12 lg:px-8'>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
          {/* Brand Section */}
          <div className='col-span-1 md:col-span-1'>
            <Link href='/' className='text-xl font-bold text-gray-900'>
              cr0ss.org
            </Link>
            <p className='mt-4 text-sm text-gray-600'>
              Personal and professional website of Simon Krüger.
            </p>
          </div>

          {/* Navigation Links */}
          <div className='col-span-1'>
            <h3 className='mb-4 text-sm font-semibold text-gray-900'>
              Navigation
            </h3>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='/'
                  className='text-sm text-gray-600 transition-colors hover:text-gray-900'
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href='/blog'
                  className='text-sm text-gray-600 transition-colors hover:text-gray-900'
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href='/portfolio'
                  className='text-sm text-gray-600 transition-colors hover:text-gray-900'
                >
                  Portfolio
                </Link>
              </li>
            </ul>
          </div>

          {/* Information Links */}
          <div className='col-span-1'>
            <h3 className='mb-4 text-sm font-semibold text-gray-900'>
              Information
            </h3>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='/page/contact'
                  className='text-sm text-gray-600 transition-colors hover:text-gray-900'
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href='/page/imprint'
                  className='text-sm text-gray-600 transition-colors hover:text-gray-900'
                >
                  Imprint
                </Link>
              </li>
              <li>
                <Link
                  href='/cv.pdf'
                  className='text-sm text-gray-600 transition-colors hover:text-gray-900'
                >
                  Vita
                </Link>
              </li>
            </ul>
          </div>

          {/* Social/Tech Stack */}
          <div className='col-span-1'>
            <h3 className='mb-4 text-sm font-semibold text-gray-900'>Social</h3>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='https://github.com/kayoslab'
                  className='text-sm text-gray-600 transition-colors hover:text-gray-900'
                >
                  GitHub
                </Link>
              </li>
              <li>
                <Link
                  href='https://www.instagram.com/cr0ss.mind/'
                  className='text-sm text-gray-600 transition-colors hover:text-gray-900'
                >
                  Instagram
                </Link>
              </li>
              <li>
                <Link
                  href='https://www.linkedin.com/in/cr0ss/'
                  className='text-sm text-gray-600 transition-colors hover:text-gray-900'
                >
                  LinkedIn
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='mt-12 border-t border-gray-200 pt-8'>
          <p className='text-center text-sm text-gray-600'>
            © <CurrentYear /> Simon Krüger. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
