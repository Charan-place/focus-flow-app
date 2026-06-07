import mongoose from 'mongoose';

// One document per user. We embed their FocusFlow data (settings/tasks/stats)
// right here — it's small, per-user, and always read/written as one snapshot,
// so embedding beats separate collections.

const TaskSchema = new mongoose.Schema(
  {
    id: String,
    text: String,
    completed: Boolean,
    createdAt: Number,
    completedAt: Number,
  },
  { _id: false }
);

const DailySchema = new mongoose.Schema(
  { date: String, pomodoros: Number, minutes: Number },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null }, // null for OAuth-only accounts
    provider: { type: String, enum: ['email', 'google'], default: 'email' },
    providerId: { type: String, default: null }, // google sub
    name: { type: String, default: null },

    // Embedded app data (the sync snapshot).
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    tasks: { type: [TaskSchema], default: [] },
    stats: {
      type: new mongoose.Schema(
        {
          totalPomodoros: { type: Number, default: 0 },
          totalFocusMinutes: { type: Number, default: 0 },
          tasksCompleted: { type: Number, default: 0 },
          currentStreak: { type: Number, default: 0 },
          longestStreak: { type: Number, default: 0 },
          lastActiveDate: { type: String, default: null },
          dailyHistory: { type: [DailySchema], default: [] },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    dataUpdatedAt: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.index({ provider: 1, providerId: 1 });

// What we send back to the client (never the hash).
UserSchema.methods.publicProfile = function () {
  return { id: this._id, email: this.email, name: this.name, provider: this.provider };
};

export default mongoose.model('User', UserSchema);
