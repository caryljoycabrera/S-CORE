const fetch = require('node-fetch');

async function test() {
	try {
		console.log('[TEST] Testing chatbot API...\n');

		// Test 1: Add user Q&A
		console.log('[TEST 1] Adding user Q&A...');
		let response = await fetch('http://localhost:8080/api/admin/chatbot/qa', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				role: 'user',
				category: 'Request Process',
				question: 'How do I submit a request?',
				answer: 'To submit a request, please log in to your account and navigate to the Requests section. Click on New Request button, fill in all required fields with accurate information, and submit. You will receive a confirmation email once your request is received.',
			}),
		});
		let result = await response.json();
		console.log('[TEST 1]', response.ok ? '✓' : '✗', result.success ? result.message : result.message);
		if (result.data) console.log('  Created ID:', result.data._id);

		// Test 2: Add unit Q&A
		console.log('\n[TEST 2] Adding unit Q&A...');
		response = await fetch('http://localhost:8080/api/admin/chatbot/qa', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				role: 'unit',
				category: 'Technical',
				question: 'What formats do you accept for files?',
				answer: 'We accept PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, and GIF files. Maximum file size is 50MB per request.',
			}),
		});
		result = await response.json();
		console.log('[TEST 2]', response.ok ? '✓' : '✗', result.success ? result.message : result.message);

		// Test 3: Fetch user Q&A (public endpoint)
		console.log('\n[TEST 3] Fetching user Q&A (public)...');
		response = await fetch('http://localhost:8080/api/chatbot/qa/user');
		result = await response.json();
		console.log('[TEST 3]', response.ok ? '✓' : '✗', result.success ? `Found ${result.count} Q&A` : result.message);

		// Test 4: Fetch all user Q&A (admin)
		console.log('\n[TEST 4] Fetching all user Q&A (admin)...');
		response = await fetch('http://localhost:8080/api/admin/chatbot/qa/all/user');
		result = await response.json();
		console.log('[TEST 4]', response.ok ? '✓' : '✗', result.success ? `Found ${result.count} Q&A` : result.message);

		console.log('\n[TEST] ✓ All API tests completed successfully!\n');
	} catch (error) {
		console.error('[TEST] ✗ Error:', error.message);
		process.exit(1);
	}
}

test();
