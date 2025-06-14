'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import DropdownList from "./DropdownList";
import RecordScreen from "./RecordScreen";

import { filterOptions } from "@/constants";
import { updateURLParams } from "@/lib/utils";
import useDebounce from "@/lib/hooks/useDebounce";

const Header = ({ subHeader, title, userImg }: SharedHeaderProps) => {

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState(
        searchParams.get("query") || ""
    );

    const [selectedFilter, setSelectedFilter] = useState(
        searchParams.get("filter") || "Most Recent"
    );

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    // useEffect(() => {
    //     const debouceTimer = setTimeout(() => {
    //         if (searchQuery !== searchParams.get('query')) {
    //             const url = updateURLParams(
    //                 searchParams,
    //                 { query: searchQuery || null },
    //                 pathname
    //             );

    //             router.push(url);
    //         }
    //     }, 500);

    //     return () => clearTimeout(debouceTimer);
    // }, [searchQuery, searchParams, pathname, router]);

    useEffect(() => {
        setSearchQuery(searchParams.get("query") || "");
        setSelectedFilter(searchParams.get("filter") || "Most Recent");
    }, [searchParams]);

    useEffect(() => {

        const handleSearchQueryParam = async (query: string) => {
            try {
                
                const urlWithQuery = updateURLParams(
                    searchParams,
                    { query: query || null },
                    pathname
                );

                router.push(urlWithQuery);
            } catch (error) {
                console.log(error);
            }
        }

        handleSearchQueryParam(debouncedSearchQuery);

    }, [debouncedSearchQuery, searchParams, pathname, router]);

    const handleFilterChange = (filter: string) => {

        setSelectedFilter(filter);

        const url = updateURLParams(
            searchParams,
            { filter: filter || null },
            pathname
        );

        router.push(url);
    }

    const FilterElement = (
        <div className="filter-trigger">
            <figure>
                <Image src="/assets/icons/hamburger.svg" alt="Menu" width={14} height={14} />
                {selectedFilter}
            </figure>
            <Image src="/assets/icons/arrow-down.svg" alt="Arrow Down" width={20} height={20} />
        </div>
    )

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
                        onChange={(e) => setSearchQuery(e.target.value)}
                        value={searchQuery}
                    />
                    <Image src="/assets/icons/search.svg" alt="Search" width={16} height={16} />
                </div>

                <DropdownList
                    options={filterOptions}
                    onOptionSelect={handleFilterChange}
                    selectedOption={selectedFilter}
                    triggerElement={FilterElement}
                />
            </section>
        </header>
    )
}

export default Header;