const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db'); // your Sequelize instance

// Approve or Reject Trust Registration
const updateTrustStatus = async (req, res) => {
    try {
        const { trustId } = req.params; // trust id from URL
        const { status } = req.body;    // status = 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'." });
        }

        // Using Sequelize raw query
        const [result] = await sequelize.query(
            `UPDATE trusts 
             SET registration_status = :status, updated_at = NOW() 
             WHERE id = :trustId 
             RETURNING *`,
            {
                replacements: { status, trustId },
                type: QueryTypes.UPDATE
            }
        );

        if (!result || result.length === 0) {
            return res.status(404).json({ message: "Trust not found." });
        }

        return res.status(200).json({
            message: `Trust registration ${status} successfully.`,
            trust: result[0] // first row
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
};

module.exports = { updateTrustStatus };
