// Quick test script to verify notification delivery
const fetch = require('node-fetch');

async function testNotificationDelivery() {
  try {
    // Test assessment status update that should trigger notifications
    const response = await fetch('http://localhost:5000/api/assessments/65337074-8e00-49e6-9944-1af6170da8f5', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=test-session'
      },
      body: JSON.stringify({
        status: 'submitted'
      })
    });

    const result = await response.text();
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testNotificationDelivery();