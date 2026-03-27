"use server";

import { db } from "@/lib/db";
import { Page } from "@prisma/client";
import { revalidateTag, unstable_cache } from "next/cache";
import { LOCAL_USER_ID } from "@/lib/constants";

type SiteProps = {
  title: string;
  subdomain: string;
};

export async function createSite({ title, subdomain }: SiteProps) {
  const userId = LOCAL_USER_ID;

  if (!title || !subdomain) {
    return { success: false, msg: "Title and subdomain are required" };
  }

  try {
    const existingSite = await db.page.findFirst({
      where: { subdomain: subdomain },
    });

    if (existingSite) {
      return { success: false, msg: "Subdomain is already in use" };
    }

    console.log(
      `[createSite] Creating site "${title}" with subdomain "${subdomain}" for user ${userId}`,
    );
    const site = await db.page.create({
      data: { userId: userId, title: title, subdomain: subdomain },
    });
    console.log(`[createSite] Successfully created site ${site.id}`);
    return { success: true, site: site };
  } catch (error) {
    console.error("[createSite] Error:", error);
    return {
      success: false,
      msg: error instanceof Error ? error.message : "Failed to create site",
    };
  }
}

type UpsertProps = Partial<Page>;

export async function upsertSite({
  id,
  title,
  subdomain,
  previewImage,
  content,
  visible,
}: UpsertProps) {
  const userId = LOCAL_USER_ID;

  if (!id) {
    return { success: false, msg: "Site ID is required" };
  }

  try {
    console.log(`[upsertSite] Updating site ${id}`);
    const site = await db.page.update({
      where: { id: id, userId: userId },
      data: {
        id: id,
        title: title,
        subdomain: subdomain,
        previewImage: previewImage,
        content: content,
        visible: visible,
      },
    });

    if (site.subdomain) {
      revalidateTag(site.subdomain);
    }
    console.log(`[upsertSite] Successfully updated site ${id}`);

    return { success: true, site: site };
  } catch (error) {
    console.error("[upsertSite] Error:", error);
    return {
      success: false,
      msg: error instanceof Error ? error.message : "Failed to update site",
    };
  }
}

export async function deleteSite(siteId: string) {
  const userId = LOCAL_USER_ID;

  if (!siteId) {
    return { success: false, msg: "Site ID is required" };
  }

  try {
    console.log(`[deleteSite] Deleting site ${siteId}`);
    const response = await db.page.delete({
      where: {
        id: siteId,
        userId: userId,
      },
    });

    if (response.subdomain) {
      revalidateTag(response.subdomain);
    }
    console.log(`[deleteSite] Successfully deleted site ${siteId}`);

    return { success: true };
  } catch (error) {
    console.error("[deleteSite] Error:", error);
    return {
      success: false,
      msg: error instanceof Error ? error.message : "Failed to delete site",
    };
  }
}

export async function getSiteDetails(siteId: string) {
  try {
    const res = await db.page.findUnique({ where: { id: siteId } });
    if (!res) {
      throw new Error("Database Error");
    }
    return { success: true, content: res.content };
  } catch (error) {
    return {
      success: false,
      msg: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export const getSiteByDomain = async (subdomainName: string) => {
  try {
    const response = await unstable_cache(
      async () => {
        const response = await db.page.findUnique({
          where: {
            subdomain: subdomainName,
          },
        });

        return response;
      },
      [subdomainName],
      {
        revalidate: 900, // 15 Minutes
        tags: [subdomainName],
      },
    )();

    if (!response) {
      return { success: false, msg: "Site not found" };
    }

    if (!response.visible) {
      // With LOCAL_USER_ID, all sites are owned by the same user
      // So private sites are only accessible to that user (which is effectively "local mode")
      if (response.userId !== LOCAL_USER_ID) {
        return {
          success: true,
          msg: "The requested site is private (for now), come back later!",
          private: true,
        };
      }

      return { success: true, site: response };
    }

    return { success: true, site: response };
  } catch (error) {
    return {
      success: false,
      msg: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};
