const express = require("express");

const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

let db = null;
const dbPath = path.join(__dirname, "userData.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API 1
app.post("/register/", async (request, response) => {
  const { name, username, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const getUserQuery = `
    SELECT *
    FROM 
        user 
    WHERE 
        username = '${username}';
    `;

  const dbUser = await db.get(getUserQuery);

  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `
            INSERT INTO 
            user (name, username, password, gender, location)
            VALUES (
                '${name}', '${username}', '${hashedPassword}', '${gender}', '${location}'
            );
            `;

      await db.run(createUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const getUserQuery = `
        SELECT *
        FROM 
        user
        WHERE 
            username = '${username}';
    `;

  const dbUser = await db.get(getUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);

    if (isPasswordMatched) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  const getUserQuery = `
    SELECT * 
    FROM 
    user
    WHERE 
        username = '${username}';
    `;

  const dbUser = await db.get(getUserQuery);

  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);

  if (isPasswordMatched === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatePassword = `
      UPDATE user
      SET 
        password = '${hashedNewPassword}'
      WHERE 
        username = '${username}';
      `;
      await db.run(updatePassword);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
