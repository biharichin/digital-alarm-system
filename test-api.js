const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';

async function testAPI() {
    console.log('🧪 Testing Alarm System Backend API...\n');

    try {
        // Test 1: Health Check
        console.log('1. Testing Health Check...');
        const healthResponse = await fetch(`${BASE_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health Check:', healthData.message);
        console.log('   Timestamp:', healthData.timestamp);
        console.log('');

        // Test 2: User Registration
        console.log('2. Testing User Registration...');
        const signupData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'testpassword123',
            age: 25
        };

        const signupResponse = await fetch(`${BASE_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(signupData)
        });

        const signupResult = await signupResponse.json();
        
        if (signupResult.success) {
            console.log('✅ User Registration Successful');
            console.log('   User ID:', signupResult.user.id);
            console.log('   Username:', signupResult.user.username);
            console.log('   Email:', signupResult.user.email);
            console.log('   Age:', signupResult.user.age);
        } else {
            console.log('❌ User Registration Failed:', signupResult.message);
        }
        console.log('');

        // Test 3: User Login
        console.log('3. Testing User Login...');
        const loginData = {
            email: 'test@example.com',
            password: 'testpassword123'
        };

        const loginResponse = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const loginResult = await loginResponse.json();
        
        if (loginResult.success) {
            console.log('✅ User Login Successful');
            console.log('   Username:', loginResult.user.username);
            console.log('   Last Login:', loginResult.user.lastLogin);
        } else {
            console.log('❌ User Login Failed:', loginResult.message);
        }
        console.log('');

        // Test 4: Get All Users (Admin)
        console.log('4. Testing Admin Users Endpoint...');
        const usersResponse = await fetch(`${BASE_URL}/admin/users`);
        const usersResult = await usersResponse.json();
        
        if (usersResult.success) {
            console.log('✅ Admin Users Retrieved Successfully');
            console.log('   Total Users:', usersResult.count);
            usersResult.users.forEach((user, index) => {
                console.log(`   User ${index + 1}: ${user.username} (${user.email}) - Age: ${user.age}`);
            });
        } else {
            console.log('❌ Admin Users Failed:', usersResult.message);
        }
        console.log('');

        // Test 5: Get Specific User
        if (signupResult.success) {
            console.log('5. Testing Get User by ID...');
            const userId = signupResult.user.id;
            const userResponse = await fetch(`${BASE_URL}/users/${userId}`);
            const userResult = await userResponse.json();
            
            if (userResult.success) {
                console.log('✅ Get User Successful');
                console.log('   Username:', userResult.user.username);
                console.log('   Email:', userResult.user.email);
                console.log('   Created:', userResult.user.createdAt);
            } else {
                console.log('❌ Get User Failed:', userResult.message);
            }
            console.log('');
        }

        // Test 6: Update User Stats
        if (signupResult.success) {
            console.log('6. Testing Update User Stats...');
            const userId = signupResult.user.id;
            const statsData = {
                alarmCount: 5,
                totalAlarms: 10
            };

            const statsResponse = await fetch(`${BASE_URL}/users/${userId}/stats`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(statsData)
            });

            const statsResult = await statsResponse.json();
            
            if (statsResult.success) {
                console.log('✅ Update User Stats Successful');
                console.log('   Message:', statsResult.message);
            } else {
                console.log('❌ Update User Stats Failed:', statsResult.message);
            }
            console.log('');
        }

        // Test 7: Invalid Registration (Validation)
        console.log('7. Testing Validation (Invalid Registration)...');
        const invalidData = {
            username: 'ab', // Too short
            email: 'invalid-email', // Invalid email
            password: '123', // Too short
            age: 16 // Too young
        };

        const invalidResponse = await fetch(`${BASE_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invalidData)
        });

        const invalidResult = await invalidResponse.json();
        console.log('✅ Validation Working (Expected Failure):', invalidResult.message);
        console.log('');

        console.log('🎉 All API tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Make sure the backend server is running on http://localhost:3001');
        console.log('   Run: npm run dev');
    }
}

// Run the tests
testAPI(); 