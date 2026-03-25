const fs = require('fs');
const content = fs.readFileSync('app/[lang]/dramabox/watch/page.tsx', 'utf8');

const updated = content.replace(
    /<div className="lg:sticky[\s\S]*?(<button[\s\S]*?\{ep\.chapterIndex \+ 1\}[\s\S]*?<\/button>\s*);\s*\}\)\}\s*<\/div>\s*<\/div>\s*<\/div>/,
    \<div className="lg:sticky lg:top-24 flex h-[600px] flex-col rounded-xl bg-[#a0d1d6] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                                  <div className="flex-none border-b-[3px] border-black p-4 bg-[#a0d1d6] z-10 flex justify-between items-center">
                                      <div>
                                          <h3 className="text-lg font-black text-black uppercase tracking-tight">Daftar Episode</h3>
                                          <p className="text-sm font-bold text-black/70">Total {episodes.length} Episode</p>
                                      </div>
                                      <div className="px-3 py-1 bg-[#ffb6c1] border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                                          <span className="text-xs font-black text-black">FREE !</span>
                                      </div>
                                  </div>

                                  <div
                                      className="flex-1 overflow-y-auto p-4 overscroll-contain"
                                      onWheel={(e) => e.stopPropagation()}
                                  >
                                      <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-3 gap-3">
                                          {episodes.map((ep) => {
                                              const isActive = ep.chapterIndex === currentEpIndex;
                                              return (
                                                  <button
                                                      key={ep.chapterId}
                                                      id={\ep-\\}
                                                      onClick={() => selectEpisode(ep.chapterIndex)}
                                                      className={\lex items-center justify-center rounded-lg py-3 text-base font-black transition-all hover:-translate-y-1 active:scale-95 border-2 border-black \\}
                                                  >
                                                      <span className="text-[#6b21a8]">{\\\}</span>
                                                  </button>
                                              );
                                          })}
                                      </div>
                                  </div>
                              </div>\
);
fs.writeFileSync('app/[lang]/dramabox/watch/page.tsx', updated);
