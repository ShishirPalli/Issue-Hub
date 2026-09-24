const tips = [
    {
        keywords: ["wifi", "internet", "network"],
        tip: "Try restarting the router and reconnecting to the network."
    },
    {
        keywords: ["printer", "printing"],
        tip: "Check whether the printer is powered on and has paper."
    },
    {
        keywords: ["projector", "display", "screen"],
        tip: "Check whether the HDMI/VGA cable is properly connected."
    },
    {
        keywords: ["light", "bulb"],
        tip: "Check whether the switch is turned on. If the light still doesn't work, continue with the complaint."
    }
];

function getSelfServiceTip(description) {
    const text = description.toLowerCase();

    for (const item of tips) {
        const matched = item.keywords.some(keyword =>
            text.includes(keyword)
        );

        if (matched) {
            return item.tip;
        }
    }

    return null;
}

module.exports = {
    getSelfServiceTip
};