#!/usr/bin/env node

/**
 * Script to capture screenshots of Hermes CRM in light mode
 * Usage: node scripts/capture-screenshots.js
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = join(projectRoot, 'screenshots');

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to the app
    console.log('📱 Opening Hermes CRM...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check if we need to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/register')) {
      console.log('🔐 App requires authentication');
      console.log('💡 Please ensure you have test credentials or the app is in dev mode');
      
      // Try to login with test credentials if available
      const emailInput = await page.locator('input[type="email"]').first();
      if (await emailInput.isVisible()) {
        console.log('📝 Attempting login with test credentials...');
        await emailInput.fill('test@example.com');
        await page.locator('input[type="password"]').first().fill('testpassword');
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(2000);
      }
    }

    // Set theme to light mode via localStorage
    console.log('☀️ Switching to light mode...');
    await page.evaluate(() => {
      localStorage.setItem('hermes-ui-theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Capture screenshots of different pages
    const pages = [
      { path: '/', name: 'dashboard-light', waitFor: '.space-y-6' },
      { path: '/leads', name: 'leads-list-light', waitFor: 'table, .grid' },
      { path: '/tasks', name: 'tasks-light', waitFor: '.space-y-4' },
      { path: '/templates', name: 'templates-light', waitFor: '.space-y-4' },
      { path: '/stats', name: 'analytics-light', waitFor: '.space-y-6' },
      { path: '/settings', name: 'settings-light', waitFor: '.space-y-6' },
    ];

    for (const pageConfig of pages) {
      try {
        console.log(`📸 Capturing ${pageConfig.name}...`);
        await page.goto(`${BASE_URL}${pageConfig.path}`, { waitUntil: 'networkidle' });
        
        // Wait for content to load
        if (pageConfig.waitFor) {
          await page.waitForSelector(pageConfig.waitFor, { timeout: 5000 });
        }
        await page.waitForTimeout(1000);

        // Take screenshot
        await page.screenshot({
          path: join(SCREENSHOTS_DIR, `${pageConfig.name}.png`),
          fullPage: true
        });
        console.log(`✅ Saved ${pageConfig.name}.png`);
      } catch (error) {
        console.error(`❌ Failed to capture ${pageConfig.name}:`, error.message);
      }
    }

    // Capture a lead detail page if leads exist
    try {
      console.log('📸 Capturing lead detail page...');
      await page.goto(`${BASE_URL}/leads`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      // Click on first lead if available
      const firstLead = await page.locator('a[href^="/leads/"]').first();
      if (await firstLead.isVisible()) {
        await firstLead.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: join(SCREENSHOTS_DIR, 'lead-detail-light.png'),
          fullPage: true
        });
        console.log('✅ Saved lead-detail-light.png');
      } else {
        console.log('⚠️ No leads found to capture detail page');
      }
    } catch (error) {
      console.error('❌ Failed to capture lead detail:', error.message);
    }

    // Capture dark mode comparison for one page
    console.log('🌙 Capturing dark mode comparison...');
    await page.evaluate(() => {
      localStorage.setItem('hermes-ui-theme', 'dark');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: join(SCREENSHOTS_DIR, 'dashboard-dark.png'),
      fullPage: true
    });
    console.log('✅ Saved dashboard-dark.png');

    console.log('✨ Screenshot capture complete!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);

  } catch (error) {
    console.error('❌ Error during screenshot capture:', error);
  } finally {
    await browser.close();
  }
}

captureScreenshots().catch(console.error);
