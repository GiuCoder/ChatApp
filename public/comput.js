const messages = document.getElementById("messages");
const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const disconnectButton = document.getElementById("disconnect-button");

const urlParams = new URLSearchParams(window.location.search);
const roomName = urlParams.get("roomName");
const username = urlParams.get("username");

const socket = io();
const onlineUsersList = document.getElementById("user-list");
if (!roomName || !username) {
  socket.disconnect();
  window.location.href = "/"; // Replace "/" with the URL you want to redirect to
}

socket.on("update online users", (onlineUsers) => {
  onlineUsersList.innerHTML = "";
  onlineUsers.forEach((username) => {
    const userElement = document.createElement("li");
    const dotElement = document.createElement("span");
    dotElement.classList.add("online-dot");
    userElement.appendChild(dotElement);
    userElement.innerText += username;
    onlineUsersList.appendChild(userElement);
  });
});

disconnectButton.addEventListener("click", () => {
  socket.close();
  window.location.href = "/"; // Replace "/" with the URL you want to redirect to
});
function getUniqueUsername(username) {
  const existingUsernames = Array.from(
    document.querySelectorAll(".username")
  ).map((node) => node.innerText);
  let newUsername = username;
  let count = 1;
  while (existingUsernames.includes(newUsername)) {
    newUsername = `${username}(${count})`;
    count++;
  }
  return newUsername;
}

socket.on("connect", () => {
  socket.emit("join room", { roomName, username });
});

socket.on("chat message", (msg) => {
  const messageElement = document.createElement("li");
  messageElement.innerText = msg;
  messageElement.classList.add("list-group-item");
  if (msg.startsWith("System:")) {
    messageElement.classList.add("system-message");
  }
  messages.appendChild(messageElement);
});

let isSubmitting = false;
const notification = document.getElementById("notification");

function showNotification() {
  notification.classList.remove("d-none");
}

function hideNotification() {
  notification.classList.add("d-none");
}

setInterval(() => {
  hideNotification();
}, 3500);
if (window.history.replaceState) {
  window.history.replaceState(null, null, window.location.href);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isSubmitting) {
    showNotification();
    return;
  }
  isSubmitting = true;
  const message = {
    roomName: roomName,
    username: username,
    message: input.value,
  };
  socket.emit("chat message", message);
  input.value = "";
  setTimeout(() => {
    isSubmitting = false;
  }, 1500);
});

socket.on("error", (error) => {
  console.error(error);
});
const chatMessage = document.getElementById("messages");


