import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Platform, Advice } from '../types';

interface FirebaseContextType {
  user: User | null;
  loadingAuth: boolean;
  platforms: Platform[];
  loadingPlatforms: boolean;
  signUpWithEmail: (email: string, password: string, firstName: string, lastName: string, username: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  addPlatform: (name: string, url: string, description: string, category: string, imageUrl: string) => Promise<void>;
  editPlatform: (id: string, name: string, url: string, description: string, category: string, imageUrl: string) => Promise<void>;
  deletePlatform: (id: string) => Promise<void>;
  toggleUpvote: (platformId: string) => Promise<void>;
  addAdvice: (platformId: string, content: string) => Promise<void>;
  deleteAdvice: (platformId: string, adviceId: string) => Promise<void>;
  submitHeuristicRating: (platformId: string, ratings: any, comment?: string) => Promise<void>;
  userUpvotes: { [platformId: string]: boolean };
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);
  const [userUpvotes, setUserUpvotes] = useState<{ [platformId: string]: boolean }>({});

  // 1. Monitor Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  // 2. Fetch/Seed and sync Platforms Dynamically
  useEffect(() => {
    const platformsRef = collection(db, 'platforms');
    const q = query(platformsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        setPlatforms([]);
        setLoadingPlatforms(false);
        return;
      }

      const list: Platform[] = [];
      for (const d of snapshot.docs) {
        const data = d.data();
        if (data.ownerId === 'system') {
          continue; // Simply filter them out so they are never displayed on the page
        }
        list.push({
          id: d.id,
          name: data.name,
          url: data.url,
          description: data.description,
          category: data.category,
          imageUrl: data.imageUrl,
          voteCount: data.voteCount || 0,
          ownerId: data.ownerId,
          ownerName: data.ownerName,
          createdAt: data.createdAt ? (data.createdAt.seconds * 1000) : Date.now(),
        });
      }
      setPlatforms(list);
      setLoadingPlatforms(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'platforms');
    });

    return unsubscribe;
  }, [user]);

  // 3. Keep track of user's personal vote status for fast UI toggle buttons
  useEffect(() => {
    if (!user) {
      setUserUpvotes({});
      return;
    }

    // Let's dynamically check upvotes across all platforms for this authenticated user
    const upvotesMap: { [platformId: string]: boolean } = {};
    const checkVotes = async () => {
      try {
        const platformsSnap = await getDocs(collection(db, 'platforms'));
        for (const pDoc of platformsSnap.docs) {
          const voteDocRef = doc(db, 'platforms', pDoc.id, 'upvotes', user.uid);
          const voteSnap = await getDocs(query(collection(db, 'platforms', pDoc.id, 'upvotes'), where('userId', '==', user.uid)));
          if (!voteSnap.empty) {
            upvotesMap[pDoc.id] = true;
          }
        }
        setUserUpvotes(upvotesMap);
      } catch (err) {
        console.error("Error reading pre-existing user upvotes:", err);
      }
    };

    checkVotes();
  }, [user, platforms.length]); // Re-evaluate when user toggles or length updates

  // Email & Password Sign Up with Custom Verification Data
  const signUpWithEmail = async (email: string, password: string, firstName: string, lastName: string, username: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await updateProfile(currentUser, {
        displayName: fullName
      });

      // Save additional user info in Firestore users collection
      await setDoc(doc(db, 'users', currentUser.uid), {
        uid: currentUser.uid,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        createdAt: new Date().toISOString()
      });
      
      setUser({
        ...currentUser,
        displayName: fullName
      } as any);
    } catch (error) {
      console.error("Sign up failed:", error);
      throw error;
    }
  };

  // Email & Password Sign In
  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    }
  };

  // Password Recovery Reset Link
  const recoverPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password recovery failure:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  // Seeding Function - 3 Arabic high-quality startup directories with perfect formatting
  const seedDefaultPlatforms = async () => {
    const collectionRef = collection(db, 'platforms');
    console.log("Seeding default Arabic platforms inside earnest-velocity-b5xj8");

    const samples = [
      {
        name: "حسوب للعمل الحر",
        url: "https://hassoub.com",
        description: "أكبر شبكة للمستقلين المحترفين في الوطن العربي لتقديم مختلف الخدمات وتطوير المشاريع البرمجية والتسويقية والترجمية بشكل متكامل. - تم إدخال ميزة الدفع السحابي الآمن الجديد وتحسين واجهة تصفح المعارض للمستقلين وتطوير نظام المراسلة الفوري. - v3.4.1",
        category: "إنتاجية وتوظيف",
        imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
        voteCount: 38,
        ownerId: "system",
        ownerName: "إدارة النظام",
        createdAt: serverTimestamp()
      },
      {
        name: "برنامج ألف ياء للحسابات",
        url: "https://alefyae.com",
        description: "برنامج فواتير ومحاسبة سحابي مبسط مصمم خصيصاً للشركات الصغيرة والمستقلين العرب لحساب الضرائب والمدفوعات والمبيعات من أي مكان بشكل مركب. - واجهة محاسبية متطورة متوافقة تماماً مع معايير الفوترة الإلكترونية السعودية ومصرفية مباشرة. - v2.10.8",
        category: "تجارة وأعمال",
        imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
        voteCount: 24,
        ownerId: "system",
        ownerName: "إدارة النظام",
        createdAt: serverTimestamp()
      },
      {
        name: "أكاديمية حاسوب للتطوير البرمجي",
        url: "https://academy.hsoub.com",
        description: "منصة تعليمية تقدم مئات المقالات والدروس المتخصصة والكتب البرمجية عالية الجودة باللغة العربية مع مسارات مهنية ودورات تدريبية مكثفة. - إعلان مسار تعلم الذكاء الاصطناعي وتطوير النماذج التوليدية وإضافة ورش تفاعلية حية. - v4.0.0",
        category: "تعليم وتقنية",
        imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
        voteCount: 49,
        ownerId: "system",
        ownerName: "إدارة النظام",
        createdAt: serverTimestamp()
      }
    ];

    for (const sample of samples) {
      const docId = sample.name.replace(/\s+/g, '-').toLowerCase();
      // Write safely with a deterministic matching ID
      await setDoc(doc(db, 'platforms', docId), sample);
    }
  };

  // Add platform action
  const addPlatform = async (name: string, url: string, description: string, category: string, imageUrl: string) => {
    if (!user) {
      throw new Error("يجب تسجيل الدخول لإضافة منصة جديدة.");
    }
    const path = 'platforms';
    try {
      // Generate a clean safe unique alphanumeric Firestore ID to satisfy security rules (^[a-zA-Z0-9_\-]+$)
      const platformDocRef = doc(collection(db, path));
      await setDoc(platformDocRef, {
        name: name.trim(),
        url: url.trim(),
        description: description.trim(),
        category: category,
        imageUrl: imageUrl.trim() || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
        voteCount: 0,
        ownerId: user.uid,
        ownerName: user.displayName || "عضو مسجل",
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  // Edit platform action
  const editPlatform = async (id: string, name: string, url: string, description: string, category: string, imageUrl: string) => {
    if (!user) {
      throw new Error("يجب تسجيل الدخول أولاً.");
    }
    const path = `platforms/${id}`;
    try {
      await updateDoc(doc(db, 'platforms', id), {
        name: name.trim(),
        url: url.trim(),
        description: description.trim(),
        category: category,
        imageUrl: imageUrl.trim()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Delete platform
  const deletePlatform = async (id: string) => {
    if (!user) {
      throw new Error("يجب تسجيل الدخول أولاً.");
    }
    const path = `platforms/${id}`;
    try {
      await deleteDoc(doc(db, 'platforms', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  // Upvote/Downvote atomic toggle transaction to guarantee state safety
  const toggleUpvote = async (platformId: string) => {
    if (!user) {
      throw new Error("يجب تسجيل الدخول أولاً للمشاركة بالتصويت.");
    }
    
    const platformRef = doc(db, 'platforms', platformId);
    const voteRef = doc(db, 'platforms', platformId, 'upvotes', user.uid);
    const path = `platforms/${platformId}/upvotes/${user.uid}`;

    try {
      await runTransaction(db, async (transaction) => {
        const voteSnap = await transaction.get(voteRef);
        const platformSnap = await transaction.get(platformRef);

        if (!platformSnap.exists()) {
          throw new Error("المنصة غير موجودة!");
        }

        const isUpvoted = voteSnap.exists();
        const currentVotes = platformSnap.data().voteCount || 0;

        if (isUpvoted) {
          // Remove Upvote
          transaction.delete(voteRef);
          transaction.update(platformRef, { 
            voteCount: Math.max(0, currentVotes - 1) 
          });
          setUserUpvotes(prev => ({ ...prev, [platformId]: false }));
        } else {
          // Add Upvote
          transaction.set(voteRef, {
            userId: user.uid,
            createdAt: serverTimestamp()
          });
          transaction.update(platformRef, { 
            voteCount: currentVotes + 1 
          });
          setUserUpvotes(prev => ({ ...prev, [platformId]: true }));
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  // Add advice to a subcollection
  const addAdvice = async (platformId: string, content: string) => {
    if (!user) {
      throw new Error("يجب تسجيل الدخول لكتابة نصائح.");
    }
    const path = `platforms/${platformId}/advices`;
    try {
      await addDoc(collection(db, 'platforms', platformId, 'advices'), {
        content: content.trim(),
        authorId: user.uid,
        authorName: user.displayName || "عضو متفاعل",
        authorPhoto: user.photoURL || "",
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  // Delete advice
  const deleteAdvice = async (platformId: string, adviceId: string) => {
    if (!user) {
      throw new Error("يجب تسجيل الدخول لحذف النصيحة.");
    }
    const path = `platforms/${platformId}/advices/${adviceId}`;
    try {
      await deleteDoc(doc(db, 'platforms', platformId, 'advices', adviceId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  // Submit heuristic evaluation rating
  const submitHeuristicRating = async (platformId: string, ratings: any, comment?: string) => {
    if (!user) {
      throw new Error("يجب تسجيل الدخول لتقديم التقييم.");
    }
    const path = `platforms/${platformId}/heuristic_ratings/${user.uid}`;
    try {
      await setDoc(doc(db, 'platforms', platformId, 'heuristic_ratings', user.uid), {
        userId: user.uid,
        userName: user.displayName || "عضو مسجل",
        ratings: ratings,
        comment: comment?.trim() || "",
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  return (
    <FirebaseContext.Provider value={{
      user,
      loadingAuth,
      platforms,
      loadingPlatforms,
      signUpWithEmail,
      signInWithEmail,
      recoverPassword,
      signOut,
      addPlatform,
      editPlatform,
      deletePlatform,
      toggleUpvote,
      addAdvice,
      deleteAdvice,
      submitHeuristicRating,
      userUpvotes
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
