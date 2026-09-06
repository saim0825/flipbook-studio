import {createSession,verifyPassword} from "../../../auth";
import {findClientByEmail} from "../../../../lib/client-store";

export async function POST(request:Request){
  const {email,password}=await request.json() as {email?:string;password?:string};
  if(!email||!password)return Response.json({error:"Enter your email and password."},{status:400});
  let role:"admin"|"client"|null=null;
  const adminEmail=process.env.ADMIN_EMAIL;
  const adminPasswordHash=process.env.ADMIN_PASSWORD_HASH;
  if(adminEmail&&adminPasswordHash&&email.toLowerCase()===adminEmail.toLowerCase()&&await verifyPassword(password,adminPasswordHash))role="admin";
  else{
    const row=await findClientByEmail(email);
    if(row&&row.status==="active"&&await verifyPassword(password,row.passwordHash))role="client";
  }
  if(!role)return Response.json({error:"Incorrect email or password."},{status:401});
  const token=await createSession({email:email.toLowerCase(),role});
  return new Response(JSON.stringify({ok:true,role}),{headers:{"content-type":"application/json","set-cookie":`flipbook_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`}});
}
