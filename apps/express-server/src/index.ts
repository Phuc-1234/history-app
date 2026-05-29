import express from 'express';
// Import the prisma client instance directly from your shared package
import { prisma } from '@history-app/shared';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// 1. TEST ROUTE: Create a new user in Supabase
app.post('/users', async (req, res) => {
  const { email, name } = req.body;
  
  try {
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
      },
    });
    res.status(201).json({ message: 'User created successfully!', user: newUser });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

// 2. TEST ROUTE: Fetch all users from Supabase
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ users });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
});