'use client';

import { deleteVideo, updateVideoVisibilityState } from "@/lib/actions/video";
import { authClient } from "@/lib/auth-client";
import { daysAgo } from "@/lib/utils";
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DropdownList from "./DropdownList";
import { visibilities } from "@/constants";

const VideoDetailHeader = ({
    id,
    title,
    createdAt,
    userImg,
    username,
    videoId,
    ownerId,
    visibility,
    thumbnailUrl
}: VideoDetailHeaderProps) => {

    const router = useRouter();

    const { data: session } = authClient.useSession();
    const loggedUserId = session?.user.id;
    const isOwner = loggedUserId === ownerId;

    const [isDeleting, setIsDeleting] = useState(false);
    const [copied, setCopied] = useState(false);

    const [visibilityState, setVisibilityState] = useState<Visibility>(
        visibility as Visibility
    );

    const [isUpdating, setIsUpdating] = useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/video/${id}`)

        setCopied(true);
    }

    const handleDeleteVideo = async () => {
        try {
            setIsDeleting(true);
            toast.promise(deleteVideo(videoId, thumbnailUrl), {
                loading: 'Deleting video...',
                success: 'Video successfully deleted. You will be redirected in to homepage in 3s'
            });
            setTimeout(() => {
                router.push('/');
            }, 3000);
        } catch (error) {
            toast.error('There was an error deleting the video. Please try again');
            console.error('An error occurred while deleting the video: ', error);
        } finally {
            setIsDeleting(false);
        }
    }

    const handleVisibilityChange = async (visibilityOption: string) => {
        if (visibilityState !== visibilityOption) {
            try {
                setIsUpdating(true);

                toast.promise(updateVideoVisibilityState(visibilityOption as Visibility, videoId), {
                    loading: 'Updating video visibility...',
                    success: `The video visibility was successfully updated to ${visibilityOption.toUpperCase()}`,
                }).then(() => setVisibilityState(visibilityOption as Visibility));
                
            } catch (error) {
                toast.error('There was an error while trying to modify the video visibility. Please try again.');
                console.error('There was an error while trying to modify the video visibility: ', error);
            } finally {
                setIsUpdating(false);
            }
        }
    }

    useEffect(() => {
        const changeChecked = setTimeout(() => {
            if (copied) setCopied(false);
        }, 2000);

        return () => clearTimeout(changeChecked);
    }, [copied]);

    const TriggerVisibility = (
        <div className="visibility-trigger">
            <div>
                <Image
                    src="/assets/icons/eye.svg"
                    alt="Views"
                    width={16}
                    height={16}
                    className="mt-0.5"
                />
                <p>{visibilityState}</p>
            </div>
            <Image
                src="/assets/icons/arrow-down.svg"
                alt="Arrow Down"
                width={16}
                height={16}
            />
        </div>
    )

    return (
        <div className="detail-header">
            <aside className="user-info">
                <h1>{title}</h1>
                <figure>
                    <button onClick={() => router.push(`/profile/${ownerId}`)}>
                        <Image src={userImg || ''} alt="User" width={24} height={24} className="rounded-full" />
                        <h2>{username ?? 'Guest'}</h2>
                    </button>

                    <figcaption>
                        <span className="mt-1"> - </span>
                        <p>{daysAgo(createdAt)}</p>
                    </figcaption>
                </figure>
            </aside>

            <aside className="cta">
                <button onClick={handleCopyLink}>
                    <Image src={copied ? "/assets/images/checked.png" : '/assets/icons/link.svg'} alt="Copy link" width={24} height={24} />
                </button>
                {isOwner && (
                    <div className="user-btn">
                        <button className="delete-btn" onClick={handleDeleteVideo} disabled={isDeleting}>
                            {isDeleting ? 'Deleting video...' : 'Delete video'}
                        </button>
                        <div className="bar" />
                        {isUpdating ? (
                            <div className="upadate-stats">
                                <p>Updating...</p>
                            </div>
                        ) : (
                            <DropdownList
                                options={visibilities}
                                onOptionSelect={handleVisibilityChange}
                                selectedOption={visibilityState}
                                triggerElement={TriggerVisibility}
                            />
                        )}
                    </div>
                )}
            </aside>
        </div>
    )
}

export default VideoDetailHeader