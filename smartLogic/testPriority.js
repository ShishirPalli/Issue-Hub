const { calculatePriority } = require("./priority");

const result = calculatePriority({
    urgency: 5,
    impact: 5,
    safety: 5,
    duration: 72
});

console.log(result);