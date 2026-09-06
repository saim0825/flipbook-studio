import {handleUploadPresigned, type HandleUploadPresignedBody} from "@vercel/blob/client";
import {issueSignedToken} from "@vercel/blob";
import {readSession} from "../../../auth";

export async function POST(request:Request){
  try{
    const body=await request.json() as HandleUploadPresignedBody;
    const json=await handleUploadPresigned({
      request,
      body,
      getSignedToken:async(pathname,clientPayload)=>{
        const session=await readSession();
        if(!session)throw new Error("Unauthorized");
        const input=JSON.parse(clientPayload||"{}") as {id?:string;title?:string};
        if(!input.id||!pathname.startsWith(`books/${input.id}/`))throw new Error("Invalid upload path");
        return {
          token:await issueSignedToken({pathname,operations:["put"],allowedContentTypes:["application/pdf"],maximumSizeInBytes:100*1024*1024,validUntil:Date.now()+15*60*1000}),
          urlOptions:{allowedContentTypes:["application/pdf"],maximumSizeInBytes:100*1024*1024,addRandomSuffix:true},
        };
      },
    });
    return Response.json(json);
  }catch(error){
    console.error("[books/upload]",error);
    return Response.json({error:error instanceof Error?error.message:"Upload failed."},{status:400});
  }
}
