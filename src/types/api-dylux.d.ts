declare module 'api-dylux' {
    interface TikTokAuthor {
        id: string;
        unique_id: string;
        nickname: string;
        avatar: string;
    }

    interface TikTokMusicInfo {
        id: string;
        title: string;
        play: string;
        cover: string;
        author: string;
        original: boolean;
        duration: number;
        album: string;
    }

    interface TikTokResult {
        id: string;
        region: string;
        title: string;
        content_desc: string[];
        cover: string;
        ai_dynamic_cover: string;
        origin_cover: string;
        duration: number;
        play: string;
        wmplay: string;
        size: number;
        wm_size: number;
        music: string;
        music_info: TikTokMusicInfo;
        play_count: number;
        digg_count: number;
        comment_count: number;
        share_count: number;
        download_count: number;
        collect_count: number;
        create_time: number;
        is_ad: boolean;
        author: TikTokAuthor;
    }

    interface TikTokResponse {
        result: TikTokResult;
    }

    interface Senna {
        tiktok(url: string): Promise<TikTokResponse>;
    }

    const senna: Senna;
    export default senna;
}
