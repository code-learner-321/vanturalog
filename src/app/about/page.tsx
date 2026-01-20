import React from 'react'

export default function about() {
  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-20 py-8 lg:py-12">
      <div className="flex flex-col sm:grid sm:grid-cols-12 gap-10 lg:gap-16">
        <div className="sm:col-span-8 flex flex-col order-1">
          <div className="mb-4">
            <span className="uppercase tracking-[0.2em] text-[10px] sm:text-xs font-bold text-primary mb-2 block">The Author</span>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-4 lg:mb-6">Dominic Vale</h1>
          </div>
          <div className="relative py-6 sm:py-8 my-4 border-y border-primary/10">
            <h2 className="text-[#181610] dark:text-white/90 italic text-xl sm:text-2xl lg:text-3xl font-medium leading-snug">
              "To travel is to discover that everyone is wrong about other countries."
            </h2>
            <p className="text-primary text-xs sm:text-sm font-bold mt-4 tracking-widest uppercase">— Aldous Huxley</p>
          </div>
          <div className="prose prose-sm sm:prose-lg dark:prose-invert max-w-none text-[#4a453e] dark:text-white/70 leading-relaxed font-display space-y-6 text-base sm:text-lg">
            <p>
              I didn't start my career in a newsroom or a photography studio. I started on a one-way flight to Tbilisi with nothing but a Leica Q2 and a Moleskine notebook that smelled of cedarwood. Since then, my life has been defined by the intersections of geography and human narrative.
            </p>
            <p>
              As a documentary writer and photographer, I seek the quiet moments that the headlines miss. Whether it's the morning rituals of tea pickers in Sri Lanka or the architectural resilience of Lisbon's Alfama district, my mission is to bridge the gap between "tourist" and "witness."
            </p>
            <div className="bg-background-alt dark:bg-gray-800/30 p-6 sm:p-8 rounded-xl border-l-4 border-primary my-8 lg:my-10" id="philosophy">
              <h3 className="text-[#181610] dark:text-white text-xl sm:text-2xl font-bold mb-4">My Philosophy</h3>
              <p className="text-sm sm:text-lg">
                I believe in <strong>Slow Documentation</strong>. The world moves fast enough; our stories shouldn't. I spend weeks, sometimes months, in a single location before I ever consider publishing a word. My philosophy is rooted in radical empathy and the belief that the most profound truths are often whispered, not shouted.
              </p>
            </div>
            <h3 className="text-[#181610] dark:text-white text-xl sm:text-2xl font-bold pt-4">The Mission</h3>
            <p className="text-sm sm:text-lg">
              Through this journal, I hope to offer more than just a travel guide. I want to give you a lens. This portfolio serves as a repository of cultural insights, visual essays, and the occasional reflection on the ethics of modern exploration. I want to inspire you to not just see the world, but to feel its weight and its wonder.
            </p>
          </div>
          <div className="mt-12 sm:mt-16 pt-8 border-t border-primary/10">
            <p className="text-[10px] sm:text-xs uppercase tracking-widest text-[#8d7c5e] mb-2">With gratitude,</p>
            <p className="font-handwritten text-3xl sm:text-4xl text-primary mt-4">Dominic Vale</p>
          </div>
        </div>
        <aside className="sm:col-span-4 space-y-8 sm:space-y-10 order-2">
          <div className="w-full">
            {/* FIXED: Style prop changed from string to object */}
            <div 
              className="bg-center bg-no-repeat aspect-[4/5] bg-cover rounded-xl shadow-2xl transition-all duration-700" 
              data-alt="Dominic Vale Smiling in Study" 
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDWCTBuAncghK567Lem0-OgD2Nm-0rKMQFBkHydNxXhr8F_oxK-P4UUWmp3Bl6Wyut6NgFDWzaVc3ma7gpXgtgCuW_cONfnFzij8sZzrez6H3fjWVPfSwOvnKhoAAKkMH2bdMrEvWe3tB8b06laq2h7gAJ_N4WExC9RVWrRuIfhiLbkLUowbB60Yq9Fe_SLy50YjfPBxj-5zK0ahRKF8B5wwBljVkvoaOZPgUrtvg4CtH4U8zJqwxYD4ujHFE50wga-pOS7m8wX6YBd")' }}
            >
            </div>
          </div>
          <div className="bg-background-alt dark:bg-gray-800/50 p-6 sm:p-8 rounded-xl border border-primary/5">
            <h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              Fast Facts
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:gap-8">
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-primary font-bold mb-1">Based In</p>
                <p className="text-base sm:text-lg">Lisbon, Portugal</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-primary font-bold mb-1">Favorite City</p>
                <p className="text-base sm:text-lg">Kyoto, Japan</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-primary font-bold mb-1">Essential Gear</p>
                <p className="text-sm sm:text-base text-[#4a453e] dark:text-white/70 leading-snug">Leica Q2, Peak Design Messenger, Moleskine Journal</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-primary font-bold mb-1">Must-Reads</p>
                <ul className="text-sm sm:text-base text-[#4a453e] dark:text-white/70 list-none p-0 space-y-1">
                  <li>• "The Art of Travel" - Alain de Botton</li>
                  <li>• "The Old Patagonian Express" - Paul Theroux</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="bg-background-alt dark:bg-gray-800/50 p-6 rounded-xl border border-primary/5 overflow-hidden">
            <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">public</span>
              Travel Radius
            </h3>
            <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-white dark:bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center p-4">
              {/* FIXED: Style prop changed from string to object */}
              <div 
                className="w-full h-full opacity-30 dark:opacity-20 bg-cover bg-center" 
                data-alt="Travel Map" 
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBD4ug4IdM_CkzybFUKV-dxAOokde7ZNeAH2wA9wUzsyaGRsNUsk760yQAoEMFV0Tn8PbL59zCQoAqtunCdN0a9dFpmkKX0Q36LXfpBEAVykcirNj3L1gFXcjnZCLqw_VBj0UtCd1qMsj_tPECfIjmowhYpqlstQh2yrR_HM38UiRfIgfm4bJgl-Dn_6u62J17eN19bXKaK-ZNTwgunDKbgVxDdD1rMPrBW7d2i-pTnPigtVwx5MURE33TLGTCf1VVQslBCjWmJXFwl")' }}
              >
              </div>
              <div className="absolute top-[48%] left-[32%] size-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#ffa600]"></div>
              <div className="absolute top-[45%] left-[45%] size-3 bg-primary/60 rounded-full"></div>
              <div className="absolute top-[60%] left-[80%] size-3 bg-primary/60 rounded-full"></div>
              <div className="absolute top-[30%] left-[20%] size-3 bg-primary/60 rounded-full"></div>
            </div>
            <p className="text-[10px] sm:text-xs text-[#8d7c5e] mt-4 text-center italic">Currently exploring the Iberian Peninsula</p>
          </div>
          <div className="flex justify-center gap-8 py-4">
            <a className="text-[#8d7c5e] hover:text-primary transition-colors" href="#">
              <svg className="size-6 sm:size-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.412.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.013 3.584-.07 4.85c-.054 1.17-.249 1.805-.413 2.227-.217.562-.477.96-.896 1.382-.42.419-.819.679-1.381.896-.422.164-1.057.36-2.227.413-1.266.057-1.646.07-4.85.07s-3.584-.013-4.85-.07c-1.17-.054-1.805-.249-2.227-.413-.562-.217-.96-.477-1.382-.896-.419-.42-.679-.819-.896-1.381-.164-.422-.36-1.057-.413-2.227-.057-1.266-.07-1.646-.07-4.85s.013-3.584.07-4.85c.054-1.17.249-1.805.413-2.227.217-.562.477-.96.896-1.382.42-.419.819-.679 1.381-.896.422-.164 1.057-.36 2.227-.413 1.266-.057 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.277.057-2.15.26-2.914.557-.79.307-1.459.717-2.126 1.384-.667.667-1.077 1.335-1.384 2.126-.297.763-.5 1.637-.557 2.914-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.057 1.277.26 2.15.557 2.914.307.79.717 1.459 1.384 2.126.667.667 1.335 1.077 2.126 1.384.763.297 1.637.5 2.914.557 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.277-.057 2.15-.26 2.914-.557.79-.307 1.459-.717 2.126-1.384.667-.667 1.077-1.335 1.384-2.126.297-.763.5-1.637.557-2.914.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.057-1.277-.26-2.15-.557-2.914-.307-.79-.717-1.459-1.384-2.126-.667-.667-1.335-1.077-2.126-1.384-.763-.297-1.637-.5-2.914-.557-1.28-.058-1.688-.072-4.947-.072z"></path><path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path></svg>
            </a>
            <a className="text-[#8d7c5e] hover:text-primary transition-colors" href="#">
              <svg className="size-6 sm:size-7" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path></svg>
            </a>
            <a className="text-[#8d7c5e] hover:text-primary transition-colors" href="#">
              <svg className="size-6 sm:size-7" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
            </a>
          </div>
        </aside>
      </div>
    </main>
  )
}