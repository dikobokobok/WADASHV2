import { NextResponse } from 'next/server';
import { categoryRegistry } from '@/engine/plugins/index';

export async function GET() {
    try {
        const categories = Array.from(categoryRegistry.entries()).map(([category, commands]) => ({
            category,
            commands
        }));
        
        return NextResponse.json({ success: true, data: categories });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
