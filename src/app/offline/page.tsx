export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f6f1] px-6 text-[#153c33]">
      <section className="w-full max-w-md rounded-[28px] border border-[#dfe7e1] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#0b493c] text-2xl text-[#f1bd5a]">✦</div>
        <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#778a82]">Swatantra Aawaj</p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight">Your voice is still here.</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6c8078]">The app shell is ready. Reconnect when you want fresh community updates; your demo interactions remain safely on this device.</p>
        <a href="/" className="mt-6 inline-flex rounded-xl bg-[#123f34] px-5 py-3 text-sm font-bold text-white">Return to the app</a>
      </section>
    </main>
  );
}
