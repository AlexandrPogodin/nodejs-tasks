const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  objective: String,
  description: { type: String, default: '' },
  done: { type: Boolean, default: false },
  doer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: { type: Date, default: Date.now },
});

// create the model for tasks and expose it to our app
module.exports = mongoose.model('Task', taskSchema);
