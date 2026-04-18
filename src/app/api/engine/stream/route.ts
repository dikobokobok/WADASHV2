import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/auth";
import botManager from "@/engine/BotManager";

// Force Next.js to not cache this route and support streaming
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const userId = await getAuthCookie();
    if (!userId) {
        return new Response("Unauthorized", { status: 401 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            // Function to send event to client
            const sendEvent = (event: string, data: any) => {
                controller.enqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
            };

            // Send initial status immediately when connected
            const currentStatus = botManager.getStatus(userId);
            sendEvent('status', currentStatus);

            // Listen for status updates from the BotManager for this specific user
            const onStatusUpdate = (update: { uuid: string, status: any }) => {
                if (update.uuid === userId) {
                    sendEvent('status', update.status);
                }
            };

            botManager.on('status-update', onStatusUpdate);
            
            // Listen for verbose logs
            const onLogUpdate = (update: { uuid: string, log: string }) => {
                if (update.uuid === userId) {
                    sendEvent('log', { message: update.log });
                }
            };
            botManager.on('log-update', onLogUpdate);

            // Ping to keep connection alive
            const interval = setInterval(() => {
                sendEvent('ping', { time: Date.now() });
            }, 10000);

            // Cleanup when the stream connection is closed by the client
            request.signal.addEventListener('abort', () => {
                botManager.off('status-update', onStatusUpdate);
                botManager.off('log-update', onLogUpdate);
                clearInterval(interval);
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
