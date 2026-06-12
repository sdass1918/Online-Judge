import { Router, Response } from 'express';
import { createClient } from 'redis';
import Submission from '../models/Submission';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const redisClient = createClient();
redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect().then(() => console.log('Redis connected successfully 🔴'));

router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { questionId, code, language } = req.body;
    const userId = req.user?.userId;

    if (!questionId || !code || !language) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newSubmission = new Submission({
      userId,
      questionId,
      code,
      language,
      status: 'Pending'
    });
    await newSubmission.save();

    const queuePayload = JSON.stringify({
      submissionId: newSubmission._id,
      code,
      language,
      questionId
    });
    
    await redisClient.lPush('submission_queue', queuePayload);

    res.status(201).json({ 
      message: 'Submission queued successfully', 
      submissionId: newSubmission._id 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during submission' });
  }
});

export default router;
