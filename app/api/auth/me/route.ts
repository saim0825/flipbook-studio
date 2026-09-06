import {readSession} from "../../../auth";
export async function GET(){const session=await readSession();return session?Response.json(session):Response.json({error:"Unauthorized"},{status:401})}
