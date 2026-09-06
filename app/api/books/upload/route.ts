import {handleUpload, type HandleUploadBody} from "@vercel/blob/client";
import {readSession} from "../../../auth";

export async function POST(request:Request){
  try{
    const body=await request.json() as HandleUploadBody;
    const json=await handleUpload({
      request,
      body,
      onBeforeGenerateToken:async(pathname,clientPayload)=>{
        const session=await readSession();
        if(!session)throw new Error("Unauthorized");
        const input=JSON.parse(clientPayload||"{}") as {id?:string;title?:string};
        if(!input.id||!pathname.startsWith(`books/${input.id}/`))throw new Error("Invalid upload path");
        return {
          allowedContentTypes:["application/pdf"],
          maximumSizeInBytes:100*1024*1024,
          addRandomSuffix:true,
          tokenPayload:JSON.stringify({id:input.id,title:(input.title||"Untitled Flipbook").slice(0,120),ownerEmail:session.email}),
        };
      },
    });
    return Response.json(json);
  }catch(error){
    console.error("[books/upload]",error);
    return Response.json({error:error instanceof Error?error.message:"Upload failed."},{status:400});
  }
}
