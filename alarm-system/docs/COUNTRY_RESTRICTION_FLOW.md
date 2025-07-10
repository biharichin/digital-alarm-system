# 🌍 Country Restriction Flow Documentation

## Overview
The Digital Alarm System now implements a comprehensive country-based access control system that ensures only users from India can sign up for the service.

## 🔄 User Flow

### 1. **Welcome Page** (`welcome.html`)
- **Entry Point**: Users start here
- **Options**:
  - "New User - Start Here" → Goes to Country Check
  - "I Already Have an Account" → Goes to Login
  - "Test Country Restriction" → Goes to Test Page

### 2. **Country Check Page** (`country-check.html`)
- **Purpose**: Asks users about their country before allowing signup
- **Process**:
  - User selects their country from a list
  - If India is selected → "Continue to Sign Up" button appears
  - If other country is selected → Error message appears
  - User must select India to proceed

### 3. **Signup Page** (`index.html`)
- **Access Control**: Only accessible if user confirmed they're from India
- **Auto-fill**: Country field is automatically set to "India"
- **Validation**: Backend also validates country before creating account

## 🛡️ Security Layers

### Frontend Protection
1. **Country Check Page**: Prevents non-Indian users from accessing signup
2. **Session Storage**: Stores user's country confirmation
3. **Form Validation**: Validates country selection before submission
4. **Auto-redirect**: Redirects users without country confirmation

### Backend Protection
1. **API Validation**: Server validates country in signup request
2. **Database Schema**: User model only accepts "India" as country
3. **Error Messages**: Clear feedback for unauthorized attempts

## 📁 File Structure

```
alarm-system/
├── welcome.html              # Main entry point
├── country-check.html        # Country verification page
├── index.html               # Signup/login page (protected)
├── auth.js                  # Authentication logic with country checks
├── auth-styles.css          # Styling for all pages
└── COUNTRY_RESTRICTION_FLOW.md  # This documentation
```

## 🧪 Testing

### Test Files
- `test-country-restriction.html` - Comprehensive testing interface
- `test-country-restriction.html` - Automated API testing

### Test Scenarios
1. **Frontend Validation**: Test form validation without backend
2. **Backend API**: Test server-side country validation
3. **Country Check Flow**: Test the complete user journey
4. **Direct Access**: Test bypassing country check

## 🚀 How to Use

### For New Users
1. Open `welcome.html`
2. Click "New User - Start Here"
3. Select "India" on country check page
4. Click "Continue to Sign Up"
5. Fill out signup form (country auto-filled)
6. Submit and create account

### For Existing Users
1. Open `welcome.html`
2. Click "I Already Have an Account"
3. Login with existing credentials

### For Testing
1. Open `test-country-restriction.html`
2. Run various test scenarios
3. Verify both frontend and backend restrictions

## 🔧 Configuration

### Adding New Countries
To allow additional countries:

1. **Frontend** (`country-check.html`):
   - Add country option to the list
   - Update validation logic

2. **Backend** (`server.js`):
   - Update validation middleware
   - Modify country check condition

3. **Database** (`models/User.js`):
   - Update enum values in country field

### Current Settings
- **Allowed Countries**: India only
- **Error Message**: "Sorry, this application is currently only available for users from India"
- **Session Storage Key**: `userCountry`

## 🎯 Key Features

- ✅ **Interactive Country Selection**: Visual country picker with flags
- ✅ **Progressive Disclosure**: Only show signup after country confirmation
- ✅ **Session Persistence**: Remember user's country choice
- ✅ **Auto-fill**: Automatically set country in signup form
- ✅ **Clear Messaging**: Informative error messages
- ✅ **Testing Tools**: Comprehensive testing interface
- ✅ **Security**: Multiple layers of protection

## 🔒 Security Notes

- Country confirmation is stored in session storage (cleared when browser closes)
- Backend validation is the ultimate authority
- No way to bypass country restriction without modifying code
- Clear audit trail of country selection

## 📞 Support

For questions or issues with the country restriction system, refer to the test files or check the browser console for detailed error messages. 