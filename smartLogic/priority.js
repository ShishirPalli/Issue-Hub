function calculatePriority({
    urgency,
    impact,
    safety,
    duration
}) {
    let score = 0;

    // urgency, impact and safety are 1-5
    score += urgency;
    score += impact;
    score += safety;

    // duration is in hours
    if (duration >= 168) {
        score += 5;
    } else if (duration >= 72) {
        score += 4;
    } else if (duration >= 24) {
        score += 3;
    } else if (duration >= 6) {
        score += 2;
    } else {
        score += 1;
    }

    let priority;

    if (score >= 17) {
        priority = "CRITICAL";
    } else if (score >= 13) {
        priority = "HIGH";
    } else if (score >= 9) {
        priority = "MEDIUM";
    } else {
        priority = "LOW";
    }

    return {
        score,
        priority
    };
}

module.exports = {
    calculatePriority
};