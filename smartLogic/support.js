function supportComplaint(complaint, userId) {
    // Make sure upvotes exists
    if (!complaint.upvotes) {
        complaint.upvotes = [];
    }

    // Convert IDs to strings for safe comparison
    const alreadySupported = complaint.upvotes.some(
        id => id.toString() === userId.toString()
    );

    if (alreadySupported) {
        return {
            success: false,
            message: "You have already supported this complaint."
        };
    }

    // Add the student to the supporters
    complaint.upvotes.push(userId);

    return {
        success: true,
        message: "Complaint supported successfully.",
        upvoteCount: complaint.upvotes.length
    };
}

module.exports = {
    supportComplaint
};