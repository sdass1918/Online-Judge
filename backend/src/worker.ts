import { createClient } from 'redis';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';
import connectDB from './config/db';
import Submission from './models/Submission';
import Question from './models/Question';

const execPromise = util.promisify(exec);

const runWorker = async () => {
  await connectDB();
  const redisClient = createClient();
  const redisPublisher = createClient();
  await redisClient.connect();
  await redisPublisher.connect();
  
  console.log('👷 Compiler Worker started and listening to queue...');

  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  while (true) {
    try {
      const result = await redisClient.brPop('submission_queue', 0);
      if (!result) continue;

      const job = JSON.parse(result.element);
      console.log(`Processing submission: ${job.submissionId}`);

      const submission = await Submission.findById(job.submissionId);
      const question = await Question.findById(job.questionId);
      
      if (!submission || !question) continue;

      submission.status = 'Processing';
      await submission.save();

      const filename = `${job.submissionId}.js`;
      const filePath = path.join(tempDir, filename);
      fs.writeFileSync(filePath, job.code);

      let output = '';
      let status: 'Accepted' | 'Wrong Answer' | 'Compilation Error' = 'Accepted';

      try {
        const testInput = question.testCases[0]?.input || '';
        const expectedOutput = question.testCases[0]?.expectedOutput || '';

        const dockerCmd = `echo "${testInput}" | docker run --rm -i -v ${tempDir}:/app -w /app node:18-alpine node ${filename}`;
        
        const { stdout } = await execPromise(dockerCmd, { timeout: 5000 });
        output = stdout.trim();

        if (output !== expectedOutput.trim()) {
          status = 'Wrong Answer';
        }
      } catch (error: any) {
        status = 'Compilation Error';
        output = error.stderr || error.message || 'Execution failed or timed out';
      }

      fs.unlinkSync(filePath);

      submission.status = status;
      submission.output = output;
      await submission.save();

      const payload = {
        userId: submission.userId.toString(),
        submissionId: submission._id,
        status,
        output
      };
      await redisPublisher.publish('execution_results', JSON.stringify(payload));
      
      console.log(`Finished ${job.submissionId} -> ${status}`);

    } catch (err) {
      console.error('Worker error processing job:', err);
    }
  }
};

runWorker();
