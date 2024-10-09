import puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import { resolve } from 'path';
import fs from 'fs';

type Props = {
  date: string;
  key: string;
  startTime?: string | undefined;
}

export async function getImage2(
  props: Props
) {
  const path = resolve(__dirname, 'views', 'ticket2.hbs');
  const templateHtml = await fs.promises.readFile(path, 'utf-8');


  const template = handlebars.compile(templateHtml);

  const filledTemplate = template({ ...props });

  const browser = await puppeteer.launch({
    headless: 'shell',
    args: ['--no-sandbox'],
  });


  const page = await browser.newPage();

  await page.setContent(filledTemplate);

  await page.screenshot({
    type: 'png', path: 'temp/ticket.png',
    clip: { x: 0, y: 20, width: 600, height: 320, }
  });

  await page.close();


  return 'image';
}