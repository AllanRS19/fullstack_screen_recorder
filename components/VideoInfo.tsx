'use client';

import { cn, parseTranscript } from "@/lib/utils";
import { useState } from "react";
import EmptyState from "./EmptyState";
import { infos } from "@/constants";

const VideoInfo = ({
    id,
    transcript,
    createdAt,
    title,
    description,
    videoId
}: VideoInfoProps) => {

    const [info, setInfo] = useState('transcript');
    const parsedVideoTranscript = parseTranscript(transcript || "");

    const renderTranscript = () => (
        <ul className="transcript">
            {parsedVideoTranscript.length > 0 ? (
                parsedVideoTranscript.map((item, index) => (
                    <li key={index}>
                        <h2>[{item.time}]</h2>
                        <p>{item.text}</p>
                    </li>
                ))
            ) : (
                <EmptyState 
                    icon="/assets/icons/copy.svg"
                    title="No transcript available for this video"
                    description="This video doesn't include any transcribed content"
                />
            )}
        </ul>
    )

    const metaDatas = [
        {
            label: "Video title",
            value: `${title} - ${new Date(createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })}`
        },
        {
            label: "Video description",
            value: description
        },
        {
            label: "Video ID",
            value: videoId
        },
        {
            label: "Video URL",
            value: `${process.env.NEXT_PUBLIC_BASE_URL}/video/${id}`
        }
    ];
    
    const renderMetadata = () => (
        <div className="metadata">
            {metaDatas.map(({ label, value }, index) => (
                <article key={index}>
                    <h2>{label}</h2>
                    <p className={cn({
                        "text-pink-100 text-wrap": label === "Video URL"
                    })}>
                        {value}
                    </p>
                </article>
            ))}
        </div>
    )

    return (
        <div className="video-info">
            <nav>
                {infos.map((item) => (
                    <button
                        key={item}
                        className={cn({
                            "text-pink-100 border-b-2 border-pink-100": info === item
                        })}
                        onClick={() => setInfo(item)}
                    >
                        {item}
                    </button>
                ))}
            </nav>
            {info === 'transcript' ? renderTranscript() : renderMetadata()}
        </div>
    )
}

export default VideoInfo