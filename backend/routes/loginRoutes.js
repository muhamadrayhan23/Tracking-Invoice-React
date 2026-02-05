const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Login admin dan Client
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Username dan password wajib diisi"
        });
    }

    try {
        const [users] = await db.query(
            `SELECT id, username, role
             FROM users
             WHERE username = ? AND password = ?`,
            [username, password]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Username atau password salah"
            });
        }

        const user = users[0];


        res.json({
            message: "Login berhasil",
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;
