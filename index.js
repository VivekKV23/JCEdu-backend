const express = require("express"); // importing in the backend is like this
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const colors = require("colors");
const multer = require("multer");

const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const usersRoutes = require("./routes/users");

const blogUserRoute = require("./routes/blogusers");
const blogPostRoute = require("./routes/blogposts");
const blogCatRoute = require("./routes/blogcat");

const commentRoutes = require("./routes/comments");
const videoRoutes = require("./routes/videos");
const cookieParser = require("cookie-parser");


dotenv.config();
connectDB();
const app = express();

app.use(cookieParser());

app.use(express.json()); // to accept json data
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.use("/api/users", usersRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/comments", commentRoutes);

app.use("/api/blogusers", blogUserRoute);
app.use("/api/blogposts", blogPostRoute);
app.use("/api/blogpcat", blogCatRoute);

// Deployment code for chat
const __dirname1 = path.resolve();
const pd = path.dirname(__dirname1);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(pd, "/frontend/build")));

  app.get("*", (req, res) => res.sendFile("https://jce-virtual.netlify.app"));
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// Deployment end

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running on PORT ${PORT}...`.yellow.bold)
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "https://jce-virtual.netlify.app",
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});

// Deoployment
