import Navbar from "@/components/Navbar"
import { ReactNode } from "react"
import { Toaster } from "react-hot-toast"

const Layout = ({ children }: { children: ReactNode }) => {
    return (
        <div>
            <Navbar />
            {children}
            <Toaster />
        </div>
    )
}

export default Layout