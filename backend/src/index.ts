import express, { Request, Response } from 'express';
import cors from 'cors';
import connectDB from './config/db';
import Question from './models/Question';
import authRoutes from './routes/auth';

const app = express();
app.use(cors({
    origin: '*'
}));
app.use(express.json());

connectDB();


app.use('/api/auth', authRoutes);
app.get('/api/questions', async (req: Request, res: Response): Promise<void> => {
  try {
    const questions = await Question.find().select('-testCases');
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching questions' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Primary Backend running on port ${PORT} 🔥`);
});
