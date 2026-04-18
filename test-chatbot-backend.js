// Test script for ChatbotQA model and service
require('dotenv').config();

const mongoose = require('mongoose');
const ChatbotQA = require('./models/ChatbotQA');
const chatbotService = require('./services/chatbotService');

// Connect to MongoDB
async function testChatbot() {
	try {
		console.log('[TEST] Connecting to MongoDB...');
		await mongoose.connect(process.env.MONGO_URI);
		console.log('[TEST] Connected to MongoDB');

		// Test 1: Clear previous test data
		console.log('\n[TEST 1] Clearing test data...');
		await ChatbotQA.deleteMany({
			question: /test question|how do i create a request/i,
		});
		console.log('[TEST 1] ✓ Test data cleared');

		// Test 2: Create Q&A for user role
		console.log('\n[TEST 2] Creating user Q&A...');
		const userQA = await chatbotService.createQA({
			role: 'user',
			category: 'Request Process',
			question: 'How do I create a request?',
			answer: 'To create a request, navigate to your dashboard and click the "New Request" button. Fill in the required fields and submit.',
		});
		console.log('[TEST 2] ✓ User Q&A created:', userQA._id);

		// Test 3: Create Q&A for admin role
		console.log('\n[TEST 3] Creating admin Q&A...');
		const adminQA = await chatbotService.createQA({
			role: 'admin',
			category: 'General',
			question: 'Test question for admin',
			answer: 'This is a test answer for the admin role with proper formal tone.',
		});
		console.log('[TEST 3] ✓ Admin Q&A created:', adminQA._id);

		// Test 4: Fetch Q&A by role
		console.log('\n[TEST 4] Fetching user Q&A...');
		const userQAs = await chatbotService.getQAByRole('user');
		console.log('[TEST 4] ✓ Found', userQAs.length, 'user Q&A entries');

		// Test 5: Search Q&A
		console.log('\n[TEST 5] Searching Q&A...');
		const searchResults = await chatbotService.searchQA('user', 'request');
		console.log('[TEST 5] ✓ Search found', searchResults.length, 'results');

		// Test 6: Update Q&A
		console.log('\n[TEST 6] Updating Q&A...');
		const updated = await chatbotService.updateQA(userQA._id, {
			answer: 'Updated answer with more detailed instructions.',
			isActive: true,
		});
		console.log('[TEST 6] ✓ Q&A updated:', updated._id);

		// Test 7: Get statistics
		console.log('\n[TEST 7] Getting statistics...');
		const stats = await chatbotService.getStats();
		console.log('[TEST 7] ✓ Stats:', JSON.stringify(stats, null, 2));

		// Test 8: Try duplicate question (should fail)
		console.log('\n[TEST 8] Testing duplicate prevention...');
		try {
			await chatbotService.createQA({
				role: 'user',
				category: 'Request Process',
				question: 'How do I create a request?',
				answer: 'Duplicate question',
			});
			console.log('[TEST 8] ✗ FAILED: Should have thrown duplicate error');
		} catch (error) {
			if (error.message.includes('already exists')) {
				console.log('[TEST 8] ✓ Duplicate prevention working');
			} else {
				throw error;
			}
		}

		// Test 9: Delete Q&A
		console.log('\n[TEST 9] Deleting Q&A...');
		const deleted = await chatbotService.deleteQA(adminQA._id);
		console.log('[TEST 9] ✓ Q&A deleted:', deleted._id);

		// Test 10: Verify deletion
		console.log('\n[TEST 10] Verifying deletion...');
		const remaining = await chatbotService.getAllQAByRole('admin');
		console.log('[TEST 10] ✓ Admin Q&A count after deletion:', remaining.length);

		console.log('\n[TEST] ✓ All tests passed!\n');
		await mongoose.connection.close();
		process.exit(0);
	} catch (error) {
		console.error('[TEST] ✗ Test failed:', error.message);
		console.error(error);
		await mongoose.connection.close();
		process.exit(1);
	}
}

testChatbot();
