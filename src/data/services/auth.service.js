import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../core/firebase';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  /**
   * Login using Email and Password
   */
  loginWithEmail: async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await authService.getUserProfile(userCredential.user.uid);
    return { user: userCredential.user, profile: userDoc };
  },

  /**
   * Register a new user using Email and Password, creating a profile in Firestore
   */
  registerWithEmail: async (email, password, displayName, role = 'siswa') => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name in Firebase Auth
    await updateProfile(user, { displayName });

    // Create profile doc in Firestore
    const profile = {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      role: role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', user.uid), profile);
    return { user, profile };
  },

  /**
   * Login/Register using Google OAuth
   */
  loginWithGoogle: async (role = 'siswa') => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;

    // Check if user profile already exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    let profile;

    if (!userDocSnap.exists()) {
      // Create new profile for Google user with selected role
      profile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Pengguna Baru',
        role: role, // Use passed role
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(userDocRef, profile);
    } else {
      profile = userDocSnap.data();
      // Untuk kemudahan testing MVP: Update role jika role yang dipilih berbeda
      if (profile.role !== role) {
        profile.role = role;
        profile.updatedAt = serverTimestamp();
        await setDoc(userDocRef, { role: role, updatedAt: serverTimestamp() }, { merge: true });
      }
    }

    return { user, profile };
  },

  /**
   * Logout current user
   */
  logout: async () => {
    await signOut(auth);
  },

  /**
   * Get user profile details (especially role) from Firestore
   */
  getUserProfile: async (uid) => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  }
};
