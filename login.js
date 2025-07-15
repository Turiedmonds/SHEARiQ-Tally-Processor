// Firebase configuration 
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCuQh49AgKbrMvrxcuwsR8Svy86aP3Fg2Q",
  authDomain: "sheariq-tally-app.firebaseapp.com",
  projectId: "sheariq-tally-app",
  storageBucket: "sheariq-tally-app.firebasestorage.app",
  messagingSenderId: "201669876235",
  appId: "1:201669876235:web:379fc4035da99f4b09450e"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    await auth.signInWithEmailAndPassword(email, password);
    window.location.href = 'index.html';
  } catch (err) {
    alert(err.message);
  }
});
