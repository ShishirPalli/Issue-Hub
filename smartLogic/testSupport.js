const { supportComplaint } = require("./support");

const complaint = {
    _id: "C001",
    title: "Lights not working",
    upvotes: []
};

console.log(
    supportComplaint(complaint, "student001")
);

console.log(
    supportComplaint(complaint, "student002")
);

console.log(
    supportComplaint(complaint, "student001")
);

console.log("\nFinal upvotes:");
console.log(complaint.upvotes);