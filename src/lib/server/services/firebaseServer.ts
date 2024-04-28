import { getAuth } from "firebase-admin/auth";
import admin from "firebase-admin";
import { initializeFirestore } from "firebase-admin/firestore";
import type { OutfitLayer, WardrobePackage } from "$src/data/common";
import { PACKAGE_TYPE } from "$src/data/consts";
import * as pixelmatch from "pixelmatch";
const firebaseConfig = {
  type: import.meta.env.VITE_SERVICE_TYPE,
  projectId: import.meta.env.VITE_PROJECT_ID,
  privateKeyId: import.meta.env.VITE_PRIVATE_KEY_ID,
  privateKey: import.meta.env.VITE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  clientEmail: import.meta.env.VITE_CLIENT_EMAIL,
  clientId: import.meta.env.VITE_CLIENT_ID,
  authUri: import.meta.env.VITE_AUTH_URI,
  tokenUri: import.meta.env.VITE_TOKEN_URI,
  authProviderX509CertUrl: import.meta.env.VITE_AUTH_PROVIDER_X509_CERT_URL,
  clientC509CertUrl: import.meta.env.VITE_CLIENT_X509_CERT_URL,
  universeDomain: import.meta.env.VITE_UNIVERSE_DOMAIN,
};
export const app =
  global.firebaseApp ??
  admin.initializeApp(
    {
      credential: admin.credential.cert(firebaseConfig),
    },
    "minerobe-server"
  );
global.firebaseApp = app;

const db = initializeFirestore(app);

export const AuthorizeViaFirebaseToken = async (token: string) => {
  try {
    const decodedToken = await getAuth(app).verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    return null;
  }
};
export const GetSecret = async function (
  path: string,
  documentName: string,
  token: string,
  user: string
): Promise<any> {
  const auth = await AuthorizeViaFirebaseToken(token);
  if (auth?.uid != null) {
    const dataRef = db.doc(path + "/" +auth.uid+"/"+ documentName);
    const dataSnap = await dataRef.get();
    const data = dataSnap.data();
    return data?.data;
  }
  return null;
};
export const SetSecret = async function (
  path: string,
  documentName: string,
  data: any,
  token: string
) {
  const auth = await AuthorizeViaFirebaseToken(token);
  if (auth?.uid != null) {
    const dataJson = JSON.parse(JSON.stringify(data));
    return await db.doc(path + "/"+auth.uid+"/" + documentName).set({ data: dataJson });
  }
  return null;
};
export const UpdateDocument = async function (
  path: string,
  documentName: string,
  data: any,
  token: string
) {
  const auth = await AuthorizeViaFirebaseToken(token);
  if (auth?.uid != null) {
    const dataJson = JSON.parse(JSON.stringify(data));
    return await db.doc(path + "/" + documentName).update(dataJson);
  }
  return null;
};
export const GetWardrobeSets = async function (user: string, token: string) {
  const token2 = await AuthorizeViaFirebaseToken(token);
  if (token2 == null) return null;
  const warrobeRef= db.collection("wardrobes").doc(user);
  const wardrobeSnap = await warrobeRef.get();
  const wardrobe = wardrobeSnap.data() as WardrobePackage;
  
  const sets = wardrobe.outfits.filter((x) => x.type == PACKAGE_TYPE.OUTFIT_SET_LINK);
  return sets;
}
export const FetchOutfitSetSnapshot = async function (user: string, token: string,id:string) 
{
  const token2 = await AuthorizeViaFirebaseToken(token);
  if (token2 == null) return null;
 
  const setsRef= db.collection("sets-new").doc(id).collection("snapshot").doc(id);
  const setsSnap = await setsRef.get();
  const setSnapshot = setsSnap.data() as OutfitLayer;
  return setSnapshot;
}