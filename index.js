const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { ulid } = require("ulid");
require("dotenv").config();

const app = express();
app.use(cors(), bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const users = new Map();
const logs = new Map();

app.post("/api/users", (req, res) => {
  const user = {
    _id: ulid(),
    username: req.body.username,
  };
  users.set(user._id, user);
  return res.json(user);
});

app.get("/api/users", (req, res) => {
  return res.json(Array.from(users.values()));
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const user = users.get(req.params._id);

  const logEntry = {
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date ? new Date(req.body.date) : new Date(),
  };

  if (logs.has(user._id)) {
    const log = logs.get(user._id);
    log.push(logEntry);
  } else {
    logs.set(user._id, [logEntry]);
  }

  return res.json({
    ...user,
    ...logEntry,
    date: logEntry.date.toDateString(),
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const user = users.get(req.params._id);
  let log = logs.get(req.params._id);
  if (req.query.from && req.query.to) {
    const from = new Date(req.query.from);
    const to = new Date(req.query.to);
    log = log.filter(({ date }) => {
      const time = date.getTime();
      return time >= from.getTime() && time < to.getTime();
    });
  }
  if (req.query.limit) {
    log = log.slice(0, parseInt(req.query.limit));
  }
  return res.json({
    ...user,
    log: log.map((entry) => ({
      ...entry,
      date: entry.date.toDateString(),
    })),
    count: log.length,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
