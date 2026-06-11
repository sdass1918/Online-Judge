import { Schema, model, Document, Types } from 'mongoose';

export interface ISubmission extends Document {
  userId: Types.ObjectId;
  questionId: Types.ObjectId;
  code: string;
  language: string;
  status: 'Pending' | 'Processing' | 'Accepted' | 'Wrong Answer' | 'Compilation Error';
  output?: string;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    code: { type: String, required: true },
    language: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Accepted', 'Wrong Answer', 'Compilation Error'],
      default: 'Pending',
    },
    output: { type: String },
  },
  { timestamps: true }
);

export default model<ISubmission>('Submission', SubmissionSchema);
