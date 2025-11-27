import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-white border-t border-gray-200 mt-auto'>
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
            <h3 className='text-sm font-semibold text-gray-900 mb-4'>
              Navigation
            </h3>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='/'
                  className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href='/blog'
                  className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href='/coffee'
                  className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
                >
                  Coffee
                </Link>
              </li>
              <li>
                <Link
                  href='/dashboard'
                  className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Information Links */}
          <div className='col-span-1'>
            <h3 className='text-sm font-semibold text-gray-900 mb-4'>
              Information
            </h3>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='/page/about'
                  className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href='/page/contact'
                  className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href='/page/imprint'
                  className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
                >
                  Imprint
                </Link>
              </li>
              <li>
                <Link
                  href='./cv.pdf'
                  className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
                >
                  Vita
                </Link>
              </li>
            </ul>
          </div>

          {/* Social/Tech Stack */}
          <div className='col-span-1'>
            <h3 className='text-sm font-semibold text-gray-900 mb-4'>
              Social
            </h3>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='https://github.com/kayoslab'
                  className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
                >
                  GitHub
                </Link>
              </li>
              <li>
                <Link
                  href='https://www.instagram.com/cr0ss.mind/'
                  className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
                >
                  Instagram
                </Link>
              </li>
              <li>
                <Link
                  href='https://www.linkedin.com/in/cr0ss/'
                  className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
                >
                  LinkedIn
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='mt-12 border-t border-gray-200 pt-8'>
          <p className='text-sm text-gray-600 text-center'>
            © {currentYear} Simon Krüger. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
