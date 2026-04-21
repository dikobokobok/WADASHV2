import path from 'path';
import fs from 'fs';

// Resolve ffmpeg binary path safely at runtime.
// Next.js webpack corrupts __dirname inside ffmpeg-static/index.js,
// causing it to return a "/ROOT/..." virtual path (ENOENT).
// We resolve it manually using process.cwd() which always reflects the real CWD.
export const FFMPEG_PATH = (() => {
    const isWin = process.platform === 'win32';
    const binaryName = isWin ? 'ffmpeg.exe' : 'ffmpeg';
    const resolved = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', binaryName);
    
    if (fs.existsSync(resolved)) return resolved;
    
    // Fallback: try to require normally (works outside Next.js bundler)
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require('ffmpeg-static') as string;
    } catch {
        return null;
    }
})();
