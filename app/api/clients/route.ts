import {hashPassword,readSession} from "../../auth";
import {createClient,deleteClient,listClients} from "../../../lib/client-store";

async function admin(){return (await readSession())?.role==="admin"}
export async function GET(){if(!await admin())return Response.json({error:"Unauthorized"},{status:401});return Response.json({clients:await listClients()})}
export async function POST(request:Request){
 if(!await admin())return Response.json({error:"Unauthorized"},{status:401});
 const {name,email,password}=await request.json() as {name?:string;email?:string;password?:string};
 if(!name||!email||!password||password.length<8)return Response.json({error:"Name, email and a password of at least 8 characters are required."},{status:400});
 try{const result=await createClient({name,email,passwordHash:await hashPassword(password)});return Response.json({client:result,loginUrl:"/login"},{status:201})}catch(error){return Response.json({error:error instanceof Error?error.message:"Unable to create client."},{status:409})}
}
export async function DELETE(request:Request){
 if(!await admin())return Response.json({error:"Unauthorized"},{status:401});
 const id=Number(new URL(request.url).searchParams.get("id"));if(!id)return Response.json({error:"Client not found."},{status:400});
 await deleteClient(id);return Response.json({ok:true});
}
