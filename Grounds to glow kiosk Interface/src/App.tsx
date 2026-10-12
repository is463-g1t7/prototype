import { useEffect, useMemo, useState } from "react"
import QRCodeGenerator from "qrcode"
import { projectId, publicAnonKey } from "../utils/supabase/info"

type IconName = "arrow" | "bean" | "bottle" | "check" | "chevron" | "cup" | "id" | "leaf" | "message" | "minus" | "plus" | "scan" | "sparkle" | "sugar"

function Icon({ name, size = 24 }: { name: IconName size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    bean: (
      <>
        <path d="M17.5 4.5c3.3 3.3 1.4 9.2-2.1 12.7s-7.9 3.8-10.6 1.1C2 15.5 2.5 11 6 7.5s8.2-6.2 11.5-3Z" />
        <path d="M6.2 17.8c2.2-2.8 2.2-6.2 4.1-8.1s4.6-2.1 7.4-4.1" />
      </>
    ),
    bottle: (
      <>
        <path d="M9 3h6v4l2 2v11H7V9l2-2V3Z" />
        <path d="M9 6h6" />
        <path d="M10 12c2 1 2 3 4 4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    cup: (
      <>
        <path d="M6 5h11l-1 13H7L6 5Z" />
        <path d="M17 8h1a3 3 0 0 1 0 6h-2" />
        <path d="M8 2v3m4-3v3" />
      </>
    ),
    id: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="11" r="2" />
        <path d="M6 16c.8-2 5.2-2 6 0m3-5h3m-3 3h3" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 4C12 4 5 7 5 14c0 3 2 5 5 5 7 0 9-7 10-15Z" />
        <path d="M4 21c2-6 6-9 12-13" />
      </>
    ),
    message: (
      <>
        <path d="M21 14a4 4 0 0 1-4 4H9l-6 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7Z" />
        <path d="M8 9h8m-8 4h5" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    scan: (
      <>
        <path d="M8 3H4a1 1 0 0 0-1 1v4m13-5h4a1 1 0 0 1 1 1v4M8 21H4a1 1 0 0 1-1-1v-4m13 5h4a1 1 0 0 0 1-1v-4" />
        <path d="M7 12h10M8 8v8m3-8v8m4-8v8" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" />
        <path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z" />
      </>
    ),
    sugar: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      >
        {paths[name]}
      </g>
    </svg>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-11 place-items-center rounded-full bg-[#d96f42] text-white shadow-sm">
        <Icon name="bean" size={23} />
      </div>
      <div className="leading-none">
        <div className="font-display text-[1.35rem] font-semibold tracking-[-0.03em] text-[#2d3329]">
          Grounds to Glow
        </div>
        <div className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#7a806f]">
          Coffee scrub station
        </div>
      </div>
    </div>
  )
}

function TopBar({ step, onHome }: { step: number onHome: () => void }) {
  return (
    <header className="flex items-center justify-between px-8 py-5 lg:px-12">
      {/* LOGO */}
      <button
        aria-label="Return to welcome"
        className="cursor-pointer"
        onClick={onHome}
        type="button"
      >
        <Brand />
      </button>

      {/* STEP PROGRESS INDICATOR */}
      {step > 0 && step < 4 && (
        <div className="flex items-center gap-5">
          <span className="hidden text-sm font-semibold text-[#777b6e] sm:block">
            Step {step} of 3
          </span>

          <div className="flex gap-2" aria-label={`Step ${step} of 3`}>
            {[1, 2, 3].map((item) => (
              <span
                key={item}
                className={`h-2.5 rounded-full transition-all ${
                  item <= step ? "w-8 bg-[#d96f42]" : "w-2.5 bg-[#d9d8ce]"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

function PrimaryButton({
  children,
  disabled,
  onClick,
  className = "",
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      className={`group flex min-h-14 cursor-pointer items-center justify-center gap-3 rounded-full bg-[#2f382d] px-7 text-base font-bold text-white shadow-[0_10px_25px_rgba(47,56,45,0.18)] transition hover:-translate-y-0.5 hover:bg-[#20281f] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

// Drop-in replacement for `SectionHeading` + `Welcome` (no props, same call site).
// Delete the stray "Drop-in replacement" comment and the old `ingredients` array if still present.

function SectionHeading({
  title,
  intro,
  light = false,
}: {
  title: string
  intro?: string
  light?: boolean
}) {
  return (
    <div className="max-w-2xl">
      <h2
        className={`font-display text-3xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-4xl ${
          light ? "text-white" : "text-[#30372d]"
        }`}
      >
        {title}
      </h2>
      {intro && (
        <p
          className={`mt-3 text-base leading-relaxed ${
            light ? "text-white/65" : "text-[#7b8075]"
          }`}
        >
          {intro}
        </p>
      )}
    </div>
  )
}

function Welcome({ onStart }: { onStart: () => void }) {
  const steps: [string, string, IconName][] = [
    [
      "Collect",
      "Used coffee grounds are gathered from staff pantries across SMU’s seven buildings.",
      "cup",
    ],
    [
      "Deposit",
      "Coffee grounds are deposited in smart collection bins within each building.",
      "scan",
    ],
    [
      "Transport",
      "Volunteers bring the collected grounds to the Grounds to Glow kiosk.",
      "leaf",
    ],
    [
      "Prepare",
      "A solar dehydrator dries the coffee grounds before they are prepared for the scrubs.",
      "sparkle",
    ],
  ]

  const benefits: [string, string][] = [
    [
      "Exfoliation",
      "Helps remove dead skin cells, leaving the skin feeling smoother and softer.",
    ],
    [
      "Smoother skin appearance",
      "Exfoliation may temporarily improve the appearance and texture of the skin.",
    ],
    ["Antioxidants", "Coffee naturally contains antioxidant compounds."],
    [
      "Refreshing experience",
      "Coffee’s natural aroma makes the exfoliation process enjoyable.",
    ],
  ]

  return (
    <main className="flex flex-1 flex-col px-6 pb-12 sm:px-8 lg:px-12">
      {/* HERO SECTION */}
      <section className="py-12 lg:py-16">
        <div className="max-w-5xl">
          <h1 className="font-display text-[clamp(3.5rem,6.6vw,6.8rem)] font-medium leading-[0.95] tracking-[-0.055em] text-[#293027]">
            Grounds to <span className="italic text-[#d96f42]">Glow.</span>
          </h1>

          <p className="mt-7 max-w-4xl text-md leading-relaxed text-[#596052]">
            An initiative by{" "}
            <strong className="font-semibold text-[#3d4739]">
              SMU’s Office of Campus Infrastructure &amp; Services (OCIS)
            </strong>{" "}
            that aims to reduce campus waste, raise environmental awareness, and
            promote circularity within the SMU community by giving coffee
            grounds a second life.
          </p>

          {/* MAIN ACTION BUTTONS */}
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-3 rounded-full bg-[#30392d] px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#20281f]"
            >
              Make your coffee scrub
              <Icon name="arrow" size={18} />
            </button>
            <a
              href="#process"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#d96f42] px-7 py-3 text-sm font-semibold text-[#ffffff] transition hover:border-[#30392d] hover:bg-[#e9ede5]"
            >
              Explore how it works
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </section>

      {/* PROCESS SECTION */}
      <section
        id="process"
        className="scroll-mt-6 border-t border-[#dcddd4] py-12"
      >
        <SectionHeading title="From grounds to glow" />

        <ol className="mt-8 grid gap-4 md:grid-cols-2">
          {steps.map(([title, description, icon], index) => (
            <li
              key={title}
              className="rounded-[1.5rem] border border-[#dedfd7] bg-white p-6 shadow-sm"
            >
              {/* ICON, TITLE AND STEP NUMBER */}
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e5ede0] text-[#587353]">
                  <Icon name={icon} size={20} />
                </span>

                <h3 className="text-lg font-bold text-[#394136]">{title}</h3>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-[#7b8076]">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* BENEFITS SECTION */}
      <section
        aria-label="Coffee scrub benefits"
        className="mt-2 rounded-[1.5rem] bg-[#30392d] px-8 py-9 text-white sm:px-8 sm:py-8"
      >
        <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
          Benefits of coffee scrubs
        </h2>

        <div className="mt-6 grid gap-x-8 gap-y-6 md:grid-cols-2">
          {benefits.map(([title, description], index) => (
            <article key={title} className="flex items-start gap-3">
              <span className="font-display w-9 shrink-0 text-2xl text-[#ef9b73]">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div>
                <h3 className="text-sm font-bold text-white">{title}</h3>

                <p className="mt-1 text-sm leading-relaxed text-white/65">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function CheckIn({
  name,
  onName,
  onNext,
}: {
  name: string
  onName: (value: string) => void
  onNext: () => void
}) {
  const [scanning, setScanning] = useState(false)

  const scanStudentId = () => {
    setScanning(true)
    window.setTimeout(() => {
      onName("Julie Smith")
      setScanning(false)
    }, 1200)
  }

  return (
    <main className="grid flex-1 place-items-center px-6 pb-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2.5rem] bg-white shadow-[0_24px_80px_rgba(55,59,49,0.1)]">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative overflow-hidden bg-[#30392d] p-9 text-white lg:p-12">
            <div className="absolute -right-20 -top-16 size-64 rounded-full border-[45px] border-white/5" />
          </section>
          <section className="p-8 lg:p-12">
            <h2 className="font-display mt-3 text-5xl font-medium tracking-[-0.04em] text-[#2c332a]">
              What's your name?
            </h2>
            <label
              className="mt-9 block text-sm font-bold text-[#4e564a]"
              htmlFor="name"
            >
              Your name
            </label>
            <input
              autoFocus
              className="mt-3 h-16 w-full rounded-2xl border border-[#d9dbd1] bg-[#faf9f5] px-5 text-lg text-[#2c332a] outline-none transition placeholder:text-[#a5a89e] focus:border-[#d96f42] focus:ring-4 focus:ring-[#d96f42]/10"
              id="name"
              onChange={(event) => onName(event.target.value)}
              onKeyDown={(event) =>
                event.key === "Enter" && name.trim() && onNext()
              }
              placeholder="Enter your first name"
              value={name}
            />
            <div className="my-5 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.14em] text-[#a0a398]">
              <span className="h-px flex-1 bg-[#e4e4dc]" /> or{" "}
              <span className="h-px flex-1 bg-[#e4e4dc]" />
            </div>
            <button
              aria-busy={scanning}
              className={`flex h-16 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition ${
                scanning
                  ? "border-[#d96f42] bg-[#fff6ed] text-[#b35431]"
                  : "border-[#cfd2c7] text-[#555d50] hover:border-[#87917f] hover:bg-[#f8f8f3]"
              }`}
              disabled={scanning}
              onClick={scanStudentId}
              type="button"
            >
              <Icon name={scanning ? "scan" : "id"} />
              <span className="font-bold">
                {scanning ? "Scanning student ID…" : "Scan SMU ID barcode"}
              </span>
            </button>
            {name === "Julie Smith" && !scanning && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm font-bold text-[#587353]">
                <span className="grid size-6 place-items-center rounded-full bg-[#e5ede0]">
                  <Icon name="check" size={14} />
                </span>
                SMU ID scanned successfully
              </div>
            )}
            <PrimaryButton
              className="mt-7 w-full"
              disabled={!name.trim()}
              onClick={onNext}
            >
              Continue <Icon name="arrow" size={20} />
            </PrimaryButton>
          </section>
        </div>
      </div>
    </main>
  )
}

function ScannableQRCode({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState("")

  useEffect(() => {
    QRCodeGenerator.toDataURL(url, {
      color: { dark: "#283126", light: "#ffffff" },
      errorCorrectionLevel: "M",
      margin: 2,
      width: 640,
    }).then(setDataUrl)
  }, [url])

  return (
    <div className="aspect-square w-full bg-white p-2 shadow-sm">
      {dataUrl ? (
        <img
          alt="QR code to open the Grounds to Glow AI guide"
          className="size-full"
          src={dataUrl}
        />
      ) : (
        <div className="grid size-full place-items-center text-sm text-[#777c72]">
          Generating code…
        </div>
      )}
    </div>
  )
}

const chatbotUrl =
  "https://cdn.botpress.cloud/webchat/v5.0/shareable.html?configUrl=https://files.bpcontent.cloud/2026/10/10/11/20261010113458-RXOET722.json"

// Drop-in replacement for the `Guide` function (same props: name, onNext).

function Guide({
  name,
  onNext,
}: {
  name: string
  onNext: (quiz: boolean) => void
}) {
  const [scanState, setScanState] = useState<"idle" | "scanning" | "chat">(
    "idle",
  )

  useEffect(() => {
    if (scanState !== "scanning") return
    const timer = window.setTimeout(() => setScanState("chat"), 1200)
    return () => window.clearTimeout(timer)
  }, [scanState])

  return (
    <>
      <main className="flex flex-1 items-center px-6 py-10 lg:px-16">
        <div className="mx-auto w-full max-w-5xl">
          {/* GREETING */}
          <div className="mb-10 text-center">
            <h1 className="font-display text-[clamp(3rem,5vw,5rem)] font-medium leading-[1.05] tracking-[-0.05em] text-[#293027]">
              Hi {name}, <span className="italic text-[#d96f42]">welcome.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-[#6a7064]">
              Ask our AI guide a question or take a short skincare quiz. When
              you’re ready, choose your recipe and make your scrub.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* QR CODE CARD */}
            <section className="flex flex-col items-center rounded-[2rem] border border-[#dedfd7] bg-white p-8 text-center shadow-[0_22px_70px_rgba(55,59,49,0.08)] sm:p-10">
              <h2 className="font-display mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#30372d]">
                Grounds to Glow AI
              </h2>

              <button
                aria-label="Scan QR code to open Grounds to Glow AI"
                className="mt-6 w-full max-w-[210px] cursor-pointer rounded-3xl border border-[#e4e5dc] bg-[#faf9f5] p-3 transition hover:-translate-y-1 hover:border-[#d96f42]"
                onClick={() => setScanState("scanning")}
                type="button"
              >
                <div className="overflow-hidden rounded-2xl">
                  <ScannableQRCode url={chatbotUrl} />
                </div>
              </button>

              <p className="mt-6 max-w-sm text-sm leading-relaxed text-[#747a6d]">
                Scan to learn about our initiative, ask questions about coffee
                scrubs, or take a skincare quiz.
              </p>
            </section>

            {/* MAKE COFFEE SCRUB CARD */}
            <section className="relative flex flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-[#30392d] p-8 text-center text-white shadow-[0_24px_70px_rgba(47,56,45,0.22)] sm:p-10">
              <div
                aria-hidden
                className="absolute -right-20 -top-24 size-64 rounded-full border-[45px] border-white/5"
              />
              <div
                aria-hidden
                className="absolute -bottom-24 -left-16 size-60 rounded-full bg-[#d96f42]/15"
              />

              <div className="relative flex flex-col items-center">
                <h2 className="font-display mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.03em]">
                  Make your own
                  <br />
                  <span className="italic text-[#efac8b]">coffee scrub.</span>
                </h2>

                <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/65">
                  Choose your preferred recipe and let our smart dispenser do
                  the rest.
                </p>

                <button
                  type="button"
                  onClick={() => onNext(true)}
                  className="mt-8 inline-flex min-h-14 cursor-pointer items-center justify-center gap-3 rounded-full bg-[#d96f42] px-8 py-3 text-base font-bold text-white shadow-[0_10px_25px_rgba(217,111,66,0.3)] transition hover:-translate-y-0.5 hover:bg-[#bd5933] active:translate-y-0"
                >
                  Continue
                  <Icon name="arrow" size={20} />
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
      {scanState !== "idle" && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-[#20261f]/70 p-4 backdrop-blur-sm"
          role="dialog"
        >
          {scanState === "scanning" ? (
            <section className="w-full max-w-sm rounded-[2rem] bg-[#f7f4ec] p-10 text-center shadow-[0_30px_90px_rgba(20,25,19,0.35)]">
              <div className="relative mx-auto grid size-28 place-items-center overflow-hidden rounded-3xl bg-white text-[#d96f42] shadow-sm">
                <Icon name="scan" size={48} />
                <span className="scan-line absolute left-3 right-3 top-4 h-0.5 bg-[#d96f42] shadow-[0_0_10px_rgba(217,111,66,0.8)]" />
              </div>
              <p className="font-display mt-7 text-3xl font-semibold text-[#30372d]">
                Scanning QR code…
              </p>
              <p className="mt-3 text-sm text-[#777d72]">
                Connecting to Grounds to Glow AI
              </p>
            </section>
          ) : (
            <section className="flex h-[min(860px,92vh)] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-[#f5f2ea] shadow-[0_30px_90px_rgba(20,25,19,0.35)]">
              <header className="flex items-center justify-between border-b border-[#dfe0d7] px-5 py-4 sm:px-6">
                <div>
                  <p className="font-display text-xl font-semibold text-[#30372d]">
                    Grounds to Glow AI
                  </p>
                  <p className="text-xs text-[#747a6e]">
                    Ask questions and take the skincare quiz
                  </p>
                </div>
                <button
                  className="cursor-pointer rounded-full border border-[#d5d8ce] bg-white px-5 py-2.5 text-sm font-bold text-[#555d50] transition hover:border-[#d96f42]"
                  onClick={() => setScanState("idle")}
                  type="button"
                >
                  Close chat
                </button>
              </header>
              <iframe
                allow="clipboard-write"
                className="min-h-0 flex-1 border-0 bg-white"
                src={chatbotUrl}
                title="Grounds to Glow AI chatbot"
              />
            </section>
          )}
        </div>
      )}
    </>
  )
}

type Ingredient = {
  key: "coffee" | "sugar" | "oil"
  label: string
  unit: string
  value: number
  icon: IconName
}

function Recipe({
  name,
  quiz,
  onDispense,
}: {
  name: string
  quiz: boolean
  onDispense: (ingredients: Ingredient[]) => void
}) {
  const recipes = {
    gentle: {
      name: "Gentle",
      description: "Less coffee grounds",
      coffee: 3,
      sugar: 6,
      oil: 7.5,
    },
    standard: {
      name: "Standard",
      description: "Balanced exfoliation",
      coffee: 5,
      sugar: 6,
      oil: 7.5,
    },
    moisturising: {
      name: "Moisturising",
      description: "More moisturising oil",
      coffee: 5,
      sugar: 6,
      oil: 10,
    },
  } as const

  type RecipeKey = keyof typeof recipes

  const [selectedRecipe, setSelectedRecipe] = useState<RecipeKey>("standard")

  const recipe = recipes[selectedRecipe]

  const ingredients: Ingredient[] = [
    {
      key: "coffee",
      label: "Dried coffee grounds",
      unit: "g",
      value: recipe.coffee,
      icon: "bean",
    },
    {
      key: "sugar",
      label: "Sugar",
      unit: "g",
      value: recipe.sugar,
      icon: "sugar",
    },
    {
      key: "oil",
      label: "Oil",
      unit: "ml",
      value: recipe.oil,
      icon: "bottle",
    },
  ]

  const warnings = [
    {
      title: "Sensitive skin",
      text: "Coffee grounds, sugar and essential oils may cause irritation. Avoid using the scrub on sensitive or damaged skin.",
    },
    {
      title: "Avoid sensitive areas",
      text: "Do not apply the scrub to your face, around your eyes, or on broken or irritated skin.",
    },
    {
      title: "Allergies",
      text: "Check all ingredients before use, as some may cause allergic reactions or skin irritation.",
    },
    {
      title: "Stop if irritation occurs",
      text: "Rinse off immediately if you experience redness, itching, burning or discomfort.",
    },
  ]

  const makeSteps = [
    "Take a paper cup provided at the kiosk and place it under the smart dispenser.",
    "Choose your preferred coffee scrub recipe using the options above.",
    "Click “Dispense coffee scrub” to dispense the ingredients.",
    "Optionally, add 1–2 drops of an essential oil provided at the kiosk for added fragrance.",
    "Use the provided spoon to mix the ingredients thoroughly.",
    "Your DIY coffee scrub is ready to use!",
  ]

  const sectionTitle =
    "font-display text-3xl font-semibold tracking-[-0.03em] text-[#30372d]"

  const ingredientDescription = {
    coffee: "Exfoliates",
    sugar: "Smooths",
    oil: "Moisturises",
  }

  return (
    <main className="flex flex-1 flex-col px-6 pb-16 lg:px-16">
      {/* SECTION 1: BEFORE YOU START */}
      <section aria-labelledby="warnings-title" className="py-7">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[#b83a2a] text-lg font-bold text-white"
          >
            !
          </span>

          <h2
            id="warnings-title"
            className="font-display text-3xl font-semibold text-[#30372d]"
          >
            Before you start
          </h2>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {warnings.map((warning, index) => (
            <div
              key={warning.title}
              className="rounded-[1.5rem] border border-[#e5e0d5] bg-white p-5 md:p-6"
            >
              <div className="flex items-start gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f2e8d8] text-sm font-bold text-[#937451]">
                  {index + 1}
                </span>

                <div>
                  <h3 className="font-bold text-[#394136]">{warning.title}</h3>

                  <p className="mt-1.5 text-sm leading-relaxed text-[#6f756a]">
                    {warning.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: MAKE YOUR OWN COFFEE SCRUB */}
      <section
        aria-labelledby="steps-title"
        className="border-t border-[#dcddd4] py-7"
      >
        <div>
          <h2
            id="steps-title"
            className="mt-1 font-display text-3xl font-semibold text-[#30372d]"
          >
            Make your own coffee scrub
          </h2>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {/* PREPARATION PANEL */}
          <div className="rounded-[1.5rem] border border-[#dfe7da] bg-white p-6 md:p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-[#e5eddf] text-[#587353]">
                <Icon name="bean" />
              </span>

              <div>
                <h3 className="text-lg font-bold text-[#394136]">
                  Preparation
                </h3>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {makeSteps.slice(0, 3).map((instruction, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e6ede0] text-xs font-bold text-[#587353]">
                    {index + 1}
                  </span>

                  <p className="text-sm leading-relaxed text-[#6f756a]">
                    {instruction}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* FINISHING PANEL */}
          <div className="rounded-[1.5rem] border border-[#eadfce] bg-white p-6 md:p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-[#f2e8d8] text-[#937451]">
                <Icon name="bottle" />
              </span>

              <div>
                <h3 className="text-lg font-bold text-[#394136]">
                  Finishing touches
                </h3>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {makeSteps.slice(3).map((instruction, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#f2e8d8] text-xs font-bold text-[#937451]">
                    {index + 4}
                  </span>

                  <p className="text-sm leading-relaxed text-[#6f756a]">
                    {instruction}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: RECIPE SELECTION */}

      <section
        aria-labelledby="recipe-title"
        className="border-t border-[#dcddd4] py-7"
      >
        <div className="mb-7">
          <h2 id="recipe-title" className={sectionTitle}>
            Choose your coffee scrub recipe
          </h2>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-[0_22px_70px_rgba(55,59,49,0.08)] md:p-8 lg:p-10">
          {/* Recipe options */}

          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.entries(
              recipes,
            ) as [RecipeKey, typeof recipes[RecipeKey]][]).map(
              ([key, option]) => {
                const isSelected = selectedRecipe === key

                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedRecipe(key)}
                    className={`relative cursor-pointer rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-[#d96f42] bg-[#fff5ee]"
                        : "border-[#e8e9e2] bg-[#fafaf7] hover:border-[#c8cbbf]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-bold text-[#373e34]">
                        {option.name}
                      </span>

                      <span
                        aria-hidden="true"
                        className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                          isSelected
                            ? "border-[#d96f42] bg-[#d96f42] text-white"
                            : "border-[#c5c9be]"
                        }`}
                      >
                        {isSelected && (
                          <span className="text-xs font-bold">✓</span>
                        )}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-[#858a80]">
                      {option.description}
                    </p>
                  </button>
                )
              },
            )}
          </div>

          {/* Ingredient breakdown */}

          <div className="mt-9 border-t border-[#eeeee6] pt-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#373e34]">
                  Ingredients
                </h3>

                <p className="mt-1 text-sm text-[#858a7f]">
                  {recipe.name} recipe · Single-use portion
                </p>
              </div>

              <span className="rounded-full bg-[#eef2e9] px-4 py-2 text-xs font-semibold text-[#587353]">
                3 ingredients
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {ingredients.map((ingredient) => (
                <div
                  key={ingredient.key}
                  className="flex items-center gap-4 rounded-2xl bg-[#f8f8f4] p-4"
                >
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-xl ${
                      ingredient.key === "coffee"
                        ? "bg-[#e7d7c8] text-[#6c432c]"
                        : ingredient.key === "sugar"
                          ? "bg-[#edeae0] text-[#777265]"
                          : "bg-[#dfe9d8] text-[#5b7653]"
                    }`}
                  >
                    <Icon name={ingredient.icon} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#373e34]">
                      {ingredient.label}
                    </p>

                    <p className="mt-0.5 text-xs text-[#8a8e84]">
                      {
                        ingredientDescription[
                          (ingredient.key as keyof typeof ingredientDescription)
                        ]
                      }
                    </p>

                    <p className="mt-2 text-xl font-bold text-[#31382e]">
                      {ingredient.value}
                      <span className="ml-1 text-xs font-semibold text-[#999d93]">
                        {ingredient.unit}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispensing action */}

          <div className="mt-8 border-t border-[#eeeee6] pt-7">
            <div className="flex items-center justify-center">
              <PrimaryButton
                className="w-full bg-[#d96f42] px-8 py-4 shadow-[0_10px_25px_rgba(217,111,66,0.24)] hover:bg-[#bd5933] sm:w-auto"
                onClick={() => onDispense(ingredients)}
              >
                Dispense coffee scrub
              </PrimaryButton>
            </div>
          </div>
        </div>
      </section>
      {/* SECTION 4: USAGE & STORAGE */}
      <section
        aria-labelledby="usage-title"
        className="border-t border-[#dcddd4] pt-7"
      >
        <div>
          <h2
            id="usage-title"
            className="mt-1 font-display text-3xl font-semibold text-[#30372d]"
          >
            Usage & storage instructions
          </h2>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {/* USAGE PANEL */}
          <div className="rounded-[1.5rem] border border-[#dfe7da] bg-white p-6 md:p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-[#e5eddf] text-[#587353]">
                <Icon name="bean" />
              </span>

              <div>
                <h3 className="text-lg font-bold text-[#394136]">How to use</h3>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {[
                "Apply a small amount to clean, damp body skin.",
                "Massage gently in circular motions without excessive scrubbing and keep on for 3 - 5 minutes.",
                "Avoid your face, eye area, and broken or irritated skin.",
                "Rinse with lukewarm water and gently pat your skin dry.",
              ].map((instruction, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e6ede0] text-xs font-bold text-[#587353]">
                    {index + 1}
                  </span>

                  <p className="text-sm leading-relaxed text-[#6f756a]">
                    {instruction}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* STORAGE PANEL */}
          <div className="rounded-[1.5rem] border border-[#eadfce] bg-white p-6 md:p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-[#f2e8d8] text-[#937451]">
                <Icon name="bottle" />
              </span>

              <div>
                <h3 className="text-lg font-bold text-[#394136]">
                  Storage & disposal
                </h3>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {[
                "Use the coffee scrub immediately after preparation.",
                "Do not store or reuse leftover scrub to minimise microbial contamination.",
              ].map((instruction, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#f2e8d8] text-xs font-bold text-[#937451]">
                    {index + 1}
                  </span>

                  <p className="text-sm leading-relaxed text-[#6f756a]">
                    {instruction}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function Dispensing({ name, onDone }: { name: string onDone: () => void }) {
  const [progress, setProgress] = useState(8)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 100) {
          window.clearInterval(timer)
          window.setTimeout(onDone, 700)
          return 100
        }
        return Math.min(100, value + 4)
      })
    }, 90)
    return () => window.clearInterval(timer)
  }, [onDone])

  return (
    <main className="grid flex-1 place-items-center px-6 pb-10 text-center">
      <div className="w-full max-w-xl">
        <div className="relative mx-auto grid size-48 place-items-center rounded-full bg-[#e6ebdf] text-[#4d6547]">
          <div className="absolute inset-3 animate-[spin_3s_linear_infinite] rounded-full border-2 border-dashed border-[#75916d]" />
          <Icon name="cup" size={72} />
        </div>
        <h1 className="font-display mt-3 text-5xl font-medium tracking-[-0.04em] text-[#293027]">
          Dispensing ingredients...
        </h1>
        <p className="mt-4 text-[#757a70]">
          Please keep your cup in place while each ingredient is dispensed.
        </p>
        <div className="mt-8 h-3 overflow-hidden rounded-full bg-[#dcddd5]">
          <div
            className="h-full rounded-full bg-[#d96f42] transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-sm font-bold text-[#6a7065]">
          <span>{progress}%</span>
        </div>
      </div>
    </main>
  )
}

function Thanks({ name, onRestart }: { name: string onRestart: () => void }) {
  return (
    <main className="grid flex-1 place-items-center px-6 pb-10 text-center">
      <section className="w-full max-w-3xl rounded-[2rem] bg-[#30392d] px-8 py-12 text-white sm:px-12 sm:py-14">
        {/* SUCCESS ICON */}
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#d96f42]">
          <Icon name="check" size={26} />
        </span>

        {/* HEADING */}
        <h1 className="font-display mx-auto mt-6 max-w-2xl text-[clamp(2.25rem,4vw,3.25rem)] font-medium leading-[1.15] tracking-[-0.04em]">
          Thanks for giving coffee grounds
          <br />
          <span className="text-[#efac8b]">a second life, </span> {name}!
        </h1>

        {/* INSTRUCTIONS */}
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/70">
          Your coffee scrub is ready! Mix well, apply gently to damp skin, and
          rinse thoroughly. Patch test before first use.
        </p>

        {/* FINISH BUTTON */}
        <button
          type="button"
          onClick={onRestart}
          className="mt-8 cursor-pointer rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-[#30392d]"
        >
          Back to kiosk
        </button>
      </section>
    </main>
  )
}

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type QuizAnswer = {
  label: string
  value: string
}

const quizQuestions: { question: string answers: QuizAnswer[] }[] = [
  {
    question: "1. How would you describe your skin?",
    answers: [
      { label: "Normal", value: "normal" },
      { label: "Dry", value: "dry" },
      { label: "Oily", value: "oily" },
      { label: "Sensitive or easily irritated", value: "sensitive" },
    ],
  },
  {
    question:
      "2. Do you currently have any skin irritation, sunburn, broken skin or known allergies to the ingredients?",
    answers: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
  {
    question: "3. What level of exfoliation do you prefer?",
    answers: [
      { label: "Gentle", value: "gentle" },
      { label: "Moderate", value: "moderate" },
    ],
  },
  {
    question: "4. What texture would you prefer?",
    answers: [
      { label: "Light and grainy", value: "light-grainy" },
      { label: "More moisturising", value: "moisturising" },
    ],
  },
]

function getBuiltInGuidance(question: string) {
  const text = question.toLowerCase()

  if (
    /(what is this|what'?s this|what is grounds to glow|tell me about this)/.test(
      text,
    )
  ) {
    return "This is Grounds to Glow, an initiative by SMU’s Office of Campus Infrastructure & Services (OCIS). The kiosk gives used coffee grounds from across SMU a second life as a DIY body scrub, helping reduce campus waste, raise environmental awareness, and promote circularity."
  }
  if (
    /(what can i do|what do i do|how does this work|help me get started|where do i start)/.test(
      text,
    )
  ) {
    return "Here, you can learn how SMU repurposes used coffee grounds, take the “Find Your Coffee Scrub” skincare quiz, review your recommended recipe, and use the smart dispenser.\n\nPlace a provided paper cup under the dispenser, choose your recipe, dispense the ingredients, optionally add 1–2 drops of essential oil, and mix with the provided spoon. Use the scrub immediately."
  }
  if (/(free|cost|charge|price|pay|payment)/.test(text)) {
    return "Yes. It is free of charge to use the Grounds to Glow kiosk and dispense coffee scrubs."
  }
  if (/(mix|make|recipe|ingredient|amount|quantit)/.test(text)) {
    return "The standard one-use recipe is 5 g dried coffee grounds, 6 g sugar, and 7.5 ml oil, measured by the smart dispenser.\n\n1. Place a provided paper cup under the dispenser.\n2. Choose the standard recipe or take the skincare quiz.\n3. Select “Dispense Coffee Scrub.”\n4. Optionally add 1–2 drops of an essential oil available at the kiosk.\n5. Mix thoroughly with the provided spoon and use immediately."
  }
  if (/(who|behind|created|ocis)/.test(text)) {
    return "Grounds to Glow is an initiative by SMU’s Office of Campus Infrastructure & Services (OCIS). It was created to give used coffee grounds a second life beyond composting, reduce campus waste, raise environmental awareness, and promote circularity in the SMU community."
  }
  if (
    /(where|come from|collect|bin|building|volunteer|dehydrat|drying|kiosk work)/.test(
      text,
    )
  ) {
    return "Used coffee grounds are collected from staff pantries across SMU’s seven buildings in smart collection bins. Volunteers transport them to the kiosk, where a solar dehydrator dries the grounds before they are prepared for scrub use, subject to appropriate hygiene and safety checks. The kiosk’s smart dispenser then measures the main ingredients."
  }
  if (/(benefit|skin|smooth|exfoliat|antioxidant|refresh)/.test(text)) {
    return "Coffee scrubs may help remove dead skin cells so skin feels smoother and softer, and exfoliation may temporarily improve its appearance and texture. Coffee contains antioxidant compounds, but the benefits of applying grounds directly to skin are not well established. Its aroma may also make exfoliation enjoyable."
  }
  if (/(use|apply|shower|rinse|body)/.test(text)) {
    return "Apply a small amount to clean, damp body skin and massage gently in circular motions without excessive scrubbing. Do not use it on your face, around your eyes, or on broken or irritated skin. Rinse with lukewarm water and gently pat dry."
  }
  if (
    /(sensitive|allerg|warning|face|eye|rash|reaction|itch|burn|irritat|damaged)/.test(
      text,
    )
  ) {
    return "Coffee grounds, sugar, and essential oils may irritate sensitive or damaged skin. Check the ingredients for potential allergies, and do not apply the scrub to your face, around your eyes, or on broken or irritated skin. If you experience redness, itching, burning, or discomfort, rinse immediately and discontinue use."
  }
  if (/(store|keep|last|shelf)/.test(text)) {
    return "Use the scrub immediately after preparation. Do not store or reuse leftover scrub, to minimise the risk of microbial contamination."
  }
  if (/(quiz|recommend|personal)/.test(text)) {
    return "The “Find Your Coffee Scrub” quiz can recommend:\n\n• Gentle Coffee Scrub: 3 g coffee grounds, 6 g sugar, and 7.5 ml oil.\n• Standard Coffee Scrub: 5 g coffee grounds, 6 g sugar, and 7.5 ml oil.\n• Moisturising Coffee Scrub: 5 g coffee grounds, 6 g sugar, and 10 ml oil.\n\nCoffee scrub is not recommended for sensitive or easily irritated skin, or if you currently have irritation, sunburn, broken skin, or relevant ingredient allergies."
  }
  if (/(waste|environment|sustain|reuse|repurpose|circular|why)/.test(text)) {
    return "Grounds to Glow repurposes used coffee grounds into a DIY body scrub instead of treating them as immediate waste. The proposed SMU initiative aims to reduce campus waste, increase environmental awareness, and promote circularity within the SMU community."
  }

  return "That information is unavailable in the Grounds to Glow materials I was given. I can help with the SMU project, collection process, solar dehydrator, kiosk, recipe, skincare quiz, safe use, and storage."
}

function MobileChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I’m Grounds to Glow AI at Singapore Management University. Ask me about the project, collection process, kiosk, coffee scrub preparation, safe use, or the skincare quiz.",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [quizStep, setQuizStep] = useState<number | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<string[]>([])
  const [recommendation, setRecommendation] = useState<{
    name: string
    coffee: number
    sugar: number
    oil: number
  } | null>(null)
  const [quizWarning, setQuizWarning] = useState(false)
  const [usingBuiltInGuide, setUsingBuiltInGuide] = useState(false)
  const chatEnd = useMemo(() => ({ id: "chat-end" }), [])

  useEffect(() => {
    document.getElementById(chatEnd.id)?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading, quizStep, chatEnd])

  const startQuiz = () => {
    setRecommendation(null)
    setQuizWarning(false)
    setQuizAnswers([])
    setQuizStep(0)
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: `Find Your Coffee Scrub\n\n${quizQuestions[0].question}`,
      },
    ])
  }

  const answerQuiz = (answer: QuizAnswer) => {
    if (quizStep === null) return
    const answers = [...quizAnswers, answer.value]
    setQuizAnswers(answers)
    setMessages((current) => [
      ...current,
      { role: "user", content: answer.label },
    ])

    const nextStep = quizStep + 1
    if (nextStep < quizQuestions.length) {
      setQuizStep(nextStep)
      window.setTimeout(() => {
        setMessages((current) => [
          ...current,
          { role: "assistant", content: quizQuestions[nextStep].question },
        ])
      }, 250)
      return
    }

    const [skin, hasContraindication, exfoliation, texture] = answers
    const shouldAvoid = skin === "sensitive" || hasContraindication === "yes"
    const matchedRecommendation = shouldAvoid
      ? null
      : skin === "dry" || texture === "moisturising"
        ? { name: "Moisturising Coffee Scrub", coffee: 5, sugar: 6, oil: 10 }
        : exfoliation === "gentle"
          ? { name: "Gentle Coffee Scrub", coffee: 3, sugar: 6, oil: 7.5 }
          : { name: "Standard Coffee Scrub", coffee: 5, sugar: 6, oil: 7.5 }
    setQuizWarning(shouldAvoid)
    setRecommendation(matchedRecommendation)
    setQuizStep(null)
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: shouldAvoid
            ? "Based on your answers, do not use the scrub. The supplied safety guidance says to avoid it if you have sensitive or damaged skin, irritation, sunburn, broken skin, or known ingredient allergies."
            : `Quiz complete. Your result is ${matchedRecommendation?.name}. Review the recommended quantities below, then return to the kiosk to dispense.`,
        },
      ])
    }, 250)
  }

  const sendMessage = async (text = input) => {
    const cleanText = text.trim()
    if (!cleanText || loading) return

    const userMessage: ChatMessage = { role: "user", content: cleanText }
    const conversation = [...messages, userMessage]
    setMessages(conversation)
    setInput("")
    setLoading(true)
    setQuizStep(null)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0a06d4c5/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ messages: conversation.slice(-12) }),
        },
      )
      const responseText = await response.text()
      let result: { reply?: string error?: string } = {}
      try {
        result = JSON.parse(responseText)
      } catch {
        throw new Error(responseText || "Unable to reach the AI guide.")
      }
      if (!response.ok || !result.reply)
        throw new Error(result.error || "Unable to reach the AI guide.")
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.reply },
      ])
      setUsingBuiltInGuide(false)
    } catch {
      setUsingBuiltInGuide(true)
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: getBuiltInGuidance(cleanText),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#eeeee6] text-[#30372d]">
      <header className="sticky top-0 z-10 border-b border-[#dfe0d7] bg-[#f7f5ef]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Brand />
          <span className="flex items-center gap-2 rounded-full bg-[#e2ebdc] px-3 py-1.5 text-xs font-bold text-[#506849]">
            <span className="size-2 rounded-full bg-[#67915d]" />{" "}
            {usingBuiltInGuide ? "Built-in guide" : "AI ready"}
          </span>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-76px)] max-w-2xl flex-col px-4 pb-32 pt-5">
        <div className="mb-5 rounded-2xl bg-[#30392d] p-5 text-white">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#d96f42]">
              <Icon name="sparkle" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold">
                Grounds to Glow AI
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-white/70">
                {usingBuiltInGuide
                  ? "Using reviewed built-in guidance while the AI connection is unavailable."
                  : "Coffee scrub guidance powered by Gemini. Don’t share personal or medical information."}
              </p>
            </div>
          </div>
        </div>

        <div aria-live="polite" className="flex-1 space-y-4">
          {messages.map((message, index) => (
            <div
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
              key={`${message.role}-${index}`}
            >
              <div
                className={`max-w-[86%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  message.role === "user"
                    ? "rounded-br-sm bg-[#d96f42] text-white"
                    : "rounded-bl-sm bg-white text-[#444b40]"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2">
              {[
                "What can I do here?",
                "How do I mix it?",
                "Why reuse coffee grounds?",
              ].map((prompt) => (
                <button
                  className="cursor-pointer rounded-full border border-[#d4d7cc] bg-white px-4 py-2 text-sm font-semibold text-[#5d6558] shadow-sm transition hover:border-[#d96f42]"
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {quizStep !== null && (
            <div className="grid gap-2 pl-2 sm:grid-cols-2">
              {quizQuestions[quizStep].answers.map((answer) => (
                <button
                  className="cursor-pointer rounded-xl border border-[#d9dbd2] bg-white px-4 py-3 text-left text-sm font-bold text-[#4e564a] shadow-sm transition hover:border-[#d96f42] hover:bg-[#fff8f3]"
                  key={answer.value}
                  onClick={() => answerQuiz(answer)}
                  type="button"
                >
                  {answer.label}
                </button>
              ))}
            </div>
          )}

          {recommendation && (
            <section className="rounded-3xl border border-[#d8ddd1] bg-[#f9f7f1] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[#e2ebdc] text-[#55704f]">
                  <Icon name="check" />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-semibold">
                    {recommendation.name}
                  </h2>
                  <p className="text-xs text-[#7c8177]">
                    Body scrub · quiz recommendation
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["Coffee", recommendation.coffee, "g"],
                  ["Sugar", recommendation.sugar, "g"],
                  ["Oil", recommendation.oil, "ml"],
                ].map(([label, value, unit]) => (
                  <div
                    className="rounded-2xl bg-white p-3 text-center"
                    key={label}
                  >
                    <span className="block text-xl font-bold text-[#343c32]">
                      {value}
                    </span>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#969a91]">
                      {unit}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-[#666d61]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-[#777d72]">
                Patch test first. Use gentle pressure on damp body skin, avoid
                irritated areas, and rinse well.
              </p>
            </section>
          )}

          {quizWarning && (
            <section className="rounded-3xl border border-[#e5c4b5] bg-[#fff6ef] p-5 text-sm leading-relaxed text-[#774833] shadow-sm">
              <strong className="block text-[#633923]">
                Scrub not recommended
              </strong>
              Avoid using the scrub if you have sensitive or damaged skin,
              irritation, sunburn, broken skin, or known ingredient allergies.
              If irritation occurs, rinse immediately and discontinue use.
            </section>
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-1.5 rounded-2xl rounded-bl-sm bg-white px-4 py-4 shadow-sm">
                <span className="size-2 animate-bounce rounded-full bg-[#93998d]" />
                <span className="size-2 animate-bounce rounded-full bg-[#93998d] [animation-delay:120ms]" />
                <span className="size-2 animate-bounce rounded-full bg-[#93998d] [animation-delay:240ms]" />
              </div>
            </div>
          )}
          <div id={chatEnd.id} />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-[#d8dbd1] bg-[#f7f5ef]/95 p-3 backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 flex justify-between gap-2">
            <button
              className="flex cursor-pointer items-center gap-2 rounded-full bg-[#e5ecdf] px-3 py-2 text-xs font-bold text-[#506a49]"
              onClick={startQuiz}
              type="button"
            >
              <Icon name="sparkle" size={16} /> Take skin quiz
            </button>
            <a
              className="rounded-full px-3 py-2 text-xs font-bold text-[#747a6e]"
              href={window.location.pathname}
            >
              Back to kiosk
            </a>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage()
            }}
          >
            <input
              aria-label="Message Glow Guide"
              className="h-12 min-w-0 flex-1 rounded-full border border-[#d5d8ce] bg-white px-5 text-sm outline-none placeholder:text-[#9ca096] focus:border-[#d96f42]"
              disabled={loading}
              maxLength={2000}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your coffee scrub…"
              value={input}
            />
            <button
              aria-label="Send message"
              className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full bg-[#30392d] text-white transition hover:bg-[#d96f42] disabled:opacity-40"
              disabled={!input.trim() || loading}
              type="submit"
            >
              <Icon name="arrow" size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function KioskApp() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [quiz, setQuiz] = useState(false)

  const restart = () => {
    setStep(0)
    setName("")
    setQuiz(false)
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f4f1e9] text-[#30372d]">
      <div className="noise pointer-events-none fixed inset-0 opacity-[0.035]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col">
        <TopBar onHome={restart} step={step} />
        {step === 0 && <Welcome onStart={() => setStep(1)} />}
        {step === 1 && (
          <CheckIn name={name} onName={setName} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <Guide
            name={name}
            onNext={(withQuiz) => {
              setQuiz(withQuiz)
              setStep(3)
            }}
          />
        )}
        {step === 3 && (
          <Recipe name={name} quiz={quiz} onDispense={() => setStep(4)} />
        )}
        {step === 4 && <Dispensing name={name} onDone={() => setStep(5)} />}
        {step === 5 && <Thanks name={name} onRestart={restart} />}
      </div>
    </div>
  )
}

export default function App() {
  return new URLSearchParams(window.location.search).get("chat") === "1" ? (
    <MobileChat />
  ) : (
    <KioskApp />
  )
}
