import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot, orderBy, limit, addDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signIn = () => signInWithPopup(auth, googleProvider);

export const loginWithCredentials = async (username: string, pass: string) => {
  if (username === 'affnfc' && pass === 'aff123') {
    // Chúng ta sử dụng một email cụ thể cho tài khoản admin này. 
    // Nếu mật khẩu thay đổi trong mã nguồn, chúng ta thay đổi hậu tố email để "reset" tài khoản trong Firebase Auth.
    const email = 'affnfc_v2@app.com'; 
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      return userCredential;
    } catch (error: any) {
      // Nếu đăng nhập thất bại, có thể là do người dùng chưa tồn tại
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
          await updateProfile(userCredential.user, { displayName: 'AFFNFC Admin' });
          return userCredential;
        } catch (createError: any) {
          // Nếu tạo thất bại vì email đã được sử dụng, nghĩa là mật khẩu trong Firebase khác.
          if (createError.code === 'auth/email-already-in-use') {
             throw new Error('Tài khoản admin đã tồn tại với mật khẩu khác. Vui lòng liên hệ hỗ trợ hoặc thử lại.');
          }
          throw createError;
        }
      }
      throw error;
    }
  }
  throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác');
};

export const logOut = () => signOut(auth);

// Kiểm tra kết nối
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
