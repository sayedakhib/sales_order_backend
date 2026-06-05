import mongoose from 'mongoose';

// Atomic sequence generator used for auto order numbers (SO-20260001).
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "order-2026"
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

/**
 * Atomically increment and return the next sequence value for a key.
 */
export async function nextSequence(key) {
  const doc = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

export default Counter;
