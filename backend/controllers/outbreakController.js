const mongoose = require('mongoose');
const DiseaseOutbreak = require('../models/DiseaseOutbreak');

function getSafeQuery(id) {
  if (!id) return { _id: new mongoose.Types.ObjectId() };
  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)) {
    return { _id: id };
  }
  return { village: id };
}

exports.getOutbreaks = async (req, res) => {
  try {
    const list = await DiseaseOutbreak.find().sort({ detectedDate: -1 });
    return res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createOutbreak = async (req, res) => {
  try {
    const { disease, village, block, casesThisWeek, trend, status, recommendedAction } = req.body;

    const newOb = new DiseaseOutbreak({
      disease,
      village: village || 'Shivpuri',
      block: block || 'District Health Zone',
      casesThisWeek: Number(casesThisWeek) || 1,
      trend: trend || 'Elevated Cases',
      status: status || 'ACTIVE_WATCH',
      recommendedAction: recommendedAction || 'Fever survey and medical supply mobilization initiated.'
    });

    await newOb.save();

    return res.status(201).json({
      success: true,
      message: 'Disease Outbreak cluster registered in surveillance database',
      data: newOb
    });
  } catch (error) {
    console.error('Create outbreak error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOutbreakStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, casesThisWeek, trend, recommendedAction } = req.body;

    const ob = await DiseaseOutbreak.findOne(getSafeQuery(id));
    if (!ob) {
      return res.status(404).json({ success: false, message: 'Outbreak record not found' });
    }

    if (status) ob.status = status;
    if (casesThisWeek !== undefined) ob.casesThisWeek = Number(casesThisWeek);
    if (trend) ob.trend = trend;
    if (recommendedAction) ob.recommendedAction = recommendedAction;

    await ob.save();

    return res.json({ success: true, message: 'Outbreak status updated', data: ob });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteOutbreak = async (req, res) => {
  try {
    const { id } = req.params;
    await DiseaseOutbreak.findOneAndDelete(getSafeQuery(id));
    return res.json({ success: true, message: 'Outbreak record removed from surveillance' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
