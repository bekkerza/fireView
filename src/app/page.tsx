
"use client"; 

import React, { useState, useEffect } from 'react';
import { FirestoreProvider, useFirestore } from '@/contexts/firestore-provider';
import { ConnectForm } from '@/components/connect-form';
import { CollectionManager } from '@/components/collection-manager';
import { DocumentViewer } from '@/components/document-viewer';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, 
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Menu } from 'lucide-react';
import { FireViewAppLogo } from '@/components/ui/fireview-app-logo';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Inner component to access Firestore context for dynamic title
const PageContent: React.FC = () => {
  const { isConnected } = useFirestore();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background">
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-lg">
          <SidebarHeader className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Use the new FireViewAppLogo component */}
                {/* Width is auto when expanded, fixed to w-8 when collapsed icon */}
                <FireViewAppLogo className="h-8 w-auto group-data-[collapsible=icon]/sidebar-wrapper:w-8" />
              </div>
            </div>
          </SidebarHeader>
          
          <Separator className="my-0 bg-sidebar-border group-data-[collapsible=icon]:hidden" />

          <SidebarContent className="p-2 flex-grow">
            <CollectionManager />
          </SidebarContent>
          
          <Separator className="my-0 bg-sidebar-border group-data-[collapsible=icon]:hidden" />

          <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
            <p className="text-xs text-sidebar-foreground/70">FireView v1.0</p>
            <p className="text-xs text-sidebar-foreground/50">Press Ctrl/Cmd+B to toggle sidebar</p>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-[60px] items-center gap-2 border-b border-border bg-background/80 backdrop-blur-sm px-4 shadow-sm">
              <SidebarTrigger className="text-foreground hover:text-primary data-[state=open]:text-primary" aria-label="Toggle sidebar">
                 <Menu className="h-6 w-6" />
              </SidebarTrigger>
              <h2 className="text-xl font-headline font-semibold text-primary">
                {isConnected ? 'Firestore Dashboard' : 'Connect to Firebase'}
              </h2>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <ConnectFormWrapper />
            {isConnected && <DocumentViewer />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}


const ConnectFormWrapper: React.FC = () => {
  const { isConnected } = useFirestore();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    // Render a placeholder skeleton that matches ConnectForm's card structure
    return (
      <Card className="w-full mb-6 shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-primary">Loading Connection Form...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" /> 
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return <ConnectForm />;
  }
  return null; 
}

export default function HomePage() {
  return (
    <FirestoreProvider>
      <PageContent />
    </FirestoreProvider>
  );
}
