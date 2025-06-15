'use server';

import { headers } from "next/headers";
import { auth } from "../auth";
import { apiFetch, doesTitleMatch, getEnv, getOrderByClause, withErrorHandling } from "../utils";
import { BUNNY } from "@/constants";
import { db } from "@/drizzle/db";
import { user, videos } from "@/drizzle/schema";
import { revalidatePath } from "next/cache";
import aj from "../arcjet";
import { fixedWindow, request } from "@arcjet/next";
import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { PgColumn } from "drizzle-orm/pg-core";

const { VIDEO_STREAM_BASE_URL, THUMBNAIL_STORAGE_BASE_URL, THUMBNAIL_CDN_URL, TRANSCRIPT_URL } = BUNNY;

const BUNNY_VIDEO_LIBRARY_ID = getEnv('BUNNY_VIDEO_LIBRARY_ID');

const ACCESS_KEYS = {
    streamAccessKey: getEnv('BUNNY_STREAM_ACCESS_KEY'),
    storageAccessKey: getEnv('BUNNY_STORAGE_ACCESS_KEY')
}

// Helper Functions
const getSessionUserId = async (): Promise<string> => {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) throw new Error('Unauthenticated');

    return session.user.id;
}

const revalidatePaths = (paths: string[]) => {
    paths.forEach((path) => revalidatePath(path));
}

const validateWithArcjet = async (fingerprint: string) => {
    const rateLimit = aj.withRule(
        fixedWindow({
            mode: 'LIVE',
            window: '1m',
            max: 2,
            characteristics: ['fingerprint']
        })
    )

    const req = await request();

    const decision = await rateLimit.protect(req, { fingerprint });

    if (decision.isDenied()) throw new Error('Rate Limit Exceeded');
}

const buildVideoWithUserQuery = () => {
    return db
        .select({
            video: videos,
            user: { id: user.id, name: user.name, image: user.image }
        })
        .from(videos)
        .leftJoin(user, eq(videos.userId, user.id))
}

// Server Actions
export const getVideoUploadUrl = withErrorHandling(async () => {
    await getSessionUserId();

    const videoResponse = await apiFetch<BunnyVideoResponse>(
        `${VIDEO_STREAM_BASE_URL}/${BUNNY_VIDEO_LIBRARY_ID}/videos`,
        {
            method: "POST",
            bunnyType: "stream",
            body: {
                title: 'Temporary Title',
                collectionId: ''
            }
        }
    )

    const uploadUrl = `${VIDEO_STREAM_BASE_URL}/${BUNNY_VIDEO_LIBRARY_ID}/videos/${videoResponse.guid}`;

    return {
        videoId: videoResponse.guid,
        uploadUrl,
        accessKey: ACCESS_KEYS.streamAccessKey
    }
});

export const getVideoProcessingStatus = withErrorHandling(
    async (videoId: string) => {
        const processingInfo = await apiFetch<BunnyVideoResponse>(
            `${VIDEO_STREAM_BASE_URL}/${BUNNY_VIDEO_LIBRARY_ID}/videos/${videoId}`,
            { bunnyType: "stream" }
        );

        return {
            isProcessed: processingInfo.status === 4,
            encodingProgress: processingInfo.encodeProgress || 0,
            status: processingInfo.status,
        };
    }
);

export const getThumbnailUploadUrl = withErrorHandling(async (videoId: string) => {
    const fileName = `${Date.now()}-${videoId}-thumbnail`;
    const uploadUrl = `${THUMBNAIL_STORAGE_BASE_URL}/thumbnails/${fileName}`;
    const cdnUrl = `${THUMBNAIL_CDN_URL}/thumbnails/${fileName}`;

    return {
        uploadUrl,
        cdnUrl,
        accessKey: ACCESS_KEYS.storageAccessKey
    }
});

export const getVideoTranscript = withErrorHandling(async (videoId: string) => {
    try {
        const response = await fetch(
            `${TRANSCRIPT_URL}/${videoId}/captions/en-auto.vtt`
        );

        return response.text();
    } catch (error) {
        console.error("An error occurred: ", error);
        throw new Error('There was an error while getting the video transcript');
    }
});

export const saveVideoDetails = withErrorHandling(async (videoDetails: VideoDetails) => {
    const userId = await getSessionUserId();
    await validateWithArcjet(userId);

    await apiFetch(
        `${VIDEO_STREAM_BASE_URL}/${BUNNY_VIDEO_LIBRARY_ID}/videos/${videoDetails.videoId}`,
        {
            method: "POST",
            bunnyType: "stream",
            body: {
                title: videoDetails.title,
                description: videoDetails.description
            }
        }
    )

    await db.insert(videos).values({
        ...videoDetails,
        videoUrl: `${BUNNY.EMBED_URL}/${BUNNY_VIDEO_LIBRARY_ID}/${videoDetails.videoId}`,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    revalidatePaths(['/']);

    return { videoId: videoDetails.videoId }
});

export const incrementVideoViews = withErrorHandling(
    async (videoId: string) => {

        const currentUserId = (
            await auth.api.getSession({ headers: await headers() })
        )?.user.id;


        await db
            .update(videos)
            .set({ views: sql`${videos.views} + 1`, updatedAt: new Date() })
            .where(and(eq(videos.videoId, videoId), ne<PgColumn>(videos.userId, currentUserId)));

        revalidatePaths([`/video/${videoId}`]);

        return {};
    }
);

export const getAllVideos = withErrorHandling(async (
    searchQuery: string = "",
    sortFilter?: string,
    pageNumber: number = 1,
    pageSize: number = 8
) => {

    const session = await auth.api.getSession({ headers: await headers() });
    const currentUserId = session?.user?.id;

    const canSeeTheVideos = or(
        eq(videos.visibility, 'public'),
        eq(videos.userId, currentUserId!)
    )

    const whereCondition = searchQuery.trim()
        ? and(
            canSeeTheVideos,
            doesTitleMatch(videos, searchQuery)
        )
        : canSeeTheVideos

    const [{ totalCount }] = await db
        .select({ totalCount: sql<number>`count(*)` })
        .from(videos)
        .where(whereCondition)

    const totalVideos = Number(totalCount || 0);
    const totalPages = Math.ceil(totalVideos / pageSize);

    const videoRecords = await buildVideoWithUserQuery()
        .where(whereCondition)
        .orderBy(
            sortFilter
                ? getOrderByClause(sortFilter)
                : sql`${videos.createdAt} DESC`
        )
        .limit(pageSize)
        .offset((pageNumber - 1) * pageSize);

    return {
        videos: videoRecords,
        pagination: {
            currentPage: pageNumber,
            totalPages,
            totalVideos,
            pageSize
        }
    }
});

export const getVideoById = withErrorHandling(async (videoId: string) => {
    const [videoRecord] = await buildVideoWithUserQuery()
        .where(eq(videos.id, videoId))

    return videoRecord;
});

export const getAllVideosByUser = withErrorHandling(async (
    userIdParameter: string,
    searchQuery: string = "",
    sortFilter?: string
) => {
    const currentUserId = (
        await auth.api.getSession({ headers: await headers() })
    )?.user.id;
    const isOwner = userIdParameter === currentUserId;

    const [userInfo] = await db
        .select({
            id: user.id,
            name: user.name,
            image: user.image,
            email: user.email,
        })
        .from(user)
        .where(eq(user.id, userIdParameter));
    if (!userInfo) throw new Error("User not found");

    const conditions = [
        eq(videos.userId, userIdParameter),
        !isOwner && eq(videos.visibility, "public"),
        searchQuery.trim() && ilike(videos.title, `%${searchQuery}%`),
    ].filter(Boolean) as any[];

    const userVideos = await buildVideoWithUserQuery()
        .where(and(...conditions))
        .orderBy(
            sortFilter ? getOrderByClause(sortFilter) : desc(videos.createdAt)
        );

    return { user: userInfo, videos: userVideos, count: userVideos.length };
}
);

export const deleteVideo = withErrorHandling(async (videoId: string, thumbnailUrl: string) => {

    console.log(`These was the information received: ${videoId}, ${thumbnailUrl}`);

    // We make sure that the video exists in our database
    const [foundVideo] = await db.select().from(videos).where(eq(videos.videoId, videoId));

    if (!foundVideo) return new Error('There was an error finding the video. Please try again');

    // const [confirmThumbnail] = await db.select().from(videos).where(eq(foundVideo.thumbnailUrl, thumbnailUrl));

    // if (!confirmThumbnail) return new Error('This thumbnail does not belong to this video');

    // We delete the video from bunny.net
    await apiFetch(
        `${VIDEO_STREAM_BASE_URL}/${BUNNY_VIDEO_LIBRARY_ID}/videos/${videoId}`,
        { method: "DELETE", bunnyType: "stream" }
    );

    // Extract the thubmail file name & delete the thumbnail from bunny.net
    const thumbnailPath = thumbnailUrl.split('thumbnails/')[1];
    await apiFetch(
        `${THUMBNAIL_STORAGE_BASE_URL}/thumbnails/${thumbnailPath}`,
        { method: "DELETE", bunnyType: "storage", expectJson: false }
    )

    // Delete the video from the database
    await db.delete(videos).where(eq(videos.videoId, videoId));
    revalidatePaths(["/"]);

    return true;

});

export const updateVideoVisibilityState = withErrorHandling(async (newVisibility: Visibility, videoId: string) => {
    try {

        const [findVideo] = await db.select().from(videos).where(eq(videos.videoId, videoId));
        if (!findVideo) throw new Error('We could not find the video to update');

        await db.update(videos).set({ visibility: newVisibility, updatedAt: new Date() }).where(eq(videos.videoId, videoId));

        revalidatePaths(['/', `video/${findVideo.id}`]);

        return {};

    } catch (error) {
        throw new Error('There was an error updating the video visibility state. Please try again');
        console.error(error);
    }
});

// This will be if I want to delete multiple videos
// if (!videosIds || videosIds.length <= 0) return new Error('No videos were passed');

// let allVideosFound = false;

// for (let i = 0; i < videosIds.length; i++) {
//     const [foundVideo] = await db.select().from(videos).where(eq(videos.videoId, videosIds[i]));
//     if (!foundVideo) {
//         allVideosFound = false;
//         throw new Error('The video could not be found');
//     }
//     allVideosFound = true;
// }

// console.log(allVideosFound);

// if (allVideosFound) {
//     // Delete video from bunny.net
//     for (let i = 0; i < videosIds.length; i++) {
//         const deletedVideo = await apiFetch(
//             `${VIDEO_STREAM_BASE_URL}/${BUNNY_VIDEO_LIBRARY_ID}/videos/${videosIds[i]}`,
//             { method: "DELETE", bunnyType: "stream", expectJson: true }
//         )
//         if (!deletedVideo) return new Error('There was an error deleting a video');
//     }

//     return "All videos were deleted successfully";
// }