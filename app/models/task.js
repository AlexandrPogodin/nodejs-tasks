const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  local: {
    objective: String,
    description: { type: String, default: '' },
    doer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: { type: Date, default: Date.now },
  },
});

// create the model for tasks and expose it to our app
module.exports = mongoose.model('Task', taskSchema);
