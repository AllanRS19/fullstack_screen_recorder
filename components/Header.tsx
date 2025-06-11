'use client';

import Image from "next/image";
import Link from "next/link";
import DropdownList from "./DropdownList";
import RecordScreen from "./RecordScreen";
import { useEffect } from "react";
import { deleteVideo } from "@/lib/actions/video";

const Header = ({ subHeader, title, userImg }: SharedHeaderProps) => {

    // useEffect(() => {
    //     const videosToDelete = async () => {
    //         try {
    //             const response = await deleteVideo('4d3e0d3d-4f63-4d69-b926-68bc6d4fc9f8', 'https://ars-snapcast.b-cdn.net/thumbnails/1749561766551-4d3e0d3d-4f63-4d69-b926-68bc6d4fc9f8-thumbnail');
    //             console.log("This is the response: ", response);
    //         } catch (error) {
    //             console.error("This is an error: ", error);
    //         }
    //     }

    //     videosToDelete();
    // }, []);

    return (
        <header className="header">
            <section className="header-container">
                <div className="details">
                    {userImg && (
                        <Image src={userImg || '/assets/images/dummy.jpg'} alt="User" width={66} height={66} className="rounded-full" />
                    )}

                    <article>
                        <p>{subHeader}</p>
                        <h1>{title}</h1>
                    </article>
                </div>

                <aside>
                    <Link href="/upload">
                        <Image src="/assets/icons/upload.svg" alt="Upload" width={16} height={16} />
                        <span>Upload a video</span>
                    </Link>
                    <RecordScreen />
                </aside>
            </section>

            <section className="search-filter">
                <div className="search">
                    <input
                        type="text"
                        placeholder="Search for videos, tags, folders..."
                    />
                    <Image src="/assets/icons/search.svg" alt="Search" width={16} height={16} />
                </div>

                <DropdownList />
            </section>
        </header>
    )
}

export default Header;