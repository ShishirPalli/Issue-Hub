const {
    calculateSimilarity,
    isDuplicate
} = require("./duplicate");

const complaint1 = {
    category: "electricity",
    title: "Lights not working",
    description: "The lights are not working in room 204"
};

const complaint2 = {
    category: "electricity",
    title: "Room 204 lights broken",
    description: "Lights are not working inside room 204"
};

console.log(
    "Similarity:",
    calculateSimilarity(complaint1, complaint2)
);

console.log(
    "Duplicate:",
    isDuplicate(complaint1, complaint2)
);