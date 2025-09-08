const pages = [
  '/dashboard',
  '/projects', 
  '/team',
  '/clients',
  '/invoices',
  '/payments',
  '/expenses',
  '/time-tracking',
  '/reports',
  '/reports/time-entry',
  '/reports/outstanding-overdue-invoice',
  '/reports/revenue-by-client', 
  '/reports/accounts-aging',
  '/settings/organization',
  '/settings/payment',
  '/settings/billing',
  '/settings/import-export',
  '/settings/profile',
  '/settings/preferences',
  '/settings/leaves',
  '/settings/bank-info',
  '/settings/devices',
  '/leave-management'
];

async function testPages() {
  console.log('Testing all pages...\n');
  
  for (const page of pages) {
    const url = `http://127.0.0.1:3000${page}`;
    try {
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Accept': 'text/html'
        }
      });
      
      if (response.ok) {
        console.log(`✅ ${page} - Status: ${response.status}`);
      } else {
        console.log(`❌ ${page} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${page} - Error: ${error.message}`);
    }
  }
}

testPages();