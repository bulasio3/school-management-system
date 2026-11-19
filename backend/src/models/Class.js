const mongoose = require('mongoose');
const { uuid, applyJson } = require('./plugin');

const classSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  name: { type: String, required: true, trim: true },   // e.g. 'S.2'
  stream: { type: String, trim: true, default: null },  // e.g. 'East'
  year: { type: Number, required: true },
});
classSchema.index({ name: 1, stream: 1, year: 1 }, { unique: true });
applyJson(classSchema);

module.exports = mongoose.model('Class', classSchema);
