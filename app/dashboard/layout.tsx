import Link from "next/link";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Separator } from "@/components/ui/separator";

const marketingLinks = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/page/about", label: "About" },
  { href: "/page/contact", label: "Contact" },
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
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Link
            href="/"
            className="text-sm font-semibold text-gray-900"
          >
            cr0ss.org
          </Link>
          <nav className="ml-6 hidden items-center gap-6 lg:flex">
            {marketingLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center">
            <Link
              href="/chat"
              className="inline-flex rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 p-[1px] transition-all duration-200 hover:scale-105"
            >
              <span className="flex items-center rounded-full bg-background px-4 py-1.5 text-sm font-semibold">
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
                  AI Chat
                </span>
              </span>
            </Link>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
