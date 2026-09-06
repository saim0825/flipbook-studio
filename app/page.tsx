"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  MousePointer2,
  Maximize2,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  X,
  Search,
  Layers3,
  FileText,
  Image as ImageIcon,
  Grid2X2,
  Bookmark,
  ZoomIn,
  ZoomOut,
  Volume2,
  Play,
  Printer,
  MoreVertical,
  Home as HomeIcon,
} from "lucide-react";
type Status = "idle" | "reading" | "ready" | "error";
export default function Home() {
  const input = useRef<HTMLInputElement>(null),
    viewer = useRef<HTMLDivElement>(null),
    flip = useRef<any>(null),
    audio = useRef<HTMLAudioElement | null>(null),
    soundRef = useRef(true);
  const [status, setStatus] = useState<Status>("idle"),
    [error, setError] = useState(""),
    [name, setName] = useState(""),
    [count, setCount] = useState(0),
    [number, setNumber] = useState(1),
    [showUrl, setShowUrl] = useState(false),
    [url, setUrl] = useState(""),
    [thumbs, setThumbs] = useState<string[]>([]),
    [pageText, setPageText] = useState<string[]>([]),
    [bookmarked, setBookmarked] = useState<number[]>([]),
    [zoom, setZoom] = useState(1),
    [fileUrl, setFileUrl] = useState(""),
    [showThumbs, setShowThumbs] = useState(false),
    [soundOn, setSoundOn] = useState(true);
  const playFlipSound = useCallback(() => {
    if (!soundRef.current) return;
    try {
      const player = audio.current || new Audio("/page-turn.mp3");
      audio.current = player;
      player.volume = 0.8;
      player.currentTime = 0;
      void player.play();
    } catch {}
  }, []);
  const reset = useCallback(() => {
    flip.current?.destroy?.();
    flip.current = null;
    if (viewer.current) viewer.current.innerHTML = "";
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setStatus("idle");
    setError("");
    setName("");
    setCount(0);
    setNumber(1);
    setThumbs([]);
    setPageText([]);
    setBookmarked([]);
    setZoom(1);
    setFileUrl("");
    setShowThumbs(false);
  }, [fileUrl]);
  useEffect(() => () => flip.current?.destroy?.(), []);
  const load = useCallback(
    async (file: File) => {
      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        setError("Please choose a PDF file.");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError("This PDF is larger than 50 MB.");
        return;
      }
      setStatus("reading");
      setError("");
      setName(file.name.replace(/\.pdf$/i, ""));
      setFileUrl(URL.createObjectURL(file));
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() })
          .promise;
        if (!viewer.current) return;
        viewer.current.innerHTML = "";
        const pages: HTMLDivElement[] = [],
          preview: string[] = [],
          texts: string[] = [];
        for (let n = 1; n <= pdf.numPages; n++) {
          const source = await pdf.getPage(n),
            base = source.getViewport({ scale: 1 }),
            targetPixels = Math.min(
              2600,
              Math.max(1800, 900 * Math.min(2.5, window.devicePixelRatio || 1)),
            ),
            vp = source.getViewport({ scale: targetPixels / base.height }),
            page = document.createElement("div"),
            canvas = document.createElement("canvas");
          page.className = "book-page";
          page.dataset.density = "soft";
          canvas.width = Math.round(vp.width);
          canvas.height = Math.round(vp.height);
          canvas.ariaLabel = `Page ${n}`;
          page.appendChild(canvas);
          viewer.current.appendChild(page);
          pages.push(page);
          const context = canvas.getContext("2d")!;
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          await source.render({ canvas, canvasContext: context, viewport: vp })
            .promise;
          const thumb = document.createElement("canvas"),
            thumbVp = source.getViewport({ scale: 160 / base.width });
          thumb.width = Math.round(thumbVp.width);
          thumb.height = Math.round(thumbVp.height);
          await source.render({
            canvas: thumb,
            canvasContext: thumb.getContext("2d")!,
            viewport: thumbVp,
          }).promise;
          preview.push(thumb.toDataURL("image/jpeg", 0.78));
          const text = await source.getTextContent();
          texts.push(text.items.map((item: any) => item.str || "").join(" "));
        }
        const { PageFlip } = await import("page-flip"),
          c = pages[0].querySelector("canvas")!,
          mobile = matchMedia("(max-width: 700px)").matches,
          h = Math.min(mobile ? innerHeight - 105 : innerHeight - 125, mobile ? 900 : 1000);
        const instance = new PageFlip(viewer.current, {
          width: Math.round((h * c.width) / c.height),
          height: h,
          size: "stretch",
          minWidth: 260,
          maxWidth: 820,
          minHeight: 360,
          maxHeight: 1100,
          showCover: true,
          mobileScrollSupport: false,
          drawShadow: !mobile,
          maxShadowOpacity: mobile ? 0 : 0.78,
          usePortrait: true,
          flippingTime: 1150,
          swipeDistance: 18,
        });
        instance.loadFromHTML(pages);
        instance.on("flip", (e: any) => {
          setNumber(Number(e.data) + 1);
          playFlipSound();
        });
        flip.current = instance;
        setCount(pdf.numPages);
        setThumbs(preview);
        setPageText(texts);
        setStatus("ready");
      } catch (e) {
        console.error(e);
        setError("The PDF may be damaged or password protected.");
        setStatus("error");
      }
    },
    [playFlipSound],
  );
  const choose = (files?: FileList | null) => files?.[0] && load(files[0]);
  const loadUrl = async () => {
    try {
      setError("");
      const response = await fetch(url);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      await load(new File([blob], "flipbook.pdf", { type: "application/pdf" }));
    } catch {
      setError(
        "That PDF URL could not be opened. Please upload the file instead.",
      );
    }
  };
  const findText = () => {
    const q = window.prompt("Search inside this PDF");
    if (!q) return;
    const found = pageText.findIndex((t) =>
      t.toLowerCase().includes(q.toLowerCase()),
    );
    if (found < 0) return window.alert("No matching text was found.");
    flip.current?.flip(found);
    setNumber(found + 1);
  };
  if (status !== "idle")
    return (
      <main className="reader guestReader">
        {status === "ready" && (
          <div className="viewerTools">
            <button
              className={showThumbs ? "active" : ""}
              aria-expanded={showThumbs}
              onClick={() => setShowThumbs((v) => !v)}
            >
              <Grid2X2 />
              Thumbnails
            </button>
            <button onClick={findText}>
              <Search />
              Search
            </button>
            <button
              className={bookmarked.includes(number) ? "active" : ""}
              onClick={() =>
                setBookmarked((v) =>
                  v.includes(number)
                    ? v.filter((n) => n !== number)
                    : [...v, number],
                )
              }
            >
              <Bookmark />
              Bookmark
            </button>
            <button
              onClick={() => document.documentElement.requestFullscreen?.()}
            >
              <Maximize2 />
              Fullscreen
            </button>
          </div>
        )}
        <div className="readerBody">
          {status === "ready" && showThumbs && (
            <aside className="thumbRail">
              {thumbs.map((src, i) => (
                <button
                  key={i}
                  className={number === i + 1 ? "selected" : ""}
                  onClick={() => flip.current?.flip(i)}
                >
                  <img src={src} alt={`Page ${i + 1}`} />
                  <span>{i + 1}</span>
                </button>
              ))}
            </aside>
          )}
          <section className="stage">
            {status === "reading" && (
              <div className="message">
                <LoaderCircle className="spin" />
                <h1>Creating your flipbook</h1>
                <p>Rendering every page for smooth turning.</p>
              </div>
            )}
            {status === "error" && (
              <div className="message">
                <h1>PDF could not be opened</h1>
                <p>{error}</p>
                <button className="primary" onClick={reset}>
                  Choose another PDF
                </button>
              </div>
            )}
            {status === "ready" && (
              <button
                className="pageArrow prev"
                onClick={() => flip.current?.flipPrev()}
              >
                <ChevronLeft />
              </button>
            )}
            <div
              ref={viewer}
              style={{ transform: `scale(${zoom})` }}
              className={status === "ready" ? "book" : "book hidden"}
            />
            {status === "ready" && (
              <button
                className="pageArrow next"
                onClick={() => flip.current?.flipNext()}
              >
                <ChevronRight />
              </button>
            )}
          </section>
        </div>
        {status === "ready" && (
          <div className="viewerBottom">
            <span>
              {number} - {Math.min(number + 1, count)} / {count}
            </span>
            <button onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}>
              <ZoomOut />
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}>
              <ZoomIn />
            </button>
            <button
              onClick={() => document.documentElement.requestFullscreen?.()}
            >
              <Maximize2 />
            </button>
            <button
              className={soundOn ? "soundOn" : ""}
              aria-label={soundOn ? "Turn page sound off" : "Turn page sound on"}
              title={soundOn ? "Sound on" : "Sound off"}
              onClick={() =>
                setSoundOn((value) => {
                  soundRef.current = !value;
                  return !value;
                })
              }
            >
              <Volume2 />
            </button>
            <button
              onClick={() => {
                let p = number;
                const timer = setInterval(() => {
                  if (p >= count) {
                    clearInterval(timer);
                    return;
                  }
                  flip.current?.flipNext();
                  p++;
                }, 2200);
              }}
            >
              <Play />
              Autoplay
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(location.href)}
            >
              <Share2 />
              Embed
            </button>
            <a href={fileUrl} download={`${name}.pdf`}>
              <Download />
              Download
            </a>
            <button onClick={() => window.print()}>
              <Printer />
              Print
            </button>
          </div>
        )}
        <div className="swipeHint">
          <MousePointer2 />
          <span>
            Drag or swipe
            <br />
            to turn
          </span>
        </div>
      </main>
    );
  const uploadButton = (
    <button className="primary" onClick={() => input.current?.click()}>
      Upload PDF
    </button>
  );
  const uploader = (
    <div
      className="upload"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        choose(e.dataTransfer.files);
      }}
    >
      {uploadButton}
      <p>or drop a file</p>
      <button className="urlLink" onClick={() => setShowUrl((v) => !v)}>
        paste PDF URL
      </button>
      {showUrl && (
        <div className="urlRow">
          <input
            aria-label="PDF URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/file.pdf"
          />
          <button onClick={loadUrl}>Open</button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
  return (
    <main>
      <input
        ref={input}
        type="file"
        accept=".pdf,application/pdf"
        onChange={(e) => choose(e.target.files)}
        hidden
      />
      <nav className="nav wrap">
        <a className="brand" href="#top">
          <BookOpen />
          <b>FlipBook</b>
        </a>
        <div>
          <a href="#top">Home</a>
          <a href="#features">Features</a>
          <a className="clientLogin" href="/login">Client Login</a>
          <button onClick={() => input.current?.click()}>
            Create Flipbook
          </button>
        </div>
      </nav>
      <section className="hero wrap" id="top">
        <div>
          <h1>
            Turn Your PDF Into a<br />
            Realistic Flipbook
          </h1>
          <p>
            Create an interactive, book-like reading
            <br />
            experience in seconds.
          </p>
        </div>
        {uploader}
      </section>
      <section className="pageTurn" id="features">
        <div className="wrap center">
          <span className="eyebrow">INTERACTIVE READING</span>
          <h2>Beautiful, Realistic Page Turning</h2>
          <p>
            Transform your static PDF into a lifelike flipbook with smooth page
            turns,
            <br />
            shadows and a natural reading experience.
          </p>
          <div className="showcaseFrame">
            <img
              src="/reference-assets/page-turn-showcase-v2.png"
              alt="Flat PDF compared with a realistic page-turning flipbook"
            />
            <span className="badge flat">PDF (Flat)</span>
            <span className="badge realistic">FlipBook (Realistic)</span>
            <span className="compareArrow">
              <ChevronLeft />
              <ChevronRight />
            </span>
          </div>
        </div>
      </section>
      <section className="possibilities">
        <div className="wrap possibilitiesGrid">
          <div>
            <span className="eyebrow">MORE THAN A READER</span>
            <h2>
              One Tool, Endless
              <br />
              Possibilities
            </h2>
            <p>
              Turn your PDFs into engaging flipbooks for any purpose. Whether
              you’re sharing publications, showcasing products, or presenting
              your work, FlipBook makes it simple and beautiful.
            </p>
          </div>
          <div className="useCases">
            <article>
              <BookOpen />
              <div>
                <h3>Magazines</h3>
                <p>Bring your publications to life</p>
              </div>
            </article>
            <article>
              <FileText />
              <div>
                <h3>Catalogs</h3>
                <p>Showcase your products beautifully</p>
              </div>
            </article>
            <article>
              <ImageIcon />
              <div>
                <h3>Portfolios</h3>
                <p>Present your work with impact</p>
              </div>
            </article>
          </div>
        </div>
      </section>
      <section className="devices wrap center">
        <span className="eyebrow">READ ANYWHERE</span>
        <h2>Looks Great on Every Device</h2>
        <p>
          Your flipbooks look stunning and work smoothly on desktop, tablet, and
          mobile.
        </p>
        <img
          src="/reference-assets/device-showcase-v2.png"
          alt="Flipbook displayed on desktop, tablet and mobile devices"
        />
        <div className="deviceCaptions">
          <div>
            <b>Desktop</b>
            <span>
              A rich, immersive reading experience
              <br />
              on larger screens.
            </span>
          </div>
          <div>
            <b>Tablet</b>
            <span>
              Smooth and responsive
              <br />
              on tablets.
            </span>
          </div>
          <div>
            <b>Mobile</b>
            <span>
              Take your flipbooks
              <br />
              anywhere.
            </span>
          </div>
        </div>
      </section>
      <section className="essentials wrap center">
        <span className="eyebrow">ALL THE ESSENTIALS</span>
        <h2>Everything You Need</h2>
        <p>Powerful features, a seamless experience.</p>
        <div className="cards">
          <article>
            <Layers3 />
            <h3>Realistic Page Flip</h3>
            <p>Natural page turning with smooth animations</p>
          </article>
          <article>
            <MousePointer2 />
            <h3>Mouse & Touch Control</h3>
            <p>Works perfectly with mouse, touch and swipe</p>
          </article>
          <article>
            <Search />
            <h3>Zoom & Fullscreen</h3>
            <p>Let readers zoom in and view in fullscreen</p>
          </article>
          <article>
            <Search />
            <h3>Search Inside PDF</h3>
            <p>Find content quickly</p>
          </article>
          <article>
            <Share2 />
            <h3>Share & Embed</h3>
            <p>Easily share or embed on your website</p>
          </article>
          <article>
            <Download />
            <h3>Download</h3>
            <p>Keep a copy of your flipbook offline</p>
          </article>
        </div>
      </section>
      <section className="create center">
        <span className="eyebrow">GET STARTED</span>
        <h2>Create Your Flipbook</h2>
        <p>Upload your PDF and turn it into a realistic flipbook in seconds.</p>
        <div className="miniUpload">{uploader}</div>
      </section>
      <footer className="sitefooter">
        <div className="wrap footerGrid">
          <div>
            <span className="brand">
              <BookOpen />
              <b>FlipBook</b>
            </span>
            <p>
              Turn your PDFs into beautiful,
              <br />
              interactive flipbooks.
            </p>
          </div>
          <div>
            <b>Product</b>
            <a href="#top">Home</a>
            <a href="#features">Features</a>
          </div>
          <div>
            <b>Resources</b>
            <span>Blog</span>
            <span>Guides</span>
            <span>API</span>
          </div>
          <div>
            <b>Support</b>
            <span>Contact</span>
            <span>Status</span>
            <span>Feedback</span>
          </div>
          <div>
            <b>Company</b>
            <span>About</span>
            <span>Careers</span>
            <span>Press</span>
          </div>
        </div>
        <div className="wrap footerBottom">
          <span>© 2026 FlipBook</span>
          <span>Terms &nbsp;&nbsp; Privacy</span>
          <span>● &nbsp; in &nbsp; ▶ &nbsp; ◉</span>
        </div>
      </footer>
    </main>
  );
}
