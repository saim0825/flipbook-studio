import {head} from "@vercel/blob";
import {readSession} from "../../../auth";
import {saveBook} from "../../../../lib/book-store";

export async function POST(request:Request){
  const session=await readSession();if(!session)return Response.json({error:"Unauthorized"},{status:401});
  const body=await request.json() as {id?:string;title?:string;pdfUrl?:string;pathname?:string};
  if(!body.id||!body.pdfUrl||!body.pathname||!body.pathname.startsWith(`books/${body.id}/`))return Response.json({error:"Invalid upload."},{status:400});
  const metadata=await head(body.pdfUrl);const now=new Date().toISOString();
  const book=await saveBook({id:body.id,ownerEmail:session.email,title:(body.title||"Untitled Flipbook").slice(0,120),pdfUrl:body.pdfUrl,pathname:body.pathname,size:metadata.size,background:"#eaf2f9",sound:true,download:true,privacy:"public",status:"draft",views:0,createdAt:now,updatedAt:now});
  return Response.json({book});
}
