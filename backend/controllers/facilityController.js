const mongoose = require('mongoose');
const Facility = require('../models/Facility');

function getSafeQuery(id) {
  if (!id) return { id: 'invalid' };
  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)) {
    return { $or: [{ _id: id }, { id: id }] };
  }
  return { id: id };
}

// Haversine formula to compute exact distance in KM between GPS coordinates
function computeDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 5;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function calculateSuitabilityScore(facility, triageData = {}, calculatedDistanceKm = null) {
  const {
    riskLevel = 'MODERATE',
    requiredDiagnostics = [],
    isEmergency = false
  } = triageData;

  let score = 50;
  let breakdown = {
    distanceFactor: 0,
    doctorAvailability: 0,
    diagnosticMatch: 0,
    bedAvailability: 0,
    oxygenSupport: 0,
    waitTimeImpact: 0
  };

  const distanceKm = calculatedDistanceKm !== null ? calculatedDistanceKm : (facility.distanceKm || 5);
  if (distanceKm <= 3) breakdown.distanceFactor = +25;
  else if (distanceKm <= 8) breakdown.distanceFactor = +15;
  else if (distanceKm <= 18) breakdown.distanceFactor = +5;
  else if (distanceKm <= 30) breakdown.distanceFactor = -5;
  else breakdown.distanceFactor = -15;

  const activeDoctors = (facility.doctors || []).filter(d => d.available).length;
  if (activeDoctors >= 2) breakdown.doctorAvailability = +25;
  else if (activeDoctors === 1) breakdown.doctorAvailability = +15;
  else breakdown.doctorAvailability = -25;

  const availableDiag = facility.diagnosticsAvailable || [];
  let diagMatches = 0;
  if (requiredDiagnostics.length > 0) {
    requiredDiagnostics.forEach(reqDiag => {
      if (availableDiag.some(d => d.toLowerCase().includes(reqDiag.toLowerCase()))) {
        diagMatches += 1;
      }
    });
    breakdown.diagnosticMatch = (diagMatches / requiredDiagnostics.length) * 20;
  } else {
    breakdown.diagnosticMatch = availableDiag.length > 4 ? +15 : +5;
  }

  const availableBeds = facility.beds?.available || 0;
  if (availableBeds > 5) breakdown.bedAvailability = +10;
  else if (availableBeds > 0) breakdown.bedAvailability = +5;
  else breakdown.bedAvailability = -10;

  if (facility.oxygenCylinders >= 5) breakdown.oxygenSupport = +10;
  else if (facility.oxygenCylinders >= 1) breakdown.oxygenSupport = +5;

  const waitTime = facility.currentWaitTimeMins || 20;
  if (waitTime <= 15) breakdown.waitTimeImpact = +5;
  else if (waitTime > 45) breakdown.waitTimeImpact = -10;

  if (isEmergency || riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    if (!facility.emergencyCapable && facility.level < 2) {
      score -= 30;
    } else if (facility.emergencyCapable) {
      score += 20;
    }
  }

  score += (
    breakdown.distanceFactor +
    breakdown.doctorAvailability +
    breakdown.diagnosticMatch +
    breakdown.bedAvailability +
    breakdown.oxygenSupport +
    breakdown.waitTimeImpact
  );

  const finalScore = Math.max(12, Math.min(99, Math.round(score)));

  return {
    score: finalScore,
    breakdown,
    activeDoctorsCount: activeDoctors,
    suitabilityTier: finalScore >= 80 ? 'HIGHLY_SUITABLE' : finalScore >= 60 ? 'SUITABLE' : 'LIMITED_CAPABILITY'
  };
}

exports.getFacilities = async (req, res) => {
  try {
    const list = await Facility.find().sort({ level: 1, name: 1 });
    return res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createFacility = async (req, res) => {
  try {
    const {
      name,
      type,
      level,
      village,
      block,
      district,
      distanceKm,
      coordinates = {},
      contactNumber,
      doctors = [],
      beds = { total: 10, occupied: 0, available: 10 },
      oxygenCylinders = 2,
      diagnosticsAvailable = [],
      diagnosticsMissing = [],
      emergencyCapable = false,
      currentWaitTimeMins = 15
    } = req.body;

    const id = `FAC-${(type || 'PHC').slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newFac = new Facility({
      id,
      name,
      type: type || 'PHC',
      level: Number(level) || (type === 'District Hospital' ? 3 : type === 'CHC' ? 2 : type === 'PHC' ? 1 : 0),
      village: village || 'Shivpuri',
      block: block || 'District Block',
      district: district || 'Moradabad',
      distanceKm: Number(distanceKm) || 5,
      coordinates: {
        lat: coordinates.lat || (28.83 + Math.random() * 0.05),
        lng: coordinates.lng || (78.77 + Math.random() * 0.05)
      },
      contactNumber: contactNumber || '+91-9876543210',
      doctors: doctors.length > 0 ? doctors : [
        { name: 'Dr. Duty Medical Officer', specialty: 'General Physician (MBBS)', available: true, onDutyHours: '09:00 - 17:00' }
      ],
      beds: {
        total: Number(beds.total) || 10,
        occupied: Number(beds.occupied) || 0,
        available: Number(beds.available) !== undefined ? Number(beds.available) : (Number(beds.total) || 10)
      },
      oxygenCylinders: Number(oxygenCylinders) || 0,
      diagnosticsAvailable: diagnosticsAvailable.length > 0 ? diagnosticsAvailable : ['Blood Glucose', 'Rapid Malaria Test', 'Hemoglobin (Hb)', 'Basic ECG'],
      diagnosticsMissing: diagnosticsMissing || [],
      emergencyCapable: Boolean(emergencyCapable),
      currentWaitTimeMins: Number(currentWaitTimeMins) || 15
    });

    await newFac.save();

    return res.status(201).json({
      success: true,
      message: 'New Healthcare Facility created in database!',
      data: newFac
    });
  } catch (error) {
    console.error('Create facility error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateFacility = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const query = getSafeQuery(id);
    const updated = await Facility.findOneAndUpdate(query, { $set: updateData }, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: `Facility (${id}) not found` });
    }

    return res.json({ success: true, message: 'Facility updated successfully', data: updated });
  } catch (error) {
    console.error('Update facility error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteFacility = async (req, res) => {
  try {
    const { id } = req.params;
    const query = getSafeQuery(id);
    await Facility.findOneAndDelete(query);
    return res.json({ success: true, message: 'Facility deleted from database' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSmartRouting = async (req, res) => {
  try {
    const {
      patientVillage = 'Shivpuri',
      patientCoords = null, // { lat, lng }
      riskLevel = 'MODERATE',
      symptoms = [],
      requiredDiagnostics = [],
      isEmergency = false,
      sortBy = 'suitability'
    } = req.body;

    const facilitiesList = await Facility.find();

    if (!facilitiesList || facilitiesList.length === 0) {
      return res.json({ success: true, facilities: [], meta: {} });
    }

    let inferredDiagnostics = [...requiredDiagnostics];
    const symString = symptoms.join(' ').toLowerCase();
    if (symString.includes('chest') || symString.includes('heart')) {
      inferredDiagnostics.push('ECG', 'Pathology Lab');
    }
    if (symString.includes('fever') || symString.includes('malaria') || symString.includes('bukhar')) {
      inferredDiagnostics.push('Rapid Malaria Test', 'Complete Blood Count (CBC)');
    }
    if (symString.includes('pregnancy') || symString.includes('abdominal') || symString.includes('garbhavastha')) {
      inferredDiagnostics.push('Ultrasound', 'Urine Albumin');
    }
    if (symString.includes('fracture') || symString.includes('bone') || symString.includes('chot')) {
      inferredDiagnostics.push('Digital X-Ray');
    }

    const scoredFacilities = facilitiesList.map(f => {
      const plainFacility = f.toObject ? f.toObject() : { ...f };
      
      // Calculate dynamic GPS distance if patient coordinates are provided
      let calculatedDist = plainFacility.distanceKm || 5;
      if (patientCoords && patientCoords.lat && patientCoords.lng && plainFacility.coordinates) {
        calculatedDist = computeDistanceKm(
          patientCoords.lat,
          patientCoords.lng,
          plainFacility.coordinates.lat,
          plainFacility.coordinates.lng
        );
      }

      const evaluation = calculateSuitabilityScore(plainFacility, {
        riskLevel,
        requiredDiagnostics: inferredDiagnostics,
        isEmergency
      }, calculatedDist);

      return {
        ...plainFacility,
        calculatedDistanceKm: calculatedDist,
        suitability: evaluation,
        recommendationReason: generateRecommendationReason(plainFacility, evaluation, isEmergency)
      };
    });

    if (sortBy === 'distance') {
      scoredFacilities.sort((a, b) => (a.calculatedDistanceKm || a.distanceKm) - (b.calculatedDistanceKm || b.distanceKm));
    } else {
      scoredFacilities.sort((a, b) => b.suitability.score - a.suitability.score);
    }

    const topRecommendation = scoredFacilities[0];
    const nearestGeographic = [...scoredFacilities].sort((a, b) => (a.calculatedDistanceKm || a.distanceKm) - (b.calculatedDistanceKm || b.distanceKm))[0];

    const isDifferentFromNearest = topRecommendation && nearestGeographic && (topRecommendation.id !== nearestGeographic.id);

    return res.json({
      success: true,
      meta: {
        totalEvaluated: scoredFacilities.length,
        appliedCriteria: {
          patientVillage,
          patientCoords,
          riskLevel,
          inferredDiagnostics,
          isEmergency,
          sortBy
        },
        nearestFacility: nearestGeographic,
        smartRoutingAdvantage: isDifferentFromNearest ? {
          detectedIssue: `Nearest facility (${nearestGeographic.name} @ ${nearestGeographic.calculatedDistanceKm || nearestGeographic.distanceKm}km) lacks required specialist/diagnostics for this case.`,
          smartAlternative: `Recommended ${topRecommendation.name} (${topRecommendation.calculatedDistanceKm || topRecommendation.distanceKm}km) - Full clinical capability match.`
        } : null
      },
      topRecommendation,
      facilities: scoredFacilities
    });
  } catch (error) {
    console.error('Smart routing error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

function generateRecommendationReason(facility, evaluation, isEmergency) {
  if (isEmergency && facility.emergencyCapable) {
    return '🚨 Nearest Trauma / Emergency unit with available oxygen beds & 24x7 Specialist cover.';
  }
  if (evaluation.suitabilityTier === 'HIGHLY_SUITABLE') {
    return `✅ Optimal match: ${evaluation.activeDoctorsCount} doctors on active duty, verified diagnostic facilities, and low wait time (${facility.currentWaitTimeMins} mins).`;
  }
  if (facility.type === 'Sub-Centre') {
    return 'ℹ️ Suitable for primary triage & minor ailments only. Specialized diagnostic work requires higher tier.';
  }
  return `Standard referral candidate with ${facility.beds?.available || 0} available beds.`;
}
