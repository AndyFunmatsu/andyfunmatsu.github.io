const express = require('express');
// const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
// const upload = multer({ dest: "/app/uploads" }); // Volume path



const http = require("http");
const WebSocket = require("ws");
require("dotenv").config();

const cors = require("cors");

const corsOptions = {
    origin: "https://andyfunmatsu.github.io", // ✅ Allow requests from your frontend
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

app.use(cors(corsOptions)); // 🔥 Enables CORS
app.options('/', cors(corsOptions));

app.use(express.json());

const allowedOrigins = ["https://andyfunmatsu.github.io", "https://192.168.0.26", "http://127.0.0.1:5500/"];

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }

    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    if (req.method === "OPTIONS") {
        console.log("received preflight checks!");
        return res.sendStatus(200); // ✅ Respond to preflight checks
    }

    next();
});
// ✅ Create an HTTP server from Express
const server = http.createServer(app);

// ✅ Attach WebSockets to the same Express server
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, req) => {
    const origin = req.headers.origin;
    
    if (origin !== "https://andyfunmatsu.github.io") {
        console.log("🚫 Blocked WebSocket connection from:", origin);
        ws.close();
        return;
    }

    console.log("✅ WebSocket client connected!");

    ws.on("message", (message) => {
        console.log(`📩 Received message: ${message}`);
        // ws.send(`Echo: ${message}`);
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on("close", () => console.log("❌ WebSocket client disconnected"));
});


// app.use(cors({ origin: "https://funmatsu.github.io" }));
const mysql = require('mysql2');
console.log(process.env.DB_PASS);
const connection = mysql.createConnection({
    host:       process.env.DB_HOST,
    user:       process.env.DB_USER,
    password:   process.env.DB_PASS,
    database:   process.env.DB_NAME,
    port:       process.env.DB_PORT
});


connection.connect(err => {
    if (err) throw err;
    console.log("✅ Database connected!");
    // window.location.reload();
});


// ✅ Test Route
// app.get('/', (req, res) => {
//     res.send("Hello, World! Your Node.js server is running!");
// });

app.get("/", (req, res) => {
    res.send(`<div style="
                            display: flex;
                            flex-direction: row;">
                    <div style="
                                    background-color: rgb(44, 121, 202);
                                    color: white;
                                    width: fit-content;
                                    text-Align: right;
                                    position: relative;
                                    padding: 15px;
                                    margin: 10px;
                                    border-radius: 10px">🚀 Railway Backend is Live! Use "/data", "/teams", or "/users" to get started and code ur api</div>
                </div>`);
});

const storage = multer.diskStorage({
  destination: "/app/images",
});

const upload = multer({ storage });

app.use("/images", express.static("/app/images")); // Volume path

// app.post("/upload", upload.single("image"), (req, res) => {
//   const file = req.file;
//   if (!file) return res.status(400).send("No file uploaded");
//     res.send(`/images/${req.file.originalname}`);
// });

app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  const imagePath = `/images/${req.file.filename}`;
  res.send(imagePath); // You could also use res.json({ url: imagePath })
});


// const fs = require('fs');
app.get('/list-images', (req, res) => {
  fs.readdir('/app/images', (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(files);
  });
});

app.get('/data', (req, res) => {
    connection.query("SELECT * FROM users", (err, results) => {
        if (err) {
            console.error("Database error:", err);
            res.status(500).json({ error: "Database query failed" });
        } else {
            res.json(results);
        }
    });
});

app.use(express.json()); // Ensure JSON parsing

app.post('/temperature_data', (req, res) => {
    console.log("Received body:", req.body); // Debugging step

    const { value } = req.body;
    if (!value) return res.status(400).json({ error: "Temperature is required" });

    const sql = "INSERT INTO temperature_data (value) VALUES (?)";

    connection.query(sql, [value], (err, results) => {
        if (err) return res.status(500).send("Internal Server Error");

        res.json({ success: true, insertedId: results.insertId });
    });
});

app.get('/temperature_data', (req, res) => {
    connection.query("SELECT * FROM temperature_data", (err, results) => {
        if (err) {
            console.error("Database error:", err);
            res.status(500).json({ error: "Database query failed" });
        } else {
            res.json(results);
        }
    });
});

app.post("/login", (req, res) => {
    console.log("Received body:", req.body); // Debugging step
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";

    connection.query(sql, [username, password], (err, results) => {
        if (err) return res.status(500).send("Internal Server Error");
        if (results.length === 0) return res.status(401).json({ success: false });
        
        const user = results[0];
        if (password === user.password) {
            res.json({ success: true, userId: user.id });
        } else {
            res.status(401).json({ success: false, message: "❌ Invalid credentials" });
        }
    });
});

// app.post("/login", (req, res) => {
//     console.log("Received body:", req.body); // Debugging step
//     const { username, password } = req.body;
    
//     if (!username || !password) {
//         return res.status(400).json({ success: false, message: "❌ Missing username or password!" });
//     }
    
//     res.json({ message: "Login request processed!" });
// });


app.post("/teams", (req, res) => {
    const { name, description } = req.body;
    console.log(req.body.name);
    if (!name) {
        console.log("❌ Missing team name!");
        return res.status(400).json({ success: false, message: "Team name is required!" });
    }

    const sql = "INSERT INTO teams (name, description) VALUES (?, ?)";
    connection.query(sql, [name, description], (err, result) => {
        if (err) {
            console.error("❌ Error inserting team:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        console.log("✅ Team Added to Database:", result);
        res.json({ success: true, teamId: result.insertId });
    });
});

app.get("/teams", (req, res) => {
    const sql = "SELECT * FROM teams ORDER BY created_at DESC";

    connection.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Error fetching teams:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        res.json({ success: true, teams: results }); // ✅ Ensure the response includes the teams array
    });
});

app.delete("/teams/:teamname", (req, res) => {
    const { teamname } = req.params;
    
    const sql = "DELETE FROM teams WHERE name = ?";
    
    connection.query(sql, [teamname], (err, result) => {
        if (err) {
            console.error("❌ Error deleting team:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Team not found!" });
        }

        console.log(`✅ Team '${teamname}' deleted successfully!`);
        res.json({ success: true, message: "Team deleted!" });
    });
});

app.delete("/messages_teams/:teamname/:username/:channel/:id", (req, res) => {
    const { teamname, username, channel, id } = req.params;
    
    const sql = "DELETE FROM messages_teams WHERE teamname = ? AND username = ? AND channel = ? AND id = ?";
    
    connection.query(sql, [teamname, username, channel, id], (err, result) => {
        if (err) {
            console.error("❌ Error deleting messages:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Messages not found!" });
        }

        console.log(`✅ Messages from '${teamname}' deleted successfully!`);
        res.json({ success: true, message: "Team deleted!" });
    });
});

app.delete("/direct_messages/:target_user/:username/:channel/:id", (req, res) => {
    const { target_user, username, channel, id } = req.params;
    
    const sql = "DELETE FROM direct_messages WHERE target_user = ? AND username = ? AND channel = ? AND id = ?";
    
    connection.query(sql, [target_user, username, channel, id], (err, result) => {
        if (err) {
            console.error("❌ Error deleting messages:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Messages not found!" });
        }

        console.log(`✅ Messages from '${target_user}' deleted successfully!`);
        res.json({ success: true, message: "Team deleted!" });
    });
});

// ✅ Fetch All Users
app.get('/users', (req, res) => {
    connection.query("SELECT username FROM users", (err, results) => {
        if (err) {
            console.error("❌ Error fetching users:", err);
            return res.status(500).send("Internal Server Error");
        }
        res.json(results);
    });
});

app.post("/users", (req, res) => {
    const { username, email, password} = req.body; // ✅ Accept user data

    if (!username || !email || !password) {
        console.log("❌ Missing required fields!");
        return res.status(400).json({ success: false, message: "Username, email, and password required!" });
    }

    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    connection.query(sql, [username, email, password|| null], (err, result) => {
        if (err) {
            console.error("❌ Error inserting user:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

        console.log("✅ User Added to Database:", result);
        res.json({ success: true, userId: result.insertId });
    });
});


// ✅ Fetch Messages for a Specific User
app.get('/users/:username/messages', (req, res) => {
    const username = req.params.username;
    const sql = "SELECT * FROM messages WHERE username = ?";
    
    connection.query(sql, [username], (err, results) => {
        if (err) {
            console.error("❌ Error fetching messages:", err);
            return res.status(500).send("Internal Server Error");
        }
        res.json(results);
    });
});

app.get('/users/:username/email', (req, res) => {
    const username = req.params.username;
    const sql = "SELECT email FROM users WHERE username = ?";
    
    connection.query(sql, [username], (err, results) => {
        if (err) {
            console.error("❌ Error fetching email:", err);
            return res.status(500).send("Internal Server Error");
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }

        res.json({ success: true, email: results[0].email });
    });
});

// // ✅ Send a Message (Now Includes Username)
// app.post('/users/:username/messages', (req, res) => {
//     console.log("📥 Received message request:", req.body); // ✅ Debugging

//     const { username, message } = req.body;
//     if (!username || !message) {
//         console.log("❌ Missing fields!");
//         return res.status(400).json({ success: false, message: "Username and message required!" });
//     }

//     const sql = "INSERT INTO messages (username, message) VALUES (?, ?)";
//     connection.query(sql, [username, message], (err, result) => {
//         if (err) {
//             console.error("❌ Error inserting message:", err);
//             return res.status(500).json({ success: false, message: "Internal Server Error" });
//         }
//         console.log("✅ Message stored in DB:", result);
//         res.json({ success: true, message: "Message sent!", messageId: result.insertId });
//     });
// });

app.post("/messages_teams", (req, res) => {
    const { username, teamname, message, channel, created_at, quote_id } = req.body;

    if (!username || !message || !teamname || !channel) {
        return res.status(400).json({ success: false, message: "Username, teamname, and message required!" });
    }

    // ✅ Ensure message does not include username formatting
    const cleanMessage = message.trim(); // Remove any HTML formatting

    const sql = "INSERT INTO messages_teams (username, teamname, message, channel, created_at, quote_id) VALUES (?, ?, ?, ?, ?, ?)";
    connection.query(sql, [username, teamname, cleanMessage, channel, created_at, quote_id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        res.json({ success: true, message: "Message sent!", messageId: result.insertId });
    });
});

app.post("/direct_messages", (req, res) => {
    const { username, target_user, message, channel, created_at, quote_id } = req.body;

    if (!username || !message || !target_user || !channel) {
        return res.status(400).json({ success: false, message: "Username, teamname, and message required!" });
    }

    // ✅ Ensure message does not include username formatting
    const cleanMessage = message.trim(); // Remove any HTML formatting

    const sql = "INSERT INTO direct_messages (username, target_user, message, channel, created_at, quote_id) VALUES (?, ?, ?, ?, ?, ?)";
    connection.query(sql, [username, target_user, cleanMessage, channel, created_at, quote_id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        res.json({ success: true, message: "Message sent!", messageId: result.insertId });
    });
});

// app.post("/channels", (req, res) => {
//     const { name, team } = req.body;

//     if (!name || !team) {
//         return res.status(400).json({ success: false, message: "team and/or name required!" });
//     }

//     const sql = "INSERT INTO channels (name, team) VALUES (?, ?)";

//     connection.query(sql, [name, team], (err, result) => {
//         if (err) {
//             console.error("❌ Error inserting channel:", err);
//             return res.status(500).json({ success: false, message: "Internal Server Error" });
//         }

//         res.json({ success: true, message: "✅ Channel created!", channelId: result.insertId });
//     });
// });

app.post("/channels", (req, res) => {
    const { name, team, username } = req.body;

    if (!name || !team) {
        return res.status(400).json({ success: false, message: "team and/or name required!" });
    }

    const sql = "INSERT INTO channels (name, team, username) VALUES (?, ?, ?)";

    connection.query(sql, [name, team, username], (err, result) => {
        if (err) {
            console.error("❌ Error inserting channel:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

        res.json({ success: true, message: "✅ Channel created!", channelId: result.insertId });
    });
});

app.get("/channels/:team", (req, res) => {
    const {team} = req.params;
    const sql = "SELECT * FROM channels WHERE team = ?";

    connection.query(sql, [team], (err, result) => {
        if (err) {
            console.error("❌ Error fetching channels:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

        res.json({ success: true, channels: result });
    });
});

app.get("/channels/:team/:username", (req, res) => {
    const {team, username} = req.params;
    const sql = "SELECT * FROM channels WHERE team = ? AND username = ?";

    connection.query(sql, [team, username], (err, result) => {
        if (err) {
            console.error("❌ Error fetching channels:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

        res.json({ success: true, channels: result });
    });
});

app.delete("/channels/:channel", (req, res) => {
    const { channel } = req.params;
    
    const sql = "DELETE FROM channels WHERE name = ?";
    
    connection.query(sql, [channel], (err, result) => {
        if (err) {
            console.error("❌ Error deleting channel:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Channel not found!" });
        }

        console.log(`✅ channel '${channel}' deleted successfully!`);
        res.json({ success: true, message: "Channel deleted!" });
    });
});


// // ✅ Fetch All Messages (Now Includes Usernames)
// app.get("/messages", (req, res) => {
//     const sql = "SELECT username, message, timestamp FROM messages ORDER BY timestamp ASC";

//     connection.query(sql, (err, results) => {
//         if (err) {
//             console.error("❌ Database Error:", err);
//             return res.status(500).json({ success: false, message: "Internal Server Error" }); // ✅ Respond with valid JSON
//         }
//         res.json({ success: true, messages: results }); // ✅ Ensure response is valid JSON
//     });
// });

app.get("/messages_teams", (req, res) => {
    const sql = "SELECT id, username, teamname, message, created_at FROM messages_teams ORDER BY created_at ASC";

    connection.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        console.log("✅ Retrieved Messages:", results); // ✅ Debugging step
        res.json({ success: true, messages: results });
    });
});

app.get("/direct_messages", (req, res) => {
    const sql = "SELECT username, target_user, message, created_at FROM direct_messages ORDER BY created_at ASC";

    connection.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        console.log("✅ Retrieved Messages:", results); // ✅ Debugging step
        res.json({ success: true, messages: results });
    });
});

// app.get("/messages_teams/:teamname", (req, res) => {
//     const { teamname } = req.params;
//     const sql = "SELECT username, teamname, message, created_at FROM messages_teams WHERE teamname = ? ORDER BY created_at ASC";

//     connection.query(sql, [teamname], (err, results) => {
//         if (err) {
//             return res.status(500).json({ success: false, message: "Internal Server Error" });
//         }
//         console.log(`✅ Retrieved Messages for Team "${teamname}":`, results); // ✅ Debugging step
//         res.json({ success: true, messages: results });
//     });
// });

app.get("/messages_teams/:teamname/:channel", (req, res) => {
    const { teamname, channel } = req.params;

    const sql = "SELECT * FROM messages_teams WHERE teamname = ? AND channel = ? ORDER BY created_at ASC";

    connection.query(sql, [teamname, channel], (err, results) => {
        if (err) {
            console.error("❌ Error retrieving messages:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        console.log(`✅ Retrieved Messages for Team "${teamname}", Channel "${channel}":`, results);
        res.json({ success: true, messages: results });
    });
});

app.get("/messages_teams/:teamname/:channel/:id", (req, res) => {
    const { teamname, channel, id } = req.params;

    const sql = "SELECT * FROM messages_teams WHERE teamname = ? AND channel = ? AND id = ? ORDER BY created_at ASC";

    connection.query(sql, [teamname, channel, id], (err, results) => {
        if (err) {
            console.error("❌ Error retrieving messages:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        console.log(`✅ Retrieved Messages for Team "${teamname}", Channel "${channel}":`, results);
        res.json({ success: true, messages: results });
    });
});

// app.get("/messages_teams/:teamname/:channel/:id", (req, res) => {
//     const { teamname, channel, id } = req.params;

//     const sql = "SELECT username, teamname, channel, message, id, created_at FROM messages_teams WHERE teamname = ? AND channel = ? AND id = ? ORDER BY created_at ASC";

//     connection.query(sql, [teamname, channel, id], (err, results) => {
//         if (err) {
//             console.error("❌ Error retrieving messages:", err);
//             return res.status(500).json({ success: false, message: "Internal Server Error" });
//         }
//         console.log(`✅ Retrieved Message for Team "${teamname}", Channel "${channel}":`, results);
//         res.json({ success: true, messages: results });
//     });
// });

app.get("/direct_messages/:target_user/:username/:channel", (req, res) => {
    const { target_user, username, channel } = req.params;

    const sql = "SELECT * FROM direct_messages WHERE ((target_user = ? AND username = ?) OR (target_user = ? AND username = ?)) AND channel = ? ORDER BY created_at ASC";

    connection.query(sql, [target_user, username, username, target_user, channel], (err, results) => {
        if (err) {
            console.error("❌ Error retrieving messages:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        console.log(`✅ Retrieved Messages for Team "${target_user}", Channel "${channel}":`, results);
        res.json({ success: true, messages: results });
    });
});

app.get("/direct_messages/:target_user/:channel", (req, res) => {
    const { target_user, channel } = req.params;

    const sql = "SELECT * FROM direct_messages WHERE ((target_user = ? AND username = ?) OR (target_user = ? AND username = ?)) AND channel = ? ORDER BY created_at ASC";

    connection.query(sql, [target_user, channel], (err, results) => {
        if (err) {
            console.error("❌ Error retrieving messages:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        console.log(`✅ Retrieved Messages for Team "${target_user}", Channel "${channel}":`, results);
        res.json({ success: true, messages: results });
    });
});

app.get("/direct_messages/:target_user/:channel/:id", (req, res) => {
    const { target_user, channel, id } = req.params;

    const sql = "SELECT * FROM direct_messages WHERE target_user = ? AND channel = ? AND id = ? ORDER BY created_at ASC";

    connection.query(sql, [target_user, channel, id], (err, results) => {
        if (err) {
            console.error("❌ Error retrieving messages:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        console.log(`✅ Retrieved Messages for Team "${target_user}", Channel "${channel}":`, results);
        res.json({ success: true, messages: results });
    });
});

app.get("/direct_messages/:username/:target_user/:channel", (req, res) => {
    const { username, target_user, channel } = req.params;

    const sql = "SELECT * FROM direct_messages WHERE ((username = ? AND target_user = ?) OR (target_user = ? AND username = ?)) AND channel = ? ORDER BY created_at ASC";

    connection.query(sql, [username, target_user, username, target_user, channel], (err, results) => {
        if (err) {
            console.error("❌ Error retrieving messages:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        console.log(`✅ Retrieved Messages for user "${target_user}" from ${username}, Channel "${channel}":`, results);
        res.json({ success: true, messages: results });
    });
});

app.get("/direct_messages/:target_user/:username/:channel/:id", (req, res) => {
    const { username, target_user, channel, id } = req.params;

    const sql = "SELECT * FROM direct_messages WHERE ((username = ? AND target_user = ?) OR (target_user = ? AND username = ?)) AND channel = ? AND id = ?ORDER BY created_at ASC";

    connection.query(sql, [username, target_user, username, target_user, channel, id], (err, results) => {
        if (err) {
            console.error("❌ Error retrieving messages:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        console.log(`✅ Retrieved Messages for user "${target_user}" from ${username}, Channel "${channel}":`, results);
        res.json({ success: true, messages: results });
    });
});

// ✅ Delete All Messages & Reset IDs
app.delete('/messages', (req, res) => {
    const sql = "TRUNCATE TABLE messages"; // ✅ Fully resets auto-increment ID

    connection.query(sql, (err) => {
        if (err) {
            console.error("❌ Error deleting messages:", err);
            return res.status(500).send("Internal Server Error");
        }
        res.json({ message: "✅ All messages deleted!" });
    });
});

// ✅ Start the Server
const PORT =  2008;
// app.listen(PORT, () => {
//     console.log("🚀 Listening to port", PORT);
// });

// ✅ Start the Express & WebSocket Server on Railway's assigned port
server.listen(PORT, () => {
    console.log(`🚀 Express & WebSocket Server running on port ${PORT}`);
});