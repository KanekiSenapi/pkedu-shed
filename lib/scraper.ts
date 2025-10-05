import axios from 'axios';
import * as cheerio from 'cheerio';

const PK_SCHEDULE_URL = 'https://it.pk.edu.pl/studenci/na-studiach/rozklady-zajec/';

export interface DownloadResult {
  buffer: Buffer;
  filename: string;
  url: string;
}

/**
 * Fetches the schedule page and finds Excel file links
 */
export async function findScheduleFiles(): Promise<string[]> {
  try {
    const response = await axios.get(PK_SCHEDULE_URL, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    const excelFiles: string[] = [];

    // Find all links to Excel files (.xls, .xlsx)
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && (href.endsWith('.xls') || href.endsWith('.xlsx'))) {
        // Convert relative URLs to absolute
        const absoluteUrl = href.startsWith('http')
          ? href
          : new URL(href, PK_SCHEDULE_URL).href;
        excelFiles.push(absoluteUrl);
      }
    });

    return excelFiles;
  } catch (error) {
    console.error('Error fetching schedule files:', error);
    throw new Error('Failed to fetch schedule files from PK website');
  }
}

/**
 * Downloads an Excel file from the given URL
 */
export async function downloadExcelFile(url: string): Promise<DownloadResult> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const buffer = Buffer.from(response.data);
    const filename = url.split('/').pop() || 'schedule.xlsx';

    return {
      buffer,
      filename,
      url,
    };
  } catch (error) {
    console.error('Error downloading Excel file:', error);
    throw new Error(`Failed to download Excel file from ${url}`);
  }
}

/**
 * Finds and downloads the schedule file for non-stationary students (niestacjonarne)
 * If filter is not provided, downloads the first available Excel file
 */
export async function downloadSchedule(filter?: string): Promise<DownloadResult> {
  const files = await findScheduleFiles();

  if (files.length === 0) {
    throw new Error('No Excel files found on the schedule page');
  }

  // If filter is provided, try to find matching file
  let targetUrl = files[0];

  if (filter) {
    const matchingFile = files.find(url =>
      url.toLowerCase().includes(filter.toLowerCase())
    );

    if (matchingFile) {
      targetUrl = matchingFile;
    }
  }

  return downloadExcelFile(targetUrl);
}

/**
 * Downloads all available schedule files
 */
export async function downloadAllSchedules(): Promise<DownloadResult[]> {
  const files = await findScheduleFiles();
  const results: DownloadResult[] = [];

  for (const url of files) {
    try {
      const result = await downloadExcelFile(url);
      results.push(result);
    } catch (error) {
      console.error(`Failed to download ${url}:`, error);
      // Continue with other files
    }
  }

  return results;
}
