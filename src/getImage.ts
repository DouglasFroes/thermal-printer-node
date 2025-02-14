import fs from 'fs';
import * as handlebars from 'handlebars';
import { resolve } from 'path';
import puppeteer from 'puppeteer';

type Props = {
  location: string;
  date: string;
  key: string;
}

export async function getImage(
  props: Props
) {
  const path = resolve(__dirname, 'views', 'ticket.hbs');
  const templateHtml = await fs.promises.readFile(path, 'utf-8');

  const template = handlebars.compile(templateHtml);

  const filledTemplate = template({ ...props });

  const browser = await puppeteer.launch({
    headless: 'shell',
    args: ['--no-sandbox', '--single-process'],
  });

  const page = await browser.newPage();

  await page.setContent(filledTemplate);

  await page.screenshot({
    type: 'png', path: 'temp/ticket.png',
    optimizeForSpeed: true,
    clip: { x: 0, y: 30, width: 600, height: 370, }
  });

  await page.close({ runBeforeUnload: true, });
  await browser.close();
}