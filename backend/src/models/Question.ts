import { Schema, model, Document } from 'mongoose';

interface ITestCase {
  input: string;
  expectedOutput: string;
}

export interface IQuestion extends Document {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  testCases: ITestCase[];
}

const QuestionSchema = new Schema<IQuestion>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
    testCases: [
      {
        input: { type: String, required: true },
        expectedOutput: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default model<IQuestion>('Question', QuestionSchema);
