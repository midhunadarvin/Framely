import { SidebarTrigger } from "@/components/ui/sidebar";
import NewSiteModal from "./new-site-modal";
import { db } from "@/lib/db";
import PageItem from "./site-item";
import { LOCAL_USER_ID } from "@/lib/constants";

async function SiteList() {
  const userId = LOCAL_USER_ID;
  let sites = [];
  let error = null;
  let debugInfo = {
    userId,
    queryTime: new Date().toISOString(),
  };

  try {
    const startTime = Date.now();
    sites = await db.page.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    const queryTime = Date.now() - startTime;
    debugInfo = {
      ...debugInfo,
      queryTime: `${queryTime}ms`,
      resultCount: sites.length,
    };
    console.log(
      `[SiteList] Query completed in ${queryTime}ms, found ${sites.length} sites for user ${userId}`,
    );
  } catch (err) {
    console.error("[SiteList] Error fetching sites:", err);
    error = err instanceof Error ? err.message : "Failed to fetch sites";
    debugInfo = { ...debugInfo, error: error };
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="container flex flex-col items-center mx-auto">
          <div className="flex flex-col w-full max-w-4xl space-y-8">
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800 space-y-2">
              <p className="font-bold">Error loading sites:</p>
              <p className="text-sm font-mono bg-red-100 p-2 rounded">
                {error}
              </p>
              <details className="text-xs space-y-1 cursor-pointer">
                <summary className="font-semibold">Debug Info</summary>
                <pre className="bg-red-100 p-2 rounded overflow-auto text-xs">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <SidebarTrigger className="w-12 h-12 mb-4" />
      <div className="container flex flex-col items-center mx-auto">
        <div className="flex flex-col w-full max-w-4xl space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Sites</h1>
            <NewSiteModal />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {sites.length >= 1 ? (
              sites.map((site) => <PageItem key={site.id} site={site} />)
            ) : (
              <p className="mt-4 text-center text-muted-foreground">
                It&apos;s pretty empty in here, create a site to get started.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SiteList;
