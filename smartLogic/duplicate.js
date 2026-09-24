function getWords(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(word => word.length > 2);
}

function keywordSimilarity(text1, text2) {
    const words1 = new Set(getWords(text1));
    const words2 = new Set(getWords(text2));

    if (words1.size === 0 || words2.size === 0) {
        return 0;
    }

    let commonWords = 0;

    for (const word of words1) {
        if (words2.has(word)) {
            commonWords++;
        }
    }

    return commonWords / Math.max(words1.size, words2.size);
}

function calculateSimilarity(complaint1, complaint2) {
    let score = 0;

    // Same category
    if (
        complaint1.category &&
        complaint2.category &&
        complaint1.category.toString() === complaint2.category.toString()
    ) {
        score += 0.3;
    }

    // Title similarity
    score += keywordSimilarity(
        complaint1.title,
        complaint2.title
    ) * 0.3;

    // Description similarity
    score += keywordSimilarity(
        complaint1.description,
        complaint2.description
    ) * 0.4;

    return Number(score.toFixed(2));
}

function isDuplicate(complaint1, complaint2) {
    return calculateSimilarity(complaint1, complaint2) >= 0.7;
}

module.exports = {
    calculateSimilarity,
    isDuplicate
};