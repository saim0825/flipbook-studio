import {eq} from "drizzle-orm";
import {getDb} from "../../../db";
import {clients} from "../../../db/schema";
import {hashPassword,readSession} from "../../auth";

async function admin(){return (await readSession())?.role==="admin"}
export async function GET(){if(!await admin())return Response.json({error:"Unauthorized"},{status:401});const rows=await getDb().select({id:clients.id,name:clients.name,email:clients.email,status:clients.status,createdAt:clients.createdAt}).from(clients).all();return Response.json({clients:rows})}
export async function POST(request:Request){
 if(!await admin())return Response.json({error:"Unauthorized"},{status:401});
 const {name,email,password}=await request.json() as {name?:string;email?:string;password?:string};
 if(!name||!email||!password||password.length<8)return Response.json({error:"Name, email and a password of at least 8 characters are required."},{status:400});
 try{const result=await getDb().insert(clients).values({name,email:email.toLowerCase(),passwordHash:await hashPassword(password),status:"active",createdAt:new Date().toISOString()}).returning({id:clients.id,name:clients.name,email:clients.email,status:clients.status}).get();return Response.json({client:result,loginUrl:"/login"},{status:201})}catch{return Response.json({error:"A client with this email already exists."},{status:409})}
}
export async function DELETE(request:Request){
 if(!await admin())return Response.json({error:"Unauthorized"},{status:401});
 const id=Number(new URL(request.url).searchParams.get("id"));if(!id)return Response.json({error:"Client not found."},{status:400});
 await getDb().delete(clients).where(eq(clients.id,id));return Response.json({ok:true});
}
