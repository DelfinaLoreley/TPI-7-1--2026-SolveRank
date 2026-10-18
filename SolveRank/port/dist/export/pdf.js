import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import { TNoodleError } from '../core/errors.js';
import { ENGINE } from '../core/types.js';
import { EVENTS } from '../events/catalog.js';
import { checkAbort } from './model.js';
const MARGIN = 36;
const WIDTH = 595.28 - MARGIN * 2;
const BOTTOM = 841.89 - 46;
const ROW_FONT = 9;
const LINE = 12;
function lines(doc, text, width, font, size) {
    doc.font(font).fontSize(size);
    const result = [];
    for (const paragraph of text.split(/\r?\n/u)) {
        let current = '';
        for (const word of paragraph.trim().split(/\s+/u)) {
            if (doc.widthOfString(word) > width)
                throw new TNoodleError('EXPORT_ERROR', 'An algorithm token is too wide for the PDF.');
            const next = current ? `${current} ${word}` : word;
            if (current && doc.widthOfString(next) > width) {
                result.push(current);
                current = word;
            }
            else
                current = next;
        }
        result.push(current);
    }
    return result;
}
function textLines(doc, text, x, y, font, size, spacing = LINE) {
    doc.font(font).fontSize(size).fillColor('black');
    for (const [index, line] of text.entries()) {
        doc.text(line, x, y + index * spacing, { lineBreak: false });
    }
}
function header(doc, document, sheet, detail = '') {
    doc.addPage();
    let y = MARGIN;
    const title = lines(doc, document.competition, WIDTH, 'Helvetica-Bold', 16);
    textLines(doc, title, MARGIN, y, 'Helvetica-Bold', 16, 20);
    y += title.length * 20 + 5;
    textLines(doc, [EVENTS[sheet.batch.event].name + (detail ? ` - ${detail}` : '')], MARGIN, y, 'Helvetica-Bold', 12, 16);
    y += 20;
    const meta = lines(doc, `${sheet.round} | ${sheet.group}`, WIDTH, 'Helvetica', 10);
    textLines(doc, meta, MARGIN, y, 'Helvetica', 10, 14);
    y += meta.length * 14 + 4;
    textLines(doc, ['CONFIDENTIAL - unofficial competition / not WCA-approved'], MARGIN, y, 'Helvetica', 8);
    y += 20;
    doc.moveTo(MARGIN, y - 5).lineTo(MARGIN + WIDTH, y - 5).strokeColor('#888888').stroke();
    return y;
}
function diagram(doc, svg, x, y, width, height) {
    SVGtoPDF(doc, svg, x, y, {
        width, height, preserveAspectRatio: 'xMidYMid meet',
        warningCallback: message => { throw new TNoodleError('EXPORT_ERROR', `SVG/PDF rendering warning: ${message}`); },
    });
}
function attemptLabel(attempt) {
    return `${attempt.extra ? 'Extra ' : 'Attempt '}${attempt.number}`;
}
function normalSheet(doc, document, sheet, signal) {
    let y = header(doc, document, sheet);
    const algorithmWidth = WIDTH - 150;
    for (const attempt of sheet.batch.attempts) {
        for (const [cube, scramble] of attempt.scrambles.entries()) {
            checkAbort(signal);
            const caption = attemptLabel(attempt) + (sheet.batch.event === '333mbf' ? ` / Cube ${cube + 1}` : '');
            const wrapped = lines(doc, scramble.text, algorithmWidth, 'Courier', ROW_FONT);
            let position = 0;
            while (position < wrapped.length) {
                if (BOTTOM - y < 116)
                    y = header(doc, document, sheet, sheet.batch.event === '333mbf' ? attemptLabel(attempt) : 'continued');
                const capacity = Math.max(1, Math.floor((BOTTOM - y - 32) / LINE));
                const chunk = wrapped.slice(position, position + capacity);
                textLines(doc, [caption + (position ? ' (continued)' : '')], MARGIN, y, 'Helvetica-Bold', 10);
                textLines(doc, chunk, MARGIN, y + 18, 'Courier', ROW_FONT);
                const bodyHeight = Math.max(chunk.length * LINE, position === 0 ? 86 : 0);
                if (position === 0)
                    diagram(doc, scramble.svg, MARGIN + WIDTH - 140, y + 16, 136, 88);
                y += bodyHeight + 32;
                doc.moveTo(MARGIN, y - 10).lineTo(MARGIN + WIDTH, y - 10).strokeColor('#dddddd').stroke();
                position += chunk.length;
            }
        }
        // Each Multi-Blind attempt is a private, separately paginated set.
        if (sheet.batch.event === '333mbf' && attempt !== sheet.batch.attempts.at(-1)) {
            y = header(doc, document, sheet, 'next attempt');
        }
    }
}
function fmcSheet(doc, document, sheet, signal) {
    for (const attempt of sheet.batch.attempts) {
        checkAbort(signal);
        const scramble = attempt.scrambles[0];
        let y = header(doc, document, sheet, attemptLabel(attempt));
        textLines(doc, ['Competitor: _______________________   ID: __________   Result: ______ moves'], MARGIN, y, 'Helvetica', 10);
        y += 26;
        const wrapped = lines(doc, scramble.text, WIDTH, 'Courier', 11);
        let offset = 0;
        while (offset < wrapped.length) {
            const capacity = Math.max(1, Math.floor((BOTTOM - y - 30) / 15));
            const chunk = wrapped.slice(offset, offset + capacity);
            textLines(doc, chunk, MARGIN, y, 'Courier', 11, 15);
            y += chunk.length * 15 + 20;
            offset += chunk.length;
            if (offset < wrapped.length)
                y = header(doc, document, sheet, `${attemptLabel(attempt)} continued`);
        }
        if (BOTTOM - y < 200)
            y = header(doc, document, sheet, `${attemptLabel(attempt)} solution`);
        diagram(doc, scramble.svg, MARGIN, y, 180, 120);
        textLines(doc, ['Time limit: 60 minutes', 'Write your solution below.',
            'Notation: U D L R F B, rotations x y z,',
            'wide moves with w. Clearly mark the final solution.',
            'Unofficial practice sheet, not an official WCA form.'], MARGIN + 200, y + 10, 'Helvetica', 9, 15);
        y += 140;
        while (y < BOTTOM - 18) {
            doc.moveTo(MARGIN, y).lineTo(MARGIN + WIDTH, y).strokeColor('#cccccc').stroke();
            y += 22;
        }
    }
}
export function pdf(document, signal) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            autoFirstPage: false, bufferPages: true, size: 'A4', margin: MARGIN,
            info: { Title: document.competition, Author: 'tnoodle-native',
                Subject: 'Private scrambles for unofficial competitions', Creator: `tnoodle-native ${ENGINE.portVersion}` },
        });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('error', (cause) => reject(cause instanceof TNoodleError ? cause :
            new TNoodleError('EXPORT_ERROR', 'Unable to create scramble PDF.', { cause })));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        try {
            for (const sheet of document.sheets) {
                checkAbort(signal);
                if (sheet.batch.event === '333fm')
                    fmcSheet(doc, document, sheet, signal);
                else
                    normalSheet(doc, document, sheet, signal);
            }
            const pages = doc.bufferedPageRange();
            for (let i = pages.start; i < pages.start + pages.count; i++) {
                doc.switchToPage(i);
                textLines(doc, [`TNoodle ${ENGINE.version} / native ${ENGINE.portVersion} - Page ${i + 1} of ${pages.count}`], MARGIN, doc.page.height - 28, 'Helvetica', 7);
            }
            checkAbort(signal);
            doc.end();
        }
        catch (cause) {
            const error = cause instanceof TNoodleError ? cause : new TNoodleError('EXPORT_ERROR', 'Unable to render scramble PDF.', { cause });
            doc.destroy(error);
        }
    });
}
//# sourceMappingURL=pdf.js.map