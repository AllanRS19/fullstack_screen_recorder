import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { withErrorHandling } from "../utils";

export const getUserName = withErrorHandling(async (userId: string) => {
    try {
        const [{ userName }] = await db.select({ userName: user.name }).from(user).where(eq(user.id, userId));
        if (!user) throw new Error('There was an error fetching the user data');

        return userName;
    } catch (error) {
        console.log(error);
        throw new Error('There was an error returning the user');
    }
});