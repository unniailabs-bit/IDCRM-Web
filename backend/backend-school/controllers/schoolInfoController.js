const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

// -------------------- Get Public School Info --------------------
exports.getSchoolPublicInfo = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: "School ID is required." });
        }

        const query = `
      SELECT 
        s.school_name AS name, 
        s.address, 
        s.logo AS school_logo, 
        s.principal_sign, 
        t.trust_name 
      FROM schools s
      LEFT JOIN trusts t ON s.trust_id = t.id
      WHERE s.id = :id
    `;

        const school = await sequelize.query(query, {
            replacements: { id },
            type: QueryTypes.SELECT,
        });

        if (school.length === 0) {
            return res.status(404).json({ success: false, message: "School not found." });
        }

        res.status(200).json({
            success: true,
            data: school[0],
        });
    } catch (error) {
        console.error("Get Public School Info Error:", error);
        res.status(500).json({ success: false, message: "Server error while fetching school info" });
    }
};
