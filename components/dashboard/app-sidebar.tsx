"use client";

/**
 * Dashboard App Sidebar
 *
 * Navigation sidebar for the dashboard with sections for different data views.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Coffee,
  Activity,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

export function AppSidebar() {
  const pathname = usePathname();

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
                      <Link href={item.href}>
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
    </Sidebar>
  );
}
