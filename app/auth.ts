import {cookies} from "next/headers";
import {redirect} from "next/navigation";

export type Session={email:string;role:"admin"|"client"};
const encoder=new TextEncoder();
const bytes=(value:string)=>{const padded=value+"=".repeat((4-value.length%4)%4);return Uint8Array.from(atob(padded),c=>c.charCodeAt(0))};
const b64=(value:Uint8Array)=>btoa(String.fromCharCode(...value)).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");

async function signature(payload:string){
  const secret=process.env.SESSION_SECRET;
  if(!secret)throw new Error("SESSION_SECRET is not configured.");
  const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return b64(new Uint8Array(await crypto.subtle.sign("HMAC",key,encoder.encode(payload))));
}
export async function createSession(value:Session){
  const payload=b64(encoder.encode(JSON.stringify({...value,exp:Date.now()+1000*60*60*12})));
  return payload+"."+await signature(payload);
}
export async function readSession():Promise<Session|null>{
  const token=(await cookies()).get("flipbook_session")?.value;if(!token)return null;
  const [payload,sig]=token.split(".");if(!payload||!sig||await signature(payload)!==sig)return null;
  try{const data=JSON.parse(new TextDecoder().decode(bytes(payload.replaceAll("-","+").replaceAll("_","/"))));if(data.exp<Date.now())return null;return {email:data.email,role:data.role}}catch{return null}
}
export async function requireRole(role:"admin"|"client"|"either"){
  const session=await readSession();if(!session)redirect(role==="client"||role==="either"?"/login":"/admin-login");
  if(role!=="either"&&session.role!==role)redirect(session.role==="admin"?"/admin":"/client");
  return session;
}
export async function hashPassword(password:string,salt=crypto.randomUUID()){
  const key=await crypto.subtle.importKey("raw",encoder.encode(password),"PBKDF2",false,["deriveBits"]);
  const hash=new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:encoder.encode(salt),iterations:100000},key,256));
  return salt+":"+b64(hash);
}
export async function verifyPassword(password:string,stored:string){
  const salt=stored.split(":")[0];return await hashPassword(password,salt)===stored;
}
