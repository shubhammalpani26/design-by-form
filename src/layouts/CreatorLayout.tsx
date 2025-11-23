import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { CreatorSidebar } from '@/components/CreatorSidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export function CreatorLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-1 w-full">
          <CreatorSidebar />
          <main className="flex-1 overflow-auto">
            <div className="p-4">
              <SidebarTrigger className="mb-4" />
            </div>
            <div className="container py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarProvider>
      <Footer />
    </div>
  );
}
