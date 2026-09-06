import {del} from "@vercel/blob";
import {readSession} from "../../auth";
import {getBook,listBooks,removeBook,updateBook} from "../../../lib/book-store";

export async function GET(){
  const session=await readSession();if(!session)return Response.json({error:"Unauthorized"},{status:401});
  return Response.json({books:await listBooks(session.role==="admin"?undefined:session.email)});
}
export async function PATCH(request:Request){
  const session=await readSession();if(!session)return Response.json({error:"Unauthorized"},{status:401});
  const body=await request.json() as {id?:string;title?:string;background?:string;sound?:boolean;download?:boolean;privacy?:"public"|"private";status?:"draft"|"published"};
  if(!body.id)return Response.json({error:"Book ID is required."},{status:400});
  const current=await getBook(body.id);if(!current)return Response.json({error:"Book not found."},{status:404});
  if(session.role!=="admin"&&current.ownerEmail!==session.email)return Response.json({error:"Forbidden"},{status:403});
  const {id,...changes}=body;
  return Response.json({book:await updateBook(id,changes)});
}
export async function DELETE(request:Request){
  const session=await readSession();if(!session)return Response.json({error:"Unauthorized"},{status:401});
  const id=new URL(request.url).searchParams.get("id");if(!id)return Response.json({error:"Book ID is required."},{status:400});
  const current=await getBook(id);if(!current)return Response.json({error:"Book not found."},{status:404});
  if(session.role!=="admin"&&current.ownerEmail!==session.email)return Response.json({error:"Forbidden"},{status:403});
  await del(current.pdfUrl);await removeBook(id);return Response.json({ok:true});
}
