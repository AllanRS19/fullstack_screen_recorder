import VideoDetailHeader from "@/components/VideoDetailHeader";
import VideoPlayer from "@/components/VideoPlayer";
import { getVideoById } from "@/lib/actions/video";
import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";

type MetadataProps = {
    params: Promise<{ videoId: string }>;
    parent?: ResolvingMetadata;
}

export async function generateMetadata({
    params
}: MetadataProps): Promise<Metadata> {

    // Read route params
    const { videoId } = await params;

    const { video: videoData } = await getVideoById(videoId);

    return {
        title: `Video - ${videoData.title}`,
        description: videoData.description
    }

}

const page = async ({ params }: Params) => {

    const { videoId } = await params;

    const { user, video } = await getVideoById(videoId);

    console.log(video, user);

    if (!video) redirect('/404');

    return (
        <main className="wrapper page">
            <VideoDetailHeader {...video} userImg={user?.image} username={user?.name} ownerId={video.userId} />
            <section className="video-details">
                <div className="content">
                    <VideoPlayer videoId={video.videoId} />
                </div>
            </section>
        </main>
    )
}

export default page