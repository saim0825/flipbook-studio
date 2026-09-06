import {getBook,registerView} from "../../../../lib/book-store";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;const book=await getBook(id);
  if(!book||book.status!=="published"||book.privacy!=="public")return Response.json({error:"Book not found."},{status:404});
  const viewed=await registerView(id);return Response.json({book:viewed});
}
