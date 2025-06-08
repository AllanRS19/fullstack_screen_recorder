'use client'

import { filterOptions } from "@/constants";
import Image from "next/image";
import { useState } from "react";

const DropdownList = () => {

    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <div className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="filter-trigger">
                    <figure>
                        <Image src="/assets/icons/hamburger.svg" alt="Menu" width={14} height={14} />
                        Most Recent
                    </figure>
                    <Image src="/assets/icons/arrow-down.svg" alt="Arrow Down" width={20} height={20} />
                </div>
            </div>

            {isOpen && (
                <ul className="dropdown">
                    {filterOptions.map((filter) => (
                        <li className="list-item" key={filter}>
                            {filter}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default DropdownList;