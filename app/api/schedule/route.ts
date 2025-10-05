import { NextResponse } from 'next/server';
import { downloadSchedule } from '@/lib/scraper';
import { parseExcelSchedule } from '@/lib/excel-parser';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s dla Pro, 10s dla Hobby

/**
 * GET /api/schedule
 * Główne API - pobiera plan bezpośrednio (bez bazy dla Vercel)
 */
export async function GET() {
  try {
    console.log('Downloading schedule from PK...');
    const downloadResult = await downloadSchedule('niestacjonarne');

    console.log('Parsing Excel file...');
    const schedule = parseExcelSchedule(downloadResult.buffer);

    console.log(`Successfully parsed ${schedule.sections.length} sections`);

    return NextResponse.json({
      success: true,
      data: schedule,
      timestamp: schedule.lastUpdated,
      sections: schedule.sections.length,
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
