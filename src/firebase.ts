// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDveP1OYfsFksFRVw4F5BpN5swSPhj9bFk",
    authDomain: "mediaeloranker.firebaseapp.com",
    projectId: "mediaeloranker",
    storageBucket: "mediaeloranker.appspot.com",
    messagingSenderId: "462390631636",
    appId: "1:462390631636:web:7b608c9dc079c6991faf41",
    measurementId: "G-EPF3BVN1JK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db=getFirestore(app);