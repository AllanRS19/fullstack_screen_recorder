import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
import VideoCard from "@/components/VideoCard";
import { getUserName } from "@/lib/actions/user";
import { getAllVideosByUser } from "@/lib/actions/video";
import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";

type MetadataProps = {
    params: Promise<{ id: string }>;
    parent?: ResolvingMetadata;
}

export async function generateMetadata({
    params
}: MetadataProps): Promise<Metadata> {

    // Read route params
    const { id } = await params;

    const userName = await getUserName(id);

    return {
        title: `Profile - ${userName}`,
        description: `Profile page of ${userName}`
    }

}

const page = async ({ params, searchParams }: ParamsWithSearch) => {

    const { id } = await params;

    const { query, filter } = await searchParams;

    const { user, videos } = await getAllVideosByUser(id, query, filter);

    if (!user) redirect('/404');

    return (
        <div className="wrapper page">

            <Header
                title={user?.name}
                subHeader={user?.email}
                userImg={user?.image ?? ""}
            />

            {videos?.length > 0 ? (
                <section className="video-grid">
                    {videos.map(({ video, user }) => (
                        <VideoCard
                            key={video.id}
                            {...video}
                            thumbnail={video.thumbnailUrl}
                            userImg={user?.image || ''}
                            username={user?.name || 'Guest'}
                        />
                    ))}
                </section>
            ) : (
                <EmptyState
                    icon="/assets/icons/video.svg"
                    title="No Videos Available Yet"
                    description="Videos will show up once you upload them"
                />
            )}

        </div>
    )
}

export default page;