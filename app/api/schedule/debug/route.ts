import { NextResponse } from 'next/server';
import { downloadSchedule } from '@/lib/scraper';
import * as XLSX from 'xlsx';

/**
 * GET /api/schedule/debug
 * Debug endpoint to inspect Excel file structure
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'niestacjonarne';

    // Download the schedule file
    console.log('Downloading schedule file from PK website...');
    const downloadResult = await downloadSchedule(filter);

    // Parse Excel file
    const workbook = XLSX.read(downloadResult.buffer, { type: 'buffer', cellDates: false });

    // Collect debug info
    const debug = {
      filename: downloadResult.filename,
      url: downloadResult.url,
      totalSheets: workbook.SheetNames.length,
      sheets: workbook.SheetNames.map(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: false,
        });

        // Find date cells (column 0, rows after 7)
        const dates: string[] = [];
        for (let rowIdx = 7; rowIdx < Math.min(data.length, 100); rowIdx++) {
          const dateCell = data[rowIdx]?.[0];
          if (dateCell && String(dateCell).trim()) {
            dates.push(String(dateCell).trim());
          }
        }

        return {
          name: sheetName,
          rows: data.length,
          columns: data[0]?.length || 0,
          headerRow5: data[4] || [],
          headerRow6: data[5] || [],
          groupRow7: data[6] || [],
          sampleDates: dates.slice(0, 10),
          totalDateCells: dates.length,
        };
      }),
    };

    return NextResponse.json({
      success: true,
      debug,
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
