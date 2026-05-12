import { z } from "zod";

const identifierSchema = z.string().trim().min(1).max(200);
const passwordAttemptSchema = z.string().min(1).max(200);

export const loginBodySchema = z.object({
    identifier: identifierSchema,
    password: passwordAttemptSchema,
});

export const registerBodySchema = z
    .object({
        username: z
            .string()
            .trim()
            .min(2)
            .max(64)
            .regex(/^[a-zA-Z0-9_\-.]+$/, "Username may only contain letters, numbers, and _ - ."),
        email: z.string().trim().max(254).email(),
        password: z.string().min(8).max(128),
        turnstileToken: z.string().min(10).max(2048).optional(),
    })
    .strict();

/** Partial bot settings from client — unknown keys rejected. */
export const botConfigUpdateSchema = z
    .object({
        botName: z.string().min(1).max(120).optional(),
        packname: z.string().max(80).optional(),
        authorname: z.string().max(80).optional(),
        footerText: z.string().max(500).optional(),
        limit: z.number().int().min(0).max(1_000_000).optional(),
        balance: z.number().min(0).max(1e12).optional(),
        ownerName: z.string().max(120).optional(),
        ownerNumber: z.string().max(32).optional(),
        prefix: z.string().max(20).optional(),
        prefixType: z.enum(["single", "multi", "empty"]).optional(),
        onlineOnConnect: z.boolean().optional(),
        premiumNotification: z.boolean().optional(),
        sewaNotificationToGroup: z.boolean().optional(),
        sewaNotificationToOwner: z.boolean().optional(),
        joinToUse: z.boolean().optional(),
        autoRead: z.boolean().optional(),
        menuTemplate: z.string().max(20000).optional(),
    })
    .strict();

export const engineActionBodySchema = z
    .object({
        action: z.enum(["start", "stop", "delete"]),
    })
    .strict();

export const apiRespondersBodySchema = z.array(
    z.object({
        id: z.string().min(1).max(80),
        actionTrigger: z.string().max(200),
        category: z.string().max(120),
        apiLink: z.string().max(2000),
        sendOption: z.enum(["text", "media", "image", "video", "gif", "sticker"]),
    })
);
