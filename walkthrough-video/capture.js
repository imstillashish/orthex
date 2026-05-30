const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Higher scale factor for crisp screenshots in the video
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
    
    const fileUrl = 'file://' + path.resolve('../demo.html');
    console.log(`Loading ${fileUrl}...`);
    await page.goto(fileUrl, {waitUntil: 'networkidle0'});
    
    // Wait for Mermaid charts and fonts to fully render
    await new Promise(r => setTimeout(r, 1500));
    
    const outDir = path.resolve('public/assets/screens');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive: true});

    console.log('Capturing screenshots...');

    const home = await page.$('.demo-section:nth-of-type(4) .demo-box:nth-of-type(1) .mock-popup');
    if (home) await home.screenshot({path: path.join(outDir, '01_home.png')});

    const settings = await page.$('.demo-section:nth-of-type(5) .demo-box:nth-of-type(1) .mock-popup');
    if (settings) await settings.screenshot({path: path.join(outDir, '02_settings.png')});

    const stats = await page.$('.demo-section:nth-of-type(6) .demo-box:nth-of-type(1) .mock-popup');
    if (stats) await stats.screenshot({path: path.join(outDir, '03_stats.png')});

    const loading = await page.$('.demo-section:nth-of-type(3) .demo-box:nth-of-type(1) .lca-container');
    if (loading) await loading.screenshot({path: path.join(outDir, '04_loading.png')});

    const analysis = await page.$('.demo-section:nth-of-type(1) .demo-box:nth-of-type(1) .lca-container');
    if (analysis) await analysis.screenshot({path: path.join(outDir, '05_analysis.png')});

    const refSol = await page.$('.demo-section:nth-of-type(2) .demo-box:nth-of-type(1) .lca-container');
    if (refSol) await refSol.screenshot({path: path.join(outDir, '06_reference.png')});

    console.log('Screenshots captured successfully.');
    await browser.close();
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
})();
