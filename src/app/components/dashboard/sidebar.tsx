"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  ChartLine,
  Github,
  Globe,
  LayoutDashboard,
  Lightbulb,
  Moon,
  MoveUpRight,
  Settings,
  SquareDashedMousePointer,
} from "lucide-react";
import { useTheme } from "next-themes";

const items = [
  { title: "Overview", url: "#", icon: LayoutDashboard },
  { title: "Sites", url: "#", icon: Globe },
  { title: "Analytics", url: "#", icon: ChartLine },
  { title: "Settings", url: "#", icon: Settings },
];

const externalLinks = [
  {
    title: "Star on Github",
    href: "https://github.com/belastrittmatter/framely",
    icon: Github,
  },
];

const AppSidebar = () => {
  const { theme, setTheme } = useTheme();
  return (
    <Sidebar className="w-[16rem]">
      <SidebarHeader>
        <SidebarGroup>
          <div className="flex justify-between">
            <div className="flex flex-row space-x-2">
              <div className="bg-gradient-to-tr from-red-400 to-orange-400 text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <SquareDashedMousePointer className="size-6" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Framely</span>
                <span className="truncate text-xs">Dashboard</span>
              </div>
            </div>
            <div>
              {theme === "light" ? (
                <Button
                  onClick={() => setTheme("dark")}
                  variant="outline"
                  size="icon"
                >
                  <Moon />
                </Button>
              ) : (
                <Button
                  onClick={() => setTheme("light")}
                  variant="secondary"
                  size="icon"
                >
                  <Lightbulb />
                </Button>
              )}
            </div>
          </div>
        </SidebarGroup>
      </SidebarHeader>
      <SidebarContent className="justify-between px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {externalLinks.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="justify-between w-full"
                      data-umami-event="social-GitHub"
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </div>
                      <MoveUpRight />
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4">
        <Separator />
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center p-2 gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                U
              </div>
              <span className="text-sm truncate">Local User</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
