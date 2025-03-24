

import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarProvider,
} from "@/components/ui/sidebar"

export default function AppLayout({ children }: Readonly<{children: React.ReactNode }>) {
    return (
        <SidebarProvider>
            <AppSidebar variant="floating" />

            <div className="m-2 bg-muted/50 aspect-video rounded-xl p-[5px] lg:w-[50%] lg:mx-auto">
                {children}
            </div>
        </SidebarProvider>
    )
}
