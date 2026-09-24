function findMatchingKnownIssue(complaint, existingComplaints) {
    for (const existing of existingComplaints) {
        // Don't compare the complaint with itself
        if (
            complaint._id &&
            existing._id &&
            complaint._id.toString() === existing._id.toString()
        ) {
            continue;
        }

        // Same category
        const sameCategory =
            complaint.category &&
            existing.category &&
            complaint.category.toString() ===
            existing.category.toString();

        if (!sameCategory) {
            continue;
        }

        // Simple keyword matching
        const complaintText =
            `${complaint.title} ${complaint.description}`.toLowerCase();

        const existingText =
            `${existing.title} ${existing.description}`.toLowerCase();

        const complaintWords = new Set(
            complaintText
                .replace(/[^\w\s]/g, "")
                .split(/\s+/)
                .filter(word => word.length > 2)
        );

        const existingWords = new Set(
            existingText
                .replace(/[^\w\s]/g, "")
                .split(/\s+/)
                .filter(word => word.length > 2)
        );

        let commonWords = 0;

        for (const word of complaintWords) {
            if (existingWords.has(word)) {
                commonWords++;
            }
        }

        const similarity =
            commonWords /
            Math.max(complaintWords.size, existingWords.size);

        if (similarity >= 0.5) {
            return existing;
        }
    }

    return null;
}

module.exports = {
    findMatchingKnownIssue
};