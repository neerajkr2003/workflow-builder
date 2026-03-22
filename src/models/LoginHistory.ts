import mongoose, { Schema } from 'mongoose';
import { ILoginHistory } from '../types';

const LoginHistorySchema = new Schema<ILoginHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      default: 'Unknown',
    },
    deviceInfo: {
      type: String,
      required: true,
      default: 'Unknown Device',
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
    },
    reason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete login history older than 90 days
LoginHistorySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

LoginHistorySchema.index({ userId: 1, createdAt: -1 });

const LoginHistory = mongoose.model<ILoginHistory>('LoginHistory', LoginHistorySchema);
export default LoginHistory;
