import { auth, db } from "./firebase.config.js";

import {
  setDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

let isAuthenticating = false;
const page = document.body.dataset.page;
const showMessage = (message) => {
  const messageElement = document.getElementById("auth-message");
  if (messageElement) {
    messageElement.textContent = message;
    messageElement.classList.remove("d-none");
  }
};

const setFormBusy = (form, isBusy) => {
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = isBusy;
    submitButton.textContent = isBusy ? "Please wait..." : submitButton.dataset.label;
  }
};

onAuthStateChanged(auth, (user) => {
  if (isAuthenticating) {
    return;
  }

  if (user && page !== "dashboard") {
    const dashboardPath = page === "home"
      ? "./dashboard/dashboard.html"
      : "../dashboard/dashboard.html";
    window.location.replace(dashboardPath);
  } else if (!user && page === "dashboard") {
    window.location.replace("../login/login.html");
  }
});

const login = async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  setFormBusy(form, true);

  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById("login-email").value.trim(),
      document.getElementById("login-password").value,
    );
    window.location.href = "../dashboard/dashboard.html";
  } catch (error) {
    showMessage(error.message);
    setFormBusy(form, false);
  }
};

const register = async (e) => {
  e.preventDefault();
  isAuthenticating = true;
  const form = e.currentTarget;
  setFormBusy(form, true);

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      document.getElementById("register-email").value.trim(),
      document.getElementById("register-password").value,
    );
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      uid: user.uid,
    });
    window.location.href = "../dashboard/dashboard.html";
  } catch (error) {
    showMessage(error.message);
    setFormBusy(form, false);
  } finally {
    isAuthenticating = false;
  }
};

const logout = async () => {
  try {
    await signOut(auth);
    window.location.replace("../login/login.html");
  } catch (error) {
    const messageElement = document.getElementById("dashboard-message");
    if (messageElement) {
      messageElement.textContent = error.message;
      messageElement.classList.remove("d-none");
    }
  }
};

document.getElementById("login-form")?.addEventListener("submit", login);
document.getElementById("register-form")?.addEventListener("submit", register);
document.getElementById("logout")?.addEventListener("click", logout);
