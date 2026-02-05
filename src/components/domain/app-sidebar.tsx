"use strict"

import * as React from "react"
import Link from "next/link"
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
    SidebarRail,
} from "@/components/ui/sidebar"
import { LayoutDashboard, Wallet, BarChart3, Settings, LogOut, Link as LinkIcon } from "lucide-react"

// Mock data for navigation
const navMain = [
    {
        title: "Plataforma",
        url: "#",
        items: [
            {
                title: "Visão Geral",
                url: "/dashboard",
                icon: LayoutDashboard,
                isActive: true,
            },
            {
                title: "Campanhas",
                url: "/dashboard/campaigns",
                icon: BarChart3,
            },
            {
                title: "Integrações",
                url: "/dashboard/integrations",
                icon: LinkIcon,
            },
            {
                title: "Financeiro",
                url: "/dashboard/finance",
                icon: Wallet,
            },
        ],
    },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-4 py-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                        AB
                    </div>
                    <span className="font-bold text-lg tracking-tight group-data-[collapsible=icon]:hidden">AdsBrain</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                {navMain.map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title}>
                                            <Link href={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Configurações">
                            <Settings className="h-4 w-4" />
                            <span>Configurações</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Sair" className="text-destructive hover:text-destructive">
                            <LogOut className="h-4 w-4" />
                            <span>Sair</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
