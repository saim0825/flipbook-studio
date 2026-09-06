export type StoredClient={
  id:number;
  name:string;
  email:string;
  passwordHash:string;
  status:"active"|"disabled";
  createdAt:string;
};

const CLIENTS_KEY="flipbook:clients";
const EMAILS_KEY="flipbook:client-emails";
const COUNTER_KEY="flipbook:client-counter";

function config(){
  const url=process.env.UPSTASH_REDIS_REST_URL??process.env.KV_REST_API_URL;
  const token=process.env.UPSTASH_REDIS_REST_TOKEN??process.env.KV_REST_API_TOKEN;
  if(!url||!token)throw new Error("Client database is not configured.");
  return {url:url.replace(/\/$/,""),token};
}

export async function redisCommand<T>(...args:Array<string|number>):Promise<T>{
  const {url,token}=config();
  const response=await fetch(url,{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},body:JSON.stringify(args),cache:"no-store"});
  if(!response.ok)throw new Error("Client database request failed.");
  const payload=await response.json() as {result:T;error?:string};
  if(payload.error)throw new Error(payload.error);
  return payload.result;
}

export async function listClients(){
  const values=await redisCommand<Array<string>>("HVALS",CLIENTS_KEY);
  return (values??[]).map(value=>JSON.parse(value) as StoredClient).map(({passwordHash:_,...client})=>client).sort((a,b)=>b.id-a.id);
}

export async function findClientByEmail(email:string){
  const normalized=email.trim().toLowerCase();
  const id=await redisCommand<string|null>("HGET",EMAILS_KEY,normalized);
  if(!id)return null;
  const value=await redisCommand<string|null>("HGET",CLIENTS_KEY,id);
  return value?JSON.parse(value) as StoredClient:null;
}

export async function createClient(input:{name:string;email:string;passwordHash:string}){
  const email=input.email.trim().toLowerCase();
  if(await redisCommand<string|null>("HGET",EMAILS_KEY,email))throw new Error("A client with this email already exists.");
  const id=Number(await redisCommand<number>("INCR",COUNTER_KEY));
  const client:StoredClient={id,name:input.name.trim(),email,passwordHash:input.passwordHash,status:"active",createdAt:new Date().toISOString()};
  await redisCommand<number>("HSET",CLIENTS_KEY,String(id),JSON.stringify(client));
  await redisCommand<number>("HSET",EMAILS_KEY,email,String(id));
  const {passwordHash:_,...safeClient}=client;
  return safeClient;
}

export async function deleteClient(id:number){
  const value=await redisCommand<string|null>("HGET",CLIENTS_KEY,String(id));
  if(!value)return;
  const client=JSON.parse(value) as StoredClient;
  await redisCommand<number>("HDEL",CLIENTS_KEY,String(id));
  await redisCommand<number>("HDEL",EMAILS_KEY,client.email);
}
