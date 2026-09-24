const { findMatchingKnownIssue } = require("./knownIssue");

const newComplaint = {
    _id: "C002",
    category: "electricity",
    title: "Lights not working",
    description: "Lights are not working in room 204"
};

const existingComplaints = [
    {
        _id: "C001",
        category: "electricity",
        title: "Room 204 lights broken",
        description: "The lights are not working inside room 204"
    },
    {
        _id: "C003",
        category: "water",
        title: "Water leakage",
        description: "Water is leaking in Block A"
    }
];

const result = findMatchingKnownIssue(
    newComplaint,
    existingComplaints
);

if (result) {
    console.log("Known issue found:");
    console.log(result);
} else {
    console.log("No known issue found.");
}