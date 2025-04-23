const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin())

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run () {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://www.conape.go.cr/prestamo-aprobado/');

    let input = "input[class='el-input__inner']"
    let inputOption = "li[class='el-select-dropdown__item']"
    let button = "button[class='el-button el-button--primary']"

    await sleep(5000);

    await page.waitForSelector(input);
    await page.evaluate((input) => {
        document.querySelector(input).click()
    }, input)

    await sleep(5000);

    await page.waitForSelector(inputOption);
    await page.evaluate(() => {
        Array.from(document.querySelectorAll('li')).filter(li => {
            return li.innerText == 'Presencial - Firma de Contrato' // filter il for specific text
        }).forEach(element => {
            if (element) element.click(); // click on il with specific text
        });
    });

    await sleep(2000);

    await page.waitForSelector(button);
    await page.evaluate(() => {
        Array.from(document.querySelectorAll('button')).filter(button => {
            return button.innerText== 'Continuar'
        }).forEach(element => {
            if (element) element.click();
        });
    });
}

run()