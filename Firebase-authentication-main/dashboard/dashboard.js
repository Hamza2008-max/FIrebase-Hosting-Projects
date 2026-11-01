import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { db, auth } from "../firebase.config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const loading = document.getElementById("todo-loading");
const empty = document.getElementById("todo-empty");
const count = document.getElementById("todo-count");
const message = document.getElementById("dashboard-message");
let activeUserId;

const showError = (error) => {
  message.textContent = error.message;
  message.classList.remove("d-none");
};

const renderTodos = (snapshot) => {
  list.replaceChildren();
  const todos = snapshot.docs
    .map((todoDocument) => ({ id: todoDocument.id, ...todoDocument.data() }))
    .sort((first, second) => second.createdAt - first.createdAt);

  todos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = "todo-item d-flex align-items-center gap-3 py-3";

    const checkbox = document.createElement("input");
    checkbox.className = "form-check-input flex-shrink-0 mt-0";
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(todo.completed);
    checkbox.setAttribute("aria-label", `Mark ${todo.title} as ${todo.completed ? "incomplete" : "complete"}`);
    checkbox.dataset.action = "toggle";
    checkbox.dataset.id = todo.id;

    const title = document.createElement("span");
    title.className = `todo-title flex-grow-1${todo.completed ? " completed" : ""}`;
    title.textContent = todo.title;

    const removeButton = document.createElement("button");
    removeButton.className = "btn btn-sm btn-outline-danger flex-shrink-0";
    removeButton.type = "button";
    removeButton.textContent = "Delete";
    removeButton.dataset.action = "delete";
    removeButton.dataset.id = todo.id;
    removeButton.setAttribute("aria-label", `Delete ${todo.title}`);

    item.append(checkbox, title, removeButton);
    list.append(item);
  });

  const taskLabel = todos.length === 1 ? "task" : "tasks";
  count.textContent = `${todos.length} ${taskLabel}`;
  loading.classList.add("d-none");
  empty.classList.toggle("d-none", todos.length > 0);
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title || !activeUserId) {
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  message.classList.add("d-none");
  try {
    await addDoc(collection(db, "users", activeUserId, "todos"), {
      title,
      completed: false,
      createdAt: Date.now(),
    });
    input.value = "";
    input.focus();
  } catch (error) {
    showError(error);
  } finally {
    submitButton.disabled = false;
  }
});

list.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLButtonElement)) {
    return;
  }
  const { action, id } = target.dataset;
  if (!id || !activeUserId) {
    return;
  }

  const todoRef = doc(db, "users", activeUserId, "todos", id);
  message.classList.add("d-none");
  try {
    if (action === "toggle" && target instanceof HTMLInputElement) {
      await updateDoc(todoRef, { completed: target.checked });
    } else if (action === "delete") {
      await deleteDoc(todoRef);
    }
  } catch (error) {
    showError(error);
  }
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    return;
  }
  activeUserId = user.uid;
  document.getElementById("greeting-text").textContent = user.email ?? "Signed in";
  onSnapshot(
    collection(db, "users", user.uid, "todos"),
    renderTodos,
    showError,
  );
});
