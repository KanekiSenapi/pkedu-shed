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

        // Find ALL date cells (column 0, rows after 7)
        const dates: string[] = [];
        const dateCellsRaw: Array<{ row: number; raw: any; parsed: string | null }> = [];

        for (let rowIdx = 7; rowIdx < data.length; rowIdx++) {
          const dateCell = data[rowIdx]?.[0];
          if (dateCell && String(dateCell).trim()) {
            const rawValue = String(dateCell).trim();
            dates.push(rawValue);

            // Try to parse the date to see if parsing fails
            let parsedDate: string | null = null;
            if (typeof dateCell === 'number') {
              const date = XLSX.SSF.parse_date_code(dateCell);
              if (date) {
                const year = date.y;
                const month = String(date.m).padStart(2, '0');
                const day = String(date.d).padStart(2, '0');
                parsedDate = `${year}-${month}-${day}`;
              }
            } else if (typeof dateCell === 'string') {
              const isoMatch = dateCell.match(/(\d{4})-(\d{2})-(\d{2})/);
              if (isoMatch) {
                parsedDate = dateCell;
              } else {
                const parsed = new Date(dateCell);
                if (!isNaN(parsed.getTime())) {
                  const year = parsed.getFullYear();
                  const month = String(parsed.getMonth() + 1).padStart(2, '0');
                  const day = String(parsed.getDate()).padStart(2, '0');
                  parsedDate = `${year}-${month}-${day}`;
                }
              }
            }

            dateCellsRaw.push({ row: rowIdx, raw: dateCell, parsed: parsedDate });
          }
        }

        return {
          name: sheetName,
          rows: data.length,
          columns: data[0]?.length || 0,
          headerRow5: data[4] || [],
          headerRow6: data[5] || [],
          groupRow7: data[6] || [],
          allDates: dateCellsRaw,
          totalDateCells: dates.length,
          firstDate: dateCellsRaw[0]?.parsed || null,
          lastDate: dateCellsRaw[dateCellsRaw.length - 1]?.parsed || null,
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
