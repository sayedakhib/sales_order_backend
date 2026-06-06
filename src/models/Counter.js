import mongoose from 'mongoose';

// little counter collection we use to generate order numbers like SO-20260001
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "order-2026"
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

// bump the counter and hand back the new value. $inc is atomic so two orders
// created at the same time can't grab the same number.
export async function nextSequence(key) {
  const doc = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

export default Counter;
