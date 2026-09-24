const { getSelfServiceTip } = require("./selfService");

const complaints = [
    "The wifi is not working in our classroom",
    "The printer is not printing",
    "The projector screen is blank",
    "There is a serious water leak in Block A"
];

for (const complaint of complaints) {
    const tip = getSelfServiceTip(complaint);

    console.log("\nComplaint:", complaint);

    if (tip) {
        console.log("Suggested fix:", tip);
    } else {
        console.log("No self-service tip. Continue to complaint.");
    }
}