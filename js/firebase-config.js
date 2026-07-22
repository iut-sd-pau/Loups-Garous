/*
  ============================================================
  CONFIGURATION FIREBASE - A REMPLIR
  ============================================================
  1. Va sur https://console.firebase.google.com
  2. Cree un projet (gratuit, plan "Spark" suffit largement)
  3. Ajoute une "Web App" (icone </>)
  4. Copie la config qu'on te donne ici en dessous
  5. Dans "Build > Realtime Database", cree une base de donnees
     (choisis une region proche, ex: europe-west1)
  6. Onglet "Regles" de la Realtime Database, mets pour demarrer
     rapidement en dev (a restreindre plus tard si tu veux) :

     {
       "rules": {
         ".read": true,
         ".write": true
       }
     }

  C'est exactement le meme principe que pour FLASH BRAIN.
  ============================================================
*/

const firebaseConfig = {
  apiKey: "AIzaSyAvE5YsdpFVYcKxgPNMn_K51XHboD4_hF4",
  authDomain: "loups-c369f.firebaseapp.com",
  databaseURL: "https://loups-c369f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "loups-c369f",
  storageBucket: "loups-c369f.firebasestorage.app",
  messagingSenderId: "10392468397",
  appId: "1:10392468397:web:5ff6efe6cecb28df5a3f24"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
