// src/utils/connectionChecks.js
import { getDocs, collection } from "firebase/firestore";

// Check database connection by attempting to fetch a sample collection
export async function checkDatabaseConnection(db) {
  try {
    await getDocs(collection(db, "users"));
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}

// Check internet connection stability
export async function checkInternetConnection() {
  if (!navigator.onLine) return false; // Initial offline check

  try {
    const response = await fetch("https://www.google.com/generate_204", {
      method: "HEAD",
      mode: "no-cors",
    });
    return response.ok;
  } catch (error) {
    console.error("Internet connection error:", error);
    return false;
  }
}

// Check query limit (e.g., by monitoring API call counts if available)
export async function checkQueryLimit(db) {
  try {
    // Here, add logic to monitor API usage, if Firebase or backend provides it
    // Placeholder, always return true for no limits:
    return true;
  } catch (error) {
    console.error("Query limit check error:", error);
    return false;
  }
}

// Monitor internet connection status changes in real time
export function listenForConnectionChanges(callback) {
  window.addEventListener("online", () => callback(true));
  window.addEventListener("offline", () => callback(false));
}