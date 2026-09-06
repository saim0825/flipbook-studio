import {env} from "cloudflare:workers";
import {getDb} from "../../../../db";
import {clients} from "../../../../db/schema";
import {eq} from "drizzle-orm";
import {createSession,verifyPassword} from "../../../auth";

export async function POST(request:Request){
  const {email,password}=await request.json() as {email?:string;password?:string};
  if(!email||!password)return Response.json({error:"Enter your email and password."},{status:400});
  let role:"admin"|"client"|null=null;
  if(email.toLowerCase()===env.ADMIN_EMAIL.toLowerCase()&&await verifyPassword(password,env.ADMIN_PASSWORD_HASH))role="admin";
  else{
    const row=await getDb().select().from(clients).where(eq(clients.email,email.toLowerCase())).get();
    if(row&&row.status==="active"&&await verifyPassword(password,row.passwordHash))role="client";
  }
  if(!role)return Response.json({error:"Incorrect email or password."},{status:401});
  const token=await createSession({email:email.toLowerCase(),role});
  return new Response(JSON.stringify({ok:true,role}),{headers:{"content-type":"application/json","set-cookie":`flipbook_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`}});
}
