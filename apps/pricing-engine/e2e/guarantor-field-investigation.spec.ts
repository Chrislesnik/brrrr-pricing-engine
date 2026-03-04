import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test('Investigate Guarantor 1 ID field', async ({ page }) => {
  const screenshotDir = path.join(process.cwd(), 'screenshots');
  
  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('1. Navigating to http://localhost:3000/deals...');
  await page.goto('http://localhost:3000/deals', { waitUntil: 'networkidle' });
  
  // Wait a bit for any redirects or loading
  await page.waitForTimeout(2000);
  
  console.log('2. Taking screenshot of initial page...');
  await page.screenshot({ 
    path: path.join(screenshotDir, '1-initial-page.png'), 
    fullPage: true 
  });
  
  console.log('Current URL:', page.url());
  
  // If redirected to sign-in, we need to authenticate
  if (page.url().includes('/sign-in')) {
    console.log('Detected sign-in page. Need authentication to proceed.');
    await page.screenshot({ 
      path: path.join(screenshotDir, '2-sign-in-required.png'), 
      fullPage: true 
    });
    test.skip('Authentication required - please sign in manually and run again');
    return;
  }
  
  console.log('3. Looking for Add Deal or New Deal button...');
  
  // Try multiple selectors for the button
  const buttonSelectors = [
    'button:has-text("Add Deal")',
    'button:has-text("New Deal")',
    'button:has-text("Create Deal")',
  ];
  
  let button = null;
  for (const selector of buttonSelectors) {
    try {
      button = await page.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 })) {
        console.log(`Found button with selector: ${selector}`);
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!button || !(await button.isVisible().catch(() => false))) {
    console.log('Could not find Add Deal button');
    await page.screenshot({ 
      path: path.join(screenshotDir, '3-no-button-found.png'), 
      fullPage: true 
    });
    throw new Error('Add Deal button not found');
  }
  
  console.log('4. Clicking the button...');
  await button.click();
  
  console.log('5. Waiting 3 seconds for form to open...');
  await page.waitForTimeout(3000);
  
  console.log('6. Taking screenshot of opened form...');
  await page.screenshot({ 
    path: path.join(screenshotDir, '4-form-opened.png'), 
    fullPage: true 
  });
  
  console.log('7. Looking for Guarantor 1 ID field...');
  
  // Try to find the label
  const guarantorLabel = page.locator('label:has-text("Guarantor 1 ID")').first();
  
  const isLabelVisible = await guarantorLabel.isVisible().catch(() => false);
  
  if (!isLabelVisible) {
    console.log('Guarantor 1 ID label not immediately visible, scrolling down...');
    
    // Try to find and expand any accordion sections
    const accordionTriggers = page.locator('[data-radix-collection-item]');
    const triggerCount = await accordionTriggers.count();
    console.log(`Found ${triggerCount} accordion sections`);
    
    // Click all accordion triggers to expand them
    for (let i = 0; i < triggerCount; i++) {
      try {
        const trigger = accordionTriggers.nth(i);
        const isExpanded = await trigger.getAttribute('data-state');
        if (isExpanded !== 'open') {
          await trigger.click();
          await page.waitForTimeout(500);
        }
      } catch (e) {
        console.log(`Could not expand accordion ${i}`);
      }
    }
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '5-accordions-expanded.png'), 
      fullPage: true 
    });
  }
  
  // Try again to find the label
  const guarantorLabelVisible = await guarantorLabel.isVisible().catch(() => false);
  
  if (guarantorLabelVisible) {
    console.log('8. Found Guarantor 1 ID field, scrolling into view...');
    await guarantorLabel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    console.log('9. Taking screenshot of Guarantor field...');
    await page.screenshot({ 
      path: path.join(screenshotDir, '6-guarantor-field.png'), 
      fullPage: false 
    });
    
    // Find the associated input field
    const labelFor = await guarantorLabel.getAttribute('for');
    console.log(`Label 'for' attribute: ${labelFor}`);
    
    let inputElement = null;
    if (labelFor) {
      inputElement = page.locator(`#${labelFor}`);
    } else {
      // Try to find input near the label
      inputElement = guarantorLabel.locator('..').locator('input, select, [role="combobox"]').first();
    }
    
    const inputVisible = await inputElement.isVisible().catch(() => false);
    
    if (inputVisible) {
      // Get element details
      const tagName = await inputElement.evaluate(el => el.tagName);
      const inputType = await inputElement.getAttribute('type');
      const role = await inputElement.getAttribute('role');
      const className = await inputElement.getAttribute('class');
      const placeholder = await inputElement.getAttribute('placeholder');
      
      console.log('Field details:');
      console.log(`  Tag: ${tagName}`);
      console.log(`  Type: ${inputType}`);
      console.log(`  Role: ${role}`);
      console.log(`  Placeholder: ${placeholder}`);
      console.log(`  Classes: ${className}`);
      
      console.log('10. Clicking on the field...');
      await inputElement.click();
      await page.waitForTimeout(1500);
      
      console.log('11. Taking screenshot after clicking field...');
      await page.screenshot({ 
        path: path.join(screenshotDir, '7-field-clicked.png'), 
        fullPage: false 
      });
      
      // Check if a dropdown appeared
      const dropdown = page.locator('[role="listbox"], .dropdown, [class*="dropdown"], [class*="menu"]').first();
      const dropdownVisible = await dropdown.isVisible({ timeout: 1000 }).catch(() => false);
      
      if (dropdownVisible) {
        console.log('12. Dropdown menu detected!');
        await page.waitForTimeout(1000);
        await page.screenshot({ 
          path: path.join(screenshotDir, '8-dropdown-visible.png'), 
          fullPage: false 
        });
        
        // Get dropdown options
        const options = await dropdown.locator('button, [role="option"], li').allTextContents();
        console.log(`Found ${options.length} options:`);
        options.forEach((opt, idx) => console.log(`  ${idx + 1}. ${opt}`));
      } else {
        console.log('12. No dropdown menu appeared');
      }
    } else {
      console.log('Could not find input element');
    }
  } else {
    console.log('Guarantor 1 ID field not found even after expanding accordions');
    
    // Get all visible labels to see what fields are available
    const allLabels = await page.locator('label').allTextContents();
    console.log('Available fields:');
    allLabels.forEach(label => console.log(`  - ${label}`));
  }
  
  console.log('\n=== Console Logs ===');
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  // Check console for errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  await page.waitForTimeout(1000);
  
  if (errors.length > 0) {
    console.log('\n=== Console Errors ===');
    errors.forEach(err => console.log('ERROR:', err));
  }
  
  console.log('\nScreenshots saved to:', screenshotDir);
});
