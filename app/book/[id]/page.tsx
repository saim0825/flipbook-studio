import {notFound} from "next/navigation";
import BookViewer from "../../book-viewer";
import {getBook,registerView} from "../../../lib/book-store";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const book=await getBook(id);if(!book||book.status!=="published"||book.privacy!=="public")notFound();await registerView(id);return <BookViewer book={book}/>}
