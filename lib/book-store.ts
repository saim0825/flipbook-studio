import {redisCommand} from "./client-store";

export type StoredBook={
  id:string;
  ownerEmail:string;
  title:string;
  pdfUrl:string;
  pathname:string;
  size:number;
  background:string;
  sound:boolean;
  download:boolean;
  privacy:"public"|"private";
  status:"draft"|"published";
  views:number;
  createdAt:string;
  updatedAt:string;
};

const BOOKS_KEY="flipbook:books";
const ALL_BOOKS_KEY="flipbook:book-ids";
const ownerKey=(email:string)=>`flipbook:books:owner:${email.trim().toLowerCase()}`;

export async function saveBook(book:StoredBook){
  await redisCommand<number>("HSET",BOOKS_KEY,book.id,JSON.stringify(book));
  await redisCommand<number>("SADD",ALL_BOOKS_KEY,book.id);
  await redisCommand<number>("SADD",ownerKey(book.ownerEmail),book.id);
  return book;
}

export async function getBook(id:string){
  const raw=await redisCommand<string|null>("HGET",BOOKS_KEY,id);
  return raw?JSON.parse(raw) as StoredBook:null;
}

export async function listBooks(ownerEmail?:string){
  const ids=await redisCommand<string[]>("SMEMBERS",ownerEmail?ownerKey(ownerEmail):ALL_BOOKS_KEY);
  const books=(await Promise.all((ids??[]).map(getBook))).filter(Boolean) as StoredBook[];
  return books.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}

export async function updateBook(id:string,changes:Partial<Pick<StoredBook,"title"|"background"|"sound"|"download"|"privacy"|"status">>){
  const book=await getBook(id);if(!book)return null;
  return saveBook({...book,...changes,updatedAt:new Date().toISOString()});
}

export async function removeBook(id:string){
  const book=await getBook(id);if(!book)return null;
  await redisCommand<number>("HDEL",BOOKS_KEY,id);
  await redisCommand<number>("SREM",ALL_BOOKS_KEY,id);
  await redisCommand<number>("SREM",ownerKey(book.ownerEmail),id);
  return book;
}

export async function registerView(id:string){
  const book=await getBook(id);if(!book)return null;
  book.views+=1;book.updatedAt=new Date().toISOString();
  await redisCommand<number>("HSET",BOOKS_KEY,id,JSON.stringify(book));
  return book;
}
