'use client';

import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { useRouter } from "next/navigation";

const NotFound = () => {

    const router = useRouter();

    const user = authClient.useSession();

    return (
        <div className="w-full bg-red-50">
            <section className="not-found-content">
                <aside className="not-found-info">
                    <h1>404</h1>
                    <p className="not-found-title">{user?.data !== null ? `Hi ${user.data?.user.name.split(" ")[0]}, y` : "Y"}ou weren&apos;t meant to see this...</p>
                    <p className="not-found-description">Either the internet has broken or we couldn&apos;t <br />find the file you were looking for.</p>
                    <button onClick={() => router.back()}>
                        Take me back
                    </button>
                </aside>
                <aside className="not-found-image">
                    <Image
                        src="/assets/images/error-404.png"
                        alt="Not found"
                        width={160}
                        height={160}
                    />
                </aside>
            </section>
        </div>
    )
}

export default NotFound