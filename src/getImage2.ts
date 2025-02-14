import fs from 'fs';
import * as handlebars from 'handlebars';
import { resolve } from 'path';
import puppeteer from 'puppeteer';

type Props = {
  date: string;
  key: string;
  location: string;
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
    args: ['--no-sandbox', '--single-process'],
  });


  const page = await browser.newPage();

  await page.setContent(filledTemplate);

  await page.screenshot({
    type: 'png', path: 'temp/ticket.png',
    clip: { x: 0, y: 20, width: 580, height: props.startTime ? 460 : 420, }
  });

  await page.close();
  await browser.close();
}
