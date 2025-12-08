"use client";

/**
 * Dashboard App Sidebar
 *
 * Navigation sidebar for the dashboard with sections for different data views.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Coffee,
  Activity,
  BookOpen,
  Lightbulb,
  Settings2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Travel",
    href: "/dashboard/travel",
    icon: MapPin,
  },
  {
    title: "Coffee & Caffeine",
    href: "/dashboard/coffee",
    icon: Coffee,
  },
  {
    title: "Workouts",
    href: "/dashboard/workouts",
    icon: Activity,
  },
  {
    title: "Habits & Productivity",
    href: "/dashboard/habits",
    icon: BookOpen,
  },
  {
    title: "Insights",
    href: "/dashboard/insights",
    icon: Lightbulb,
  },
];

const footerItems = [
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings2,
  },
]

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleNavigation = (e: React.MouseEvent, href: string) => {
    // Prevent default link behavior
    e.preventDefault();

    // Close mobile sidebar on navigation
    if (isMobile) {
      setOpenMobile(false);
    }

    // Use router.push for navigation with refresh
    router.push(href);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.href}
                        prefetch={true}
                        onClick={(e) => handleNavigation(e, item.href)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {footerItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link
                    href={item.href}
                    prefetch={true}
                    onClick={(e) => handleNavigation(e, item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
