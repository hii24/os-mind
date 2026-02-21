import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCE9qt3SBPEGQAM0L6Sl8VeIaNoR5gyqXk",
    authDomain: "os-mind.firebaseapp.com",
    projectId: "os-mind",
    storageBucket: "os-mind.firebasestorage.app",
    messagingSenderId: "935006326053",
    appId: "1:935006326053:web:1f1016703f418d61329ecc",
    measurementId: "G-HF4D736PZV"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

/**
 * Adds an email to the waitlist collection in Firestore
 * @param {string} email 
 * @returns {Promise<boolean>} success status
 */
export async function addEmailToWaitlist(email) {
    try {
        const waitlistRef = collection(db, "waitlist");
        await addDoc(waitlistRef, {
            email: email,
            timestamp: serverTimestamp(),
            source: "hero_form"
        });
        return true;
    } catch (e) {
        console.error("Error adding document: ", e);
        return false;
    }
}
