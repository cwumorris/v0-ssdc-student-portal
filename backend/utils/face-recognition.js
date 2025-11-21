// Face recognition simulation
// In production, integrate with actual face recognition service

const compareFaces = async (selfieUrl, idDocumentUrl) => {
  try {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate random score for demo (60-100)
    const score = Math.floor(Math.random() * 40) + 60;

    let status, confidence, method;

    if (score >= 85) {
      status = 'verified';
      confidence = 'high';
      method = 'automated';
    } else if (score >= 70) {
      status = 'under_review';
      confidence = 'medium';
      method = 'hybrid';
    } else {
      status = 'rejected';
      confidence = 'low';
      method = 'automated';
    }

    return {
      score,
      confidence,
      status,
      method
    };
  } catch (error) {
    console.error('Face recognition error:', error);
    return {
      score: 0,
      confidence: 'low',
      status: 'under_review',
      method: 'manual'
    };
  }
};

module.exports = {
  compareFaces
};

