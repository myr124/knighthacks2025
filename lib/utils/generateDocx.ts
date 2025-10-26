/**
 * Utility to convert markdown AAR document to Word (.docx) format
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  VerticalAlign,
  ShadingType,
} from 'docx';

interface ParsedContent {
  type: 'heading' | 'paragraph' | 'bullet' | 'table' | 'separator';
  level?: number;
  text?: string;
  rows?: string[][];
  isBold?: boolean;
  isItalic?: boolean;
}

type DocumentChild = Paragraph | Table;

/**
 * Parse markdown text into structured content
 */
function parseMarkdown(markdown: string): ParsedContent[] {
  const lines = markdown.split('\n');
  const parsed: ParsedContent[] = [];
  let currentTable: string[][] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines unless in table
    if (!line && !inTable) {
      parsed.push({ type: 'paragraph', text: '' });
      continue;
    }

    // Heading
    if (line.startsWith('#')) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        parsed.push({
          type: 'heading',
          level: match[1].length,
          text: match[2],
        });
        continue;
      }
    }

    // Horizontal rule / separator
    if (line.match(/^[-*_]{3,}$/)) {
      parsed.push({ type: 'separator' });
      continue;
    }

    // Table detection (starts with |)
    if (line.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        currentTable = [];
      }

      // Skip separator rows
      if (line.match(/^\|[\s:-]+\|/)) {
        continue;
      }

      const cells = line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim());

      currentTable.push(cells);
      continue;
    } else if (inTable) {
      // End of table
      parsed.push({ type: 'table', rows: currentTable });
      currentTable = [];
      inTable = false;
    }

    // Bullet point
    if (line.match(/^[-*+]\s+/)) {
      const text = line.replace(/^[-*+]\s+/, '');
      parsed.push({ type: 'bullet', text });
      continue;
    }

    // Regular paragraph
    parsed.push({ type: 'paragraph', text: line });
  }

  // Handle remaining table
  if (inTable && currentTable.length > 0) {
    parsed.push({ type: 'table', rows: currentTable });
  }

  return parsed;
}

/**
 * Convert text with markdown formatting to TextRun array
 */
function parseTextFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const boldItalicRegex = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*/g;

  let lastIndex = 0;
  let match;

  while ((match = boldItalicRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      runs.push(new TextRun(text.substring(lastIndex, match.index)));
    }

    // Add formatted text
    if (match[1]) {
      // Bold + Italic
      runs.push(new TextRun({ text: match[1], bold: true, italics: true }));
    } else if (match[2]) {
      // Bold
      runs.push(new TextRun({ text: match[2], bold: true }));
    } else if (match[3]) {
      // Italic
      runs.push(new TextRun({ text: match[3], italics: true }));
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    runs.push(new TextRun(text.substring(lastIndex)));
  }

  return runs.length > 0 ? runs : [new TextRun(text)];
}

/**
 * Generate a Word document from markdown AAR text
 */
export async function generateAARDocx(
  markdownText: string,
  metadata: { scenarioName: string; location: string; date: string }
): Promise<Blob> {
  const parsed = parseMarkdown(markdownText);
  const sections: DocumentChild[] = [];

  // Add title page
  sections.push(
    new Paragraph({
      text: 'AFTER-ACTION REPORT / IMPROVEMENT PLAN',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: metadata.scenarioName,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: metadata.location,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: `Generated: ${new Date(metadata.date).toLocaleDateString()}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: '',
      spacing: { after: 400 },
    })
  );

  // Process parsed content
  for (const item of parsed) {
    switch (item.type) {
      case 'heading':
        const headingLevel =
          item.level === 1
            ? HeadingLevel.HEADING_1
            : item.level === 2
            ? HeadingLevel.HEADING_2
            : item.level === 3
            ? HeadingLevel.HEADING_3
            : HeadingLevel.HEADING_4;

        sections.push(
          new Paragraph({
            text: item.text || '',
            heading: headingLevel,
            spacing: { before: 240, after: 120 },
          })
        );
        break;

      case 'paragraph':
        if (item.text) {
          sections.push(
            new Paragraph({
              children: parseTextFormatting(item.text),
              spacing: { after: 120 },
            })
          );
        } else {
          sections.push(new Paragraph({ text: '' }));
        }
        break;

      case 'bullet':
        sections.push(
          new Paragraph({
            children: parseTextFormatting(item.text || ''),
            bullet: { level: 0 },
            spacing: { after: 80 },
          })
        );
        break;

      case 'separator':
        sections.push(
          new Paragraph({
            text: '_______________________________________________',
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 120 },
          })
        );
        break;

      case 'table':
        // Skip empty tables
        if (!item.rows || item.rows.length === 0) break;

        // Add space before table
        sections.push(
          new Paragraph({
            text: '',
            spacing: { before: 120, after: 120 },
          })
        );

        // Create table rows
        const tableRows = item.rows.map((row, rowIndex) => {
          const isHeader = rowIndex === 0;

          return new TableRow({
            children: row.map((cell) => {
              return new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cell,
                        bold: isHeader,
                        color: isHeader ? 'FFFFFF' : undefined,
                      }),
                    ],
                    spacing: { before: 100, after: 100 },
                  }),
                ],
                shading: isHeader
                  ? {
                      type: ShadingType.SOLID,
                      color: '4472C4',
                      fill: '4472C4',
                    }
                  : undefined,
                verticalAlign: VerticalAlign.CENTER,
                margins: {
                  top: 100,
                  bottom: 100,
                  left: 100,
                  right: 100,
                },
              });
            }),
            tableHeader: isHeader,
          });
        });

        // Create and add the table
        const table = new Table({
          rows: tableRows,
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
          },
        });

        sections.push(table);

        // Add space after table
        sections.push(
          new Paragraph({
            text: '',
            spacing: { before: 120, after: 120 },
          })
        );
        break;
    }
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  // Generate blob
  const buffer = await Packer.toBlob(doc);
  return buffer;
}
