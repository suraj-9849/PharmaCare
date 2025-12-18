/**
 * Test script for reorder automation services
 * Run with: npx tsx src/test-reorder-services.ts
 */

import { supplierEmailService } from './services/supplier-email.service';
import { webSearchService } from './services/web-search.service';
import logger from './config/logger';

async function testServices() {
  logger.info('🧪 Testing Reorder Automation Services...\n');

  // Test 1: Email Service Test
  logger.info('📧 Test 1: Email Service');
  try {
    const testEmail = await supplierEmailService.sendTestEmail('test@example.com');
    if (testEmail) {
      logger.info('✅ Email service is working (test email sent)');
    } else {
      logger.warn('⚠️  Email service running in simulation mode (SMTP not configured)');
    }
  } catch (error) {
    logger.error('❌ Email service test failed:', error);
  }

  console.log('\n');

  // Test 2: Web Search Service Test
  logger.info('🔍 Test 2: Web Search Service');
  try {
    const searchResults = await webSearchService.searchMedicineSuppliers(
      'Paracetamol',
      'Acetaminophen'
    );
    
    logger.info(`✅ Found ${searchResults.suppliers.length} suppliers:`);
    searchResults.suppliers.forEach((supplier, index) => {
      logger.info(`   ${index + 1}. ${supplier.name} (${supplier.source})`);
      logger.info(`      URL: ${supplier.url}`);
    });
  } catch (error) {
    logger.error('❌ Web search service test failed:', error);
  }

  console.log('\n');

  // Test 3: Contact Extraction Test
  logger.info('🔎 Test 3: Contact Extraction');
  try {
    const contact = await webSearchService.extractSupplierContact(
      'https://www.indiamart.com'
    );
    
    if (contact.email || contact.phone || contact.company) {
      logger.info('✅ Contact extraction working:');
      if (contact.company) logger.info(`   Company: ${contact.company}`);
      if (contact.email) logger.info(`   Email: ${contact.email}`);
      if (contact.phone) logger.info(`   Phone: ${contact.phone}`);
    } else {
      logger.info('⚠️  No contact information extracted (website may have anti-scraping)');
    }
  } catch (error) {
    logger.error('❌ Contact extraction test failed:', error);
  }

  console.log('\n');
  logger.info('✨ Service tests completed!\n');
  
  // Summary
  logger.info('📋 Configuration Status:');
  logger.info(`   SMTP Configured: ${process.env.SMTP_USER ? '✅ Yes' : '❌ No'}`);
  logger.info(`   Google Search API: ${process.env.GOOGLE_SEARCH_API_KEY ? '✅ Yes' : '❌ No'}`);
  
  console.log('\n');
  logger.info('💡 Next Steps:');
  if (!process.env.SMTP_USER) {
    logger.info('   1. Configure SMTP credentials in .env for email functionality');
  }
  if (!process.env.GOOGLE_SEARCH_API_KEY) {
    logger.info('   2. (Optional) Add Google Search API key for better supplier search');
  }
  logger.info('   3. Test the API endpoints using Postman or curl');
  logger.info('   4. Build the frontend UI components for supplier selection');
}

// Run tests
testServices()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Test script failed:', error);
    process.exit(1);
  });
