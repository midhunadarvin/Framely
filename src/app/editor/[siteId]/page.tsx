import { db } from "@/lib/db";
import EditorProvider from "@/app/providers/editor-provider";
import React from "react";
import EditorNavigation from "../../components/editor/editor-navigation";
import SiteEditor from "@/app/components/editor/site-editor";
import LeftSidebar from "@/app/components/editor/editor-sidebar/left-sidebar";
import RightSidebar from "@/app/components/editor/editor-sidebar/right-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LOCAL_USER_ID } from "@/lib/constants";

type Props = {
  params: Promise<{
    siteId: string;
  }>;
};

const Page = async ({ params }: Props) => {
  const { siteId } = await params;
  let siteDetails = null;
  let error = null;
  const debugInfo = {
    siteId,
    userId: LOCAL_USER_ID,
    timestamp: new Date().toISOString(),
  };

  try {
    console.log(`[Editor] Fetching site ${siteId} for user ${LOCAL_USER_ID}`);
    siteDetails = await db.page.findFirst({
      where: {
        id: siteId,
        userId: LOCAL_USER_ID,
      },
    });
    console.log(
      `[Editor] Query result:`,
      siteDetails ? `Found site "${siteDetails.title}"` : "Site not found",
    );
  } catch (err) {
    console.error("[Editor] Error fetching site:", err);
    error = err instanceof Error ? err.message : "Failed to fetch site";
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800 space-y-2">
          <p className="font-bold">Error loading site:</p>
          <p className="text-sm font-mono bg-red-100 p-2 rounded">{error}</p>
          <details className="text-xs space-y-1 cursor-pointer">
            <summary className="font-semibold">Debug Info</summary>
            <pre className="bg-red-100 p-2 rounded overflow-auto text-xs">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  if (!siteDetails) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-yellow-800 space-y-2">
          <p className="font-bold">Site not found</p>
          <p className="text-sm">
            The site you're trying to access doesn't exist or you don't have
            permission to access it.
          </p>
          <details className="text-xs space-y-1 cursor-pointer">
            <summary className="font-semibold">Debug Info</summary>
            <pre className="bg-yellow-100 p-2 rounded overflow-auto text-xs">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <EditorProvider siteId={siteId} siteDetails={siteDetails}>
        <EditorNavigation siteDetails={siteDetails} />
        <div className="relative flex w-full h-full">
          <div className="flex-shrink-0 relative bg-muted">
            <SidebarProvider>
              <LeftSidebar />
              <SidebarTrigger className="w-12 h-12 ml-2" />
            </SidebarProvider>
          </div>
          <div className="flex-1 p-0 m-0">
            <SiteEditor siteId={siteId} />
          </div>
          <div className="flex-shrink-0">
            <RightSidebar />
          </div>
        </div>
      </EditorProvider>
    </div>
  );
};

export default Page;
