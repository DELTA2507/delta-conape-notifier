const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const player = require('play-sound')();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

puppeteer.use(StealthPlugin());

const app = express();
const port = 3000;

// Serve static files (for the audio file)
app.use(express.static('public'));

app.get('/run-script', async (req, res) => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://www.conape.go.cr/prestamo-aprobado/#cita-virtual');

    let input = "input[class='el-input__inner']";
    let inputOption = "li[class='el-select-dropdown__item']";
    let button = "button[class='el-button el-button--primary']";

    await sleep(1000);

    // Click the input to start the process
    await page.waitForSelector(input);
    await page.evaluate((input) => {
      document.querySelector(input).click();
    }, input);

    await sleep(1000);

    // Choose the option from the dropdown
    await page.waitForSelector(inputOption);
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('li')).filter(li => {
        return li.innerText == 'Virtual - Solicitud de Indemnización o Pago a Terceros';
      }).forEach(element => {
        if (element) element.click();
      });
    });

    await sleep(1000);

    // Click 'Continuar' button
    await page.waitForSelector(button);
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).filter(button => {
        return button.innerText == 'Continuar';
      }).forEach(element => {
        if (element) element.click();
      });
    });

    // Check if date is found (empty style div)
    let hasEmptyStyleDiv = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("div.c-day-content"))
        .some(div => div.getAttribute("style") === "");
    });

    // Send response after checking the div
    if (hasEmptyStyleDiv) {
      res.send('DATE FOUND SUCCESSFULLY');
    } else {
      // If no date found, navigate back and retry
      await page.waitForSelector(button);
      await page.evaluate(() => {
        Array.from(document.querySelectorAll('button')).filter(button => {
          return button.innerText == 'Atrás';
        }).forEach(element => {
          if (element) element.click();
        });
      });

      await sleep(2000);

      await page.waitForSelector(button);
      await page.evaluate(() => {
        Array.from(document.querySelectorAll('button')).filter(button => {
          return button.innerText == 'Continuar';
        }).forEach(element => {
          if (element) element.click();
        });
      });

      res.send('NO DATE FOUND');
    }

    // Play the sound after sending the response
    playSound();
  } catch (err) {
    console.error('Error en el script:', err);
    res.status(500).send('Error en el script');
  }
});

function playSound() {
  const mp3Path = path.join(__dirname, 'public', 'successBell.mp3');
  const ffplayPath = path.join(__dirname, 'bin', 'ffplay.exe');

  player.play(mp3Path, { player: ffplayPath }, (err) => {
    if (err) {
      console.error('Error al reproducir sonido:', err);
    } else {
      console.log('¡Sonido reproducido con éxito!');
    }
  });
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});