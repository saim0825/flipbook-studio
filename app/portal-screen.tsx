"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  CloudUpload,
  Code2,
  Copy,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Home,
  Lock,
  LogOut,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Upload,
  Users,
} from "lucide-react";

type Screen =
  | "admin"
  | "login"
  | "admin-login"
  | "upload"
  | "customize"
  | "clients"
  | "client"
  | "settings"
  | "privacy"
  | "terms";

function Brand() {
  return (
    <a className="portalBrand" href="/">
      <BookOpen />
      <b>FlipBook</b>
    </a>
  );
}
function Side({
  active,
  client = false,
}: {
  active: string;
  client?: boolean;
}) {
  const items = client
    ? [
        ["/client", "Dashboard", Home],
        ["/client", "My Flipbooks", BookOpen],
        ["/settings", "Profile", Settings],
      ]
    : [
        ["/admin", "Dashboard", Home],
        ["/admin", "My Flipbooks", BookOpen],
        ["/clients", "Clients", Users],
        ["/upload", "Upload PDF", Upload],
        ["/settings", "Settings", Settings],
      ];
  return (
    <aside className="portalSide">
      <Brand />
      <nav>
        {items.map(([href, label, Icon]: any) => (
          <a
            key={label}
            className={active === label ? "active" : ""}
            href={href}
          >
            <Icon />
            {label}
          </a>
        ))}
      </nav>
      <div className="sideBottom">
        <a href="/">
          <Eye />
          View Website
        </a>
        <button
          className="logoutButton"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            location.href = "/login";
          }}
        >
          <LogOut />
          Sign out
        </button>
        <span className="avatar">{client ? "C" : "A"}</span>
        <div>
          <b>{client ? "Client Account" : "Aziz"}</b>
          <small>{client ? "Client" : "Administrator"}</small>
        </div>
      </div>
    </aside>
  );
}
function Top({ title }: { title: string }) {
  return (
    <header className="portalTop">
      <h2>{title}</h2>
      <label className="portalSearch">
        <Search />
        <input placeholder="Search flipbooks..." />
      </label>
      <button className="iconButton" aria-label="Notifications">
        <Bell />
      </button>
      <a className="blueButton small" href="/upload">
        <Plus />
        Upload PDF
      </a>
    </header>
  );
}
function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <article className="statCard">
      <span className={tone || ""}>
        <Icon />
      </span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
      </div>
    </article>
  );
}
type PortalBook={id:string;title:string;pdfUrl:string;views:number;status:string;ownerEmail:string;createdAt:string;background:string;sound:boolean;download:boolean;privacy:string};
function BookCards({ client = false, onChange }: { client?: boolean;onChange?:()=>void }) {
  const [books,setBooks]=useState<PortalBook[]>([]),[message,setMessage]=useState("");
  const load=()=>fetch("/api/books").then(r=>r.ok?r.json():{books:[]}).then(d=>setBooks(d.books||[]));
  useEffect(()=>{void load()},[]);
  const copy=async(value:string,label:string)=>{await navigator.clipboard.writeText(value);setMessage(`${label} copied.`);setTimeout(()=>setMessage(""),1800)};
  const remove=async(id:string)=>{if(!confirm("Delete this flipbook permanently?"))return;const r=await fetch(`/api/books?id=${id}`,{method:"DELETE"});if(!r.ok)return alert("The book could not be deleted.");await load();onChange?.()};
  return (
    <><div className="bookCards realBooks">
      {books.map((book) => (
        <article key={book.title}>
          <div className="cover">
            <span>
              {book.title}
            </span>
          </div>
          <b>{book.title}</b>
          <small>
            <i /> {book.status} · {book.views} views
          </small>
          <div className="bookActions">
            <a href={`/book/${book.id}`} target="_blank"><Eye/>View</a>
            <button onClick={()=>copy(`${location.origin}/book/${book.id}`,"Share link")}><Copy/>Share</button>
            <button onClick={()=>copy(`<iframe src="${location.origin}/embed/${book.id}" width="100%" height="700" frameborder="0" allow="fullscreen"></iframe>`,"Embed code")}><Code2/>Embed</button>
            <a href={`/customize?id=${book.id}`}><Pencil/>Edit</a>
            <button className="deleteBook" onClick={()=>remove(book.id)}><Trash2/>Delete</button>
          </div>
        </article>
      ))}
      {!books.length&&<div className="emptyBooks"><BookOpen/><b>No flipbooks yet</b><span>Upload your first PDF to publish it here.</span><a className="blueButton small" href="/upload">Upload PDF</a></div>}
    </div>{message&&<div className="copyToast">{message}</div>}</>
  );
}

function Login({ admin = false }: { admin?: boolean }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="loginPage">
      <Brand />
      <form
        className="loginCard"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const form = new FormData(e.currentTarget);
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              email: form.get("email"),
              password: form.get("password"),
            }),
          });
          const data = await response.json();
          setBusy(false);
          if (!response.ok) return setError(data.error || "Sign in failed.");
          if (admin && data.role !== "admin")
            return setError("This account does not have administrator access.");
          if (!admin && data.role !== "client")
            return setError("Please use the administrator login page.");
          window.location.assign(admin ? "/admin" : "/client");
        }}
      >
        <h1>{admin ? "Admin Login" : "Client Login"}</h1>
        <p>
          {admin
            ? "Sign in to manage the complete website."
            : "Sign in to view your assigned flipbooks."}
        </p>
        <label>
          Email Address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder={admin ? "Administrator email" : "Client email"}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
          />
        </label>
        <div className="remember">
          <label>
            <input type="checkbox" defaultChecked /> Remember me
          </label>
          <button
            type="button"
            onClick={() =>
              setError(
                admin
                  ? "Use your administrator password."
                  : "Contact the administrator to reset your password.",
              )
            }
          >
            Forgot password?
          </button>
        </div>
        {error && <p className="formError">{error}</p>}
        <button className="blueButton" disabled={busy} type="submit">
          {busy
            ? "Signing in..."
            : admin
              ? "Enter Admin Dashboard"
              : "Enter Client Panel"}
        </button>
        <small>
          {admin
            ? "Administrator access only."
            : "Your access is created by the administrator."}
        </small>
      </form>
      <footer>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </footer>
    </main>
  );
}
function Dashboard() {
  const [rows, setRows] = useState<
    Array<{ id: number; name: string; email: string; status: string }>
  >([]),[bookRows,setBookRows]=useState<PortalBook[]>([]);
  useEffect(() => {
    fetch("/api/clients")
      .then((r) => (r.ok ? r.json() : { clients: [] }))
      .then((d) => setRows(d.clients || []));
  }, []);
  useEffect(()=>{fetch("/api/books").then(r=>r.ok?r.json():{books:[]}).then(d=>setBookRows(d.books||[]))},[]);
  return (
    <Shell active="Dashboard" title="Dashboard">
      <section className="welcome">
        <h1>Welcome back, Aziz</h1>
        <p>Manage your flipbooks, clients, and engage your audience.</p>
      </section>
      <div className="stats">
        <Stat icon={BookOpen} label="Total Flipbooks" value={String(bookRows.length)} />
        <Stat icon={Users} label="Total Clients" value={String(rows.length)} />
        <Stat icon={Eye} label="Total Views" value={String(bookRows.reduce((n,b)=>n+b.views,0))} />
        <Stat icon={FileText} label="Storage" value="Vercel Blob" />
      </div>
      <Panel title="My Flipbooks" action="View All">
        <BookCards />
      </Panel>
      <Panel title="Clients" action="+ Add Client">
        <ClientTable rows={rows} />
      </Panel>
    </Shell>
  );
}
function UploadPage() {
  const input = useRef<HTMLInputElement>(null),
    [file, setFile] = useState<File | null>(null),
    [progress, setProgress] = useState(0),
    router = useRouter(),
    [uploadError,setUploadError]=useState(""),
    [busy,setBusy]=useState(false);
  const choose = async (f?: File) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf"))
      return alert("Please choose a PDF file.");
    if(f.size>100*1024*1024)return alert("This PDF is larger than 100 MB.");
    setFile(f);setProgress(4);setBusy(true);setUploadError("");
    const id=crypto.randomUUID(),title=f.name.replace(/\.pdf$/i,"");
    try{const blob=await upload(`books/${id}/${f.name}`,f,{access:"public",handleUploadUrl:"/api/books/upload",clientPayload:JSON.stringify({id,title}),onUploadProgress:p=>setProgress(Math.round(p.percentage))});const finalized=await fetch("/api/books/finalize",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id,title,pdfUrl:blob.url,pathname:blob.pathname})});if(!finalized.ok)throw new Error("The upload completed but the book could not be saved.");setProgress(100);router.push(`/customize?id=${id}`)}
    catch(e){console.error(e);setUploadError(e instanceof Error?e.message:"Upload failed.");setBusy(false)}
  };
  return (
    <Shell active="Upload PDF" title="Upload PDF">
      <section className="welcome">
        <h1>Upload PDF</h1>
        <p>Turn your PDF into an engaging flipbook in just a few steps.</p>
      </section>
      <div className="steps">
        <b className="active">
          1<span>Upload</span>
        </b>
        <i />
        <b>
          2<span>Customize</span>
        </b>
        <i />
        <b>
          3<span>Publish</span>
        </b>
      </div>
      <div className="uploadGrid">
        <div
          className="dropLarge"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            choose(e.dataTransfer.files[0]);
          }}
        >
          <CloudUpload />
          <h2>Drop your PDF here</h2>
          <p>or click to browse from your device</p>
          <button className="blueButton" disabled={busy} onClick={() => input.current?.click()}>
            {busy?"Uploading…":"Choose PDF"}
          </button>
          <input
            ref={input}
            hidden
            type="file"
            accept=".pdf"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <small>Maximum file size: 100 MB</small>
        </div>
        <aside className="tips">
          <h3>Tips for a great flipbook</h3>
          <p>
            <FileText />
            <span>
              <b>Use PDF files only</b>
              <small>
                We currently support PDF files for the best experience.
              </small>
            </span>
          </p>
          <p>
            <SlidersHorizontal />
            <span>
              <b>Optimize your images</b>
              <small>
                Use high-quality, optimized images for clearer text.
              </small>
            </span>
          </p>
          <p>
            <Lock />
            <span>
              <b>No password protection</b>
              <small>Make sure your PDF is not password protected.</small>
            </span>
          </p>
        </aside>
      </div>
      {file && (
        <div className="progressCard">
          <b>{file.name}</b>
          <div>
            <i style={{ width: `${progress}%` }} />
          </div>
          <span>{progress}%</span>
        </div>
      )}
      {uploadError&&<p className="formError">{uploadError}</p>}
    </Shell>
  );
}
function Customize() {
  const [id,setId]=useState(""),
    [title, setTitle] = useState("Untitled Flipbook"),
    [color, setColor] = useState("#eef8ff"),
    [sound, setSound] = useState(true),
    [download, setDownload] = useState(true),
    [privacy,setPrivacy]=useState<"public"|"private">("public"),
    [saving,setSaving]=useState(false),
    router = useRouter();
  useEffect(()=>{const bookId=new URLSearchParams(location.search).get("id")||"";setId(bookId);if(bookId)fetch("/api/books").then(r=>r.json()).then(d=>{const b=(d.books||[]).find((x:PortalBook)=>x.id===bookId);if(b){setTitle(b.title);setColor(b.background);setSound(b.sound);setDownload(b.download);setPrivacy(b.privacy as "public"|"private")}})},[]);
  return (
    <Shell active="My Flipbooks" title="Customize Flipbook">
      <div className="steps wide">
        <b>
          <Check />
          <span>
            Upload PDF<small>Completed</small>
          </span>
        </b>
        <i />
        <b className="active">
          2
          <span>
            Customize<small>In progress</small>
          </span>
        </b>
        <i />
        <b>
          3
          <span>
            Publish<small>Next</small>
          </span>
        </b>
      </div>
      <div className="customizeGrid">
        <div className="bookPreview" style={{ background: color }}>
          <div className="previewBook">
            <section>
              <b>
                Summer
                <br />
                Catalog
              </b>
              <small>2026</small>
            </section>
            <section>
              <b>
                Beautiful
                <br />
                Destinations
              </b>
              <small>Explore remarkable places</small>
            </section>
          </div>
          <small>1 / 12</small>
        </div>
        <aside className="customPanel">
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Background Color
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </label>
          <Switch label="Page Flip Sound" value={sound} set={setSound} />
          <Switch label="Allow Download" value={download} set={setDownload} />
          <label>
            Privacy
            <select value={privacy} onChange={e=>setPrivacy(e.target.value as "public"|"private")}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          <div className="success">
            <Check /> Looks great!
            <small>Your flipbook is ready to be published.</small>
          </div>
          <button
            className="blueButton"
            disabled={saving||!id}
            onClick={async()=>{setSaving(true);const response=await fetch("/api/books",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id,title,background:color,sound,download,privacy,status:"published"})});setSaving(false);if(!response.ok)return alert("The flipbook could not be published.");alert("Flipbook published successfully.");const me=await fetch("/api/auth/me").then(r=>r.json());router.push(me.role==="client"?"/client":"/admin")}}
          >
            {saving?"Publishing…":"Publish Flipbook"}
          </button>
        </aside>
      </div>
    </Shell>
  );
}
function Clients() {
  type Row = {
    id: number;
    name: string;
    email: string;
    status: string;
    createdAt?: string;
  };
  const [query, setQuery] = useState(""),
    [rows, setRows] = useState<Row[]>([]),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [notice, setNotice] = useState("");
  const load = async () => {
    const response = await fetch("/api/clients");
    if (response.ok) setRows((await response.json()).clients);
  };
  useEffect(() => {
    void load();
  }, []);
  const filtered = useMemo(
    () =>
      rows.filter((c) =>
        (c.name + c.email).toLowerCase().includes(query.toLowerCase()),
      ),
    [query, rows],
  );
  const add = async () => {
    setNotice("");
    const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      }),
      data = await response.json();
    if (!response.ok) return setNotice(data.error);
    setNotice(
      `Client created. Send ${email} the login page and the password you entered.`,
    );
    setName("");
    setEmail("");
    setPassword("");
    await load();
  };
  const remove = async (id: number) => {
    if (!confirm("Remove this client and block their access?")) return;
    await fetch(`/api/clients?id=${id}`, { method: "DELETE" });
    await load();
  };
  return (
    <Shell active="Clients" title="Clients">
      <div className="clientStats">
        <Stat icon={Users} label="Total Clients" value={String(rows.length)} />
        <Stat
          icon={Check}
          label="Active Clients"
          value={String(rows.filter((r) => r.status === "active").length)}
        />
        <Stat
          icon={Lock}
          label="Suspended Clients"
          value={String(rows.filter((r) => r.status !== "active").length)}
        />
      </div>
      <div className="clientLayout">
        <section className="clientList">
          <label className="portalSearch">
            <Search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients..."
            />
          </label>
          <ClientTable rows={filtered} onRemove={remove} />
        </section>
        <aside className="managePanel">
          <h3>Add Client</h3>
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Client name"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
            />
          </label>
          <label>
            Temporary Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </label>
          <label>
            Permission Level
            <select>
              <option>View & Download</option>
              <option>View only</option>
            </select>
          </label>
          {notice && <p className="clientNotice">{notice}</p>}
          <button className="blueButton" onClick={add}>
            Create Client Access
          </button>
          <small className="accessHelp">
            The client signs in at <b>/login</b> and is automatically sent to
            their panel.
          </small>
        </aside>
      </div>
    </Shell>
  );
}
function ClientDashboard() {
  const [email, setEmail] = useState("Client"),[bookRows,setBookRows]=useState<PortalBook[]>([]);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.email && setEmail(d.email));
  }, []);
  useEffect(()=>{fetch("/api/books").then(r=>r.ok?r.json():{books:[]}).then(d=>setBookRows(d.books||[]))},[]);
  return (
    <Shell active="Dashboard" title={`Welcome, ${email}`} client>
      <div className="stats two">
        <Stat icon={BookOpen} label="Your Flipbooks" value={String(bookRows.length)} />
        <Stat icon={Eye} label="Total Views" value={String(bookRows.reduce((n,b)=>n+b.views,0))} />
      </div>
      <Panel title="Your Flipbooks">
        <BookCards client />
      </Panel>
      <div className="helpBox">
        Need another flipbook?{" "}
        <span> Contact your administrator.</span>
      </div>
    </Shell>
  );
}
function SettingsPage() {
  const [name, setName] = useState(() =>
      typeof window === "undefined"
        ? "FlipBook"
        : localStorage.getItem("website-name") || "FlipBook",
    ),
    [sound, setSound] = useState(true),
    [download, setDownload] = useState(true),
    [brand, setBrand] = useState(true);
  return (
    <Shell active="Settings" title="Settings">
      <div className="settingsCard">
        <div className="tabs">
          <b>General</b>
          <span>Viewer Defaults</span>
          <span>Account</span>
        </div>
        <label>
          Website Name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Website Logo
          <div className="logoField">
            <Brand />
            <button>Change Logo</button>
          </div>
        </label>
        <label>
          Website URL
          <input defaultValue="https://flipbook-studio-blond.vercel.app" readOnly />
        </label>
        <div className="fieldRow">
          <label>
            Default Language
            <select>
              <option>English</option>
            </select>
          </label>
          <label>
            Default Privacy
            <select>
              <option>Public</option>
              <option>Private</option>
            </select>
          </label>
        </div>
        <Switch
          label="Allow PDF Downloads"
          value={download}
          set={setDownload}
        />
        <Switch label="Enable Page Flip Sound" value={sound} set={setSound} />
        <Switch label="Show FlipBook Branding" value={brand} set={setBrand} />
        <footer>
          <button>Cancel</button>
          <button
            className="blueButton"
            onClick={() => {
              localStorage.setItem("website-name", name);
              alert("Settings saved.");
            }}
          >
            Save Changes
          </button>
        </footer>
      </div>
    </Shell>
  );
}
function Legal({ terms = false }: { terms?: boolean }) {
  return (
    <main className="legalPage">
      <header>
        <Brand />
        <nav>
          <a href="/">Home</a>
          <a href="/#features">Features</a>
        </nav>
        <a className="blueButton small" href="/">
          + Create Flipbook
        </a>
      </header>
      <div className="legalBody">
        <aside>
          <b>Legal</b>
          {[
            "Introduction",
            "Information We Collect",
            "Uploaded Documents",
            "How We Use Data",
            "Data Storage",
            "Your Rights",
            "Contact",
          ].map((x) => (
            <a href={"#" + x.replaceAll(" ", "-")} key={x}>
              {x}
            </a>
          ))}
        </aside>
        <article>
          <h1>{terms ? "Terms of Service" : "Privacy Policy"}</h1>
          <small>Last updated: September 6, 2026</small>
          <div className="legalNote">
            <Lock /> Your uploaded PDFs remain private unless you choose to
            publish them.
          </div>
          {(terms
            ? [
                [
                  "1. Acceptance",
                  "By using FlipBook, you agree to these terms and the responsible use of the service.",
                ],
                [
                  "2. Your Content",
                  "You retain ownership of documents you upload. You must have permission to publish and share them.",
                ],
                [
                  "3. Account Use",
                  "Keep your account details secure and provide accurate information.",
                ],
                [
                  "4. Service Availability",
                  "We work to keep FlipBook reliable, secure, and available across supported devices.",
                ],
              ]
            : [
                [
                  "1. Introduction",
                  "FlipBook values your privacy. This policy explains how we collect, use, store, and protect your information when you use our website and services.",
                ],
                [
                  "2. Information We Collect",
                  "We collect information you provide directly, such as your name, email address, and account details. We also collect limited usage information to improve the service.",
                ],
                [
                  "3. Uploaded Documents",
                  "The PDF you upload is processed and stored securely and remains private by default. We only make documents publicly accessible when you choose to publish them.",
                ],
                [
                  "4. How We Use Data",
                  "We use your information to provide, maintain, and improve FlipBook, communicate with you, and ensure the security and reliability of our services.",
                ],
              ]
          ).map(([h, p]) => (
            <section id={h.split(". ")[1].replaceAll(" ", "-")} key={h}>
              <h2>{h}</h2>
              <p>{p}</p>
            </section>
          ))}
        </article>
      </div>
      <footer>
        © 2026 FlipBook. All rights reserved.
        <span>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </span>
      </footer>
    </main>
  );
}
function Shell({
  active,
  title,
  client = false,
  children,
}: {
  active: string;
  title: string;
  client?: boolean;
  children: any;
}) {
  return (
    <main className="portalPage">
      <Side active={active} client={client} />
      <div className="portalMain">
        <Top title={title} />
        <div className="portalContent">{children}</div>
      </div>
    </main>
  );
}
function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: string;
  children: any;
}) {
  return (
    <section className="panel">
      <header>
        <h3>{title}</h3>
        {action && (
          <a href={action.startsWith("+") ? "/clients" : "/admin"}>
            {action}
            <ChevronRight />
          </a>
        )}
      </header>
      {children}
    </section>
  );
}
function ClientTable({
  rows = [],
  onRemove,
}: {
  rows?: Array<{
    id?: number;
    name: string;
    email: string;
    books?: number;
    status: string;
  }>;
  onRemove?: (id: number) => void;
}) {
  return (
    <div className="clientTable">
      <header>
        <span>Client</span>
        <span>Email</span>
        <span>Flipbooks</span>
        <span>Status</span>
        <span>Action</span>
      </header>
      {rows.map((c) => (
        <div key={c.email}>
          <b>
            <i>{c.name[0]}</i>
            {c.name}
          </b>
          <span>{c.email}</span>
          <span>{c.books ?? 0}</span>
          <em>
            <i /> {c.status}
          </em>
          {c.id && onRemove ? (
            <button className="removeClient" onClick={() => onRemove(c.id!)}>
              Remove
            </button>
          ) : (
            <span>—</span>
          )}
        </div>
      ))}
    </div>
  );
}
function Switch({
  label,
  value,
  set,
}: {
  label: string;
  value: boolean;
  set: (v: boolean) => void;
}) {
  return (
    <label className="switchRow">
      <span>{label}</span>
      <button
        className={value ? "on" : ""}
        onClick={() => set(!value)}
        type="button"
      >
        <i />
      </button>
    </label>
  );
}
export default function PortalScreen({ screen }: { screen: Screen }) {
  if (screen === "login") return <Login />;
  if (screen === "admin-login") return <Login admin />;
  if (screen === "admin") return <Dashboard />;
  if (screen === "upload") return <UploadPage />;
  if (screen === "customize") return <Customize />;
  if (screen === "clients") return <Clients />;
  if (screen === "client") return <ClientDashboard />;
  if (screen === "settings") return <SettingsPage />;
  return <Legal terms={screen === "terms"} />;
}
