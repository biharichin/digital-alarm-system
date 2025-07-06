# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Choose the "Free" tier (M0)

## Step 2: Create a Cluster

1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region close to you
5. Click "Create"

## Step 3: Set Up Database Access

1. In the left sidebar, click "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password (save these!)
5. Select "Read and write to any database"
6. Click "Add User"

## Step 4: Set Up Network Access

1. In the left sidebar, click "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Click "Confirm"

## Step 5: Get Your Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Replace `<dbname>` with `alarm-system`

## Step 6: Configure Your Application

1. Create a `.env` file in the backend directory:
```bash
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster.mongodb.net/alarm-system?retryWrites=true&w=majority
PORT=3001
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm run dev
```

## Step 7: Verify Connection

Visit `http://localhost:3001/api/health` and you should see:
```json
{
  "success": true,
  "message": "Alarm System Backend is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "storage": "MongoDB Atlas"
}
```

## Benefits of MongoDB Atlas

✅ **Cloud Storage**: Data accessible from anywhere
✅ **Automatic Backups**: Your data is safe
✅ **Scalability**: Can handle more users as you grow
✅ **Real-time Sync**: Changes sync across all devices
✅ **Free Tier**: 512MB storage, perfect for starting out

## Fallback System

If MongoDB Atlas is not configured, the system automatically falls back to local file storage, so your app will still work!

## Security Notes

- Never commit your `.env` file to version control
- Use strong passwords for your database user
- Consider using environment variables in production 