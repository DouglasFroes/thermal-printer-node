import express, { Request, Response } from 'express';
import { SerialPort, } from 'serialport';
import { getImage } from './getImage';
import { getImage2 } from './getImage2';

const escpos = require('escpos');
const app = express();
const port = 5647;

app.use(express.json());

app.get('/portas', async (req: Request, res: Response) => {
  try {
    const ports = await SerialPort.list();

    res.json(ports);
  } catch (error) {
    console.error('Erro ao listar portas seriais:', error);
    res.status(500).json({ error: 'Erro ao listar portas seriais' });
  }
});

type IBody = {
  date: string;
  location: string;
  key: string;
  path: string;
  startTime?: string;
  type: '1' | '2';
}

app.post('/printer', async (req: Request, res: Response) => {
  try {
    const { path, date, location, key, type, startTime } = req.body as IBody;

    if (!path || !date || !location || !key || !type) {
      return res.status(400).send('Parâmetros inválidos');
    }

    if (type === '2') {
      await getImage2({ date, location, key, startTime });
    } else {
      await getImage({ date, location, key });
    }

    const ports = await SerialPort.list();
    const selectedPort = ports.find((item) => item.path === path);

    if (!selectedPort) {
      return res.status(400).send('Impressora não encontrada');
    }

    const device = new SerialPort({ path, baudRate: 57600, autoOpen: false });
    const printer = new escpos.Printer(device);

    escpos.Image.load('temp/ticket.png', function (image: any) {
      if (image instanceof Error) {
        return res.status(500).send('Erro ao carregar imagem');
      }

      device.open(function () {
        printer
          .raster(image)
          .cut()
          .close(
            () => {
              res.send('Impressão realizada com sucesso');
            }
          );
      });
    });

  } catch (error) {
    console.error('Erro no processo de impressão:', error);
    res.status(500).send('Erro no processo de impressão');
  }
});

app.post('/printer-text', async (req: Request, res: Response) => {
  try {
    const { path, date, location, key, type, startTime } = req.body as IBody;

    if (!path || !date || !location || !key || !type) {
      return res.status(400).send('Parâmetros inválidos');
    }

    const ports = await SerialPort.list();
    const selectedPort = ports.find((item) => item.path === path);

    if (!selectedPort) {
      return res.status(400).send('Impressora não encontrada');
    }



    const device = new SerialPort({ path: selectedPort.path, baudRate: 57600, autoOpen: false });
    const printer = new escpos.Printer(device);


    device.open((error) => {
      if (error && error.message !== 'Port is opening') {
        console.error('Erro ao abrir a porta serial:', error);
        return res.status(400).send(error.message);
      }

      if (type === '2') {
        printer
          .align('CT')
          .size(1, 1)
          .text(`\x1b\x45\x01heck-in rápido realizado\x1b\x45\x00`, 'CP860')
          .feed(1)
          .size(4 as 1, 4 as 1)
          .text(key, 'CP860')
          .size(0 as 1, 0 as 1)
          .text('\x1b\x45\x01Se direcione ao painel de consultórios\npara ser atendido.\x1b\x45\x01', 'CP860')
          .text(startTime ? `Sua consulta está prevista para as ${startTime}.` : ``, 'CP860')
          .text('')
          .text(date, 'CP860')
          .feed(3)
          .cut()
          .beep(3, 100)
          .close(() => {
            res.send('Impressão realizada com sucesso');
          });
      } else {
        printer
          .align('CT')
          .size(1, 1)
          .text(`\x1b\x45\x01Leve Saude - ${location}\x1b\x45\x00`, 'CP860')
          .feed(1)
          .size(4 as 1, 4 as 1)
          .text(key, 'CP860')
          .size(0 as 1, 0 as 1)
          .text('\x1b\x45\x01Observe o painel da recepcao\npara ser atendido.\x1b\x45\x00', 'CP860')
          .newLine()
          .text(date, 'CP860')
          .feed(3)
          .beep(2, 100)
          .cut()
          .close(() => {
            res.send('Impressão realizada com sucesso');
          });
      }
    });
  } catch (error) {
    console.error('Erro no processo de impressão:', error);
    res.status(500).send('Erro no processo de impressão');
  }
});

app.post('/printer-image', async (req: Request, res: Response) => {
  try {
    const { path, date, location, key, type, startTime } = req.body as IBody;

    if (!path || !date || !location || !key || !type) {
      return res.status(400).send('Parâmetros inválidos');
    }

    if (type === '2') {
      await getImage2({ date, key, startTime, location });
    } else {
      await getImage({ date, location, key });
    }

    const ports = await SerialPort.list();
    const selectedPort = ports.find((item) => item.path === path);

    if (!selectedPort) {
      return res.status(400).send('Impressora não encontrada');
    }

    const device = new SerialPort({ path: selectedPort.path, autoOpen: false, baudRate: 57600, });
    const printer = new escpos.Printer(device);

    device.open((error) => {
      if (error && error.message !== 'Port is opening') {
        console.error('Erro ao abrir a porta serial:', error);
        return res.status(400).send(error.message);
      }

      escpos.Image.load('temp/ticket.png', (image: any) => {
        if (image instanceof Error) {
          return res.status(500).send('Erro ao carregar imagem');
        }

        printer
          .image(image, 'd24')
          .then(() => {
            printer.cut()
              .close(
                () => {
                  res.send('Impressão realizada com sucesso');
                }
              );
          })
      });
    });
  } catch (error) {
    console.error('Erro no processo de impressão:', error);
    res.status(500).send('Erro no processo de impressão');
  }
});

// Rota padrão para qualquer outra requisição
app.get('*', (req: Request, res: Response) => {
  res.status(404).send('Rota não encontrada!');
});

app.listen(port, () => {
  console.log(`Servidor rodando em: http://localhost:${port}`);
});
